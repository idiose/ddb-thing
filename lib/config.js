import { isString, isBoolean, isFunction } from './utils';

const options = {};
const optionsMem = {
  tableRoot: '',
  operatorPrefix: '$',
  attributePrefix: '#',
  response: false,
  responseHandler: () => {},
  created: 'created',
  modified: 'modified',
  consumedCapacity: undefined,
  collectionMetrics: undefined,
  consistentRead: undefined,
  defaults: true,
  required: true,
  validate: true,
  setters: true,
  getters: true,
};

const strings = ['tableRoot', 'operatorPrefix', 'attributePrefix', 'consumedCapacity', 'collectionMetrics'];
for (const option of strings) {
  Object.defineProperty(options, option, {
    get: () => optionsMem[option],
    set: (val) => {
      if (!isString(val)) throw new Error('expected a string value');
      return (optionsMem[option] = val);
    },
  });
}

const booleans = ['response', 'consistentRead', 'defaults', 'required', 'validate', 'setters', 'getters'];
for (const option of booleans) {
  Object.defineProperty(options, option, {
    get: () => optionsMem[option],
    set: (val) => {
      if (!isBoolean(val)) throw new Error('expected a boolean value');
      return (optionsMem[option] = val);
    },
  });
}

Object.defineProperty(options, 'responseHandler', {
  get: () => optionsMem.responseHandler,
  set: (val) => {
    if (!isFunction(val)) throw new Error('expected a function');
    return (optionsMem.responseHandler = val);
  },
});

const timestamps = {};
for (const option of ['created', 'modified']) {
  Object.defineProperty(timestamps, option, {
    get: () => optionsMem[option],
    set: (val) => {
      if (!isString(val)) throw new Error('expected a string value');
      return (optionsMem[option] = val);
    },
  });
}

Object.defineProperty(options, 'timestamps', { value: timestamps });


// ** ==== ** //
const errors = {};
const at = path => `(at '${path}')`;
const expected = value => `expected value '${value}' to`;
const errorsMem = {
  type: (path, type) => `expected type '${type}' ${at(path)}`,
  required: path => `attribute '${path}' is required`,
  unrecognized: path => `unrecognized attribute '${path}'`,
  enum: (path, type, value, values) => `${expected(value)} be in (${values.join(', ')}) ${at(path)}`,
  match: (path, type, value, regExp) => `${expected(value)} match ${regExp} ${at(path)}`,
  minlength: (path, type, value, min) => `${expected(value)} be at least ${min} characters in length ${at(path)}`,
  maxlength: (path, type, value, max) => `${expected(value)} be at most ${max} characters in length ${at(path)}`,
  min: (path, type, value, min) => `${expected(value)} be at least ${min} ${at(path)}`,
  max: (path, type, value, max) => `${expected(value)} be at most ${max} ${at(path)}`,
};

for (const name of Object.keys(errorsMem)) {
  Object.defineProperty(errors, name, {
    get: () => errorsMem[name],
    set: (val) => {
      if (isString(val)) return (errorsMem[name] = val);
      if (isFunction(val)) {
        if (!isString(val())) throw new Error('error functions must return a string');
        return (errorsMem[name] = val);
      }
      throw new Error('errors must either be a string or a function that returns a string');
    },
  });
}


// ** ==== ** //
const config = {};
Object.defineProperties(config, {
  options: { value: options },
  errors: { value: errors },
});

export { errors, options };
export default config;

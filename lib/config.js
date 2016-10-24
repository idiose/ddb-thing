import { isType } from './utils';

const config = {};

const stringProps = {
  tableRoot: '',
  operatorPrefix: '$',
  attributePrefix: '#',
};

for (const prop of Object.keys(stringProps)) {
  Object.defineProperty(config, prop, {
    get: () => stringProps[prop],
    set: (val) => {
      if (!isType('String', val)) throw new Error(`${prop} must be a string`);
      return (stringProps[prop] = val);
    },
  });
}

const at = path => `(at '${path}')`;
const expected = value => `expected value '${value}' to`;
const errorProps = {
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

export const errors = {};

for (const name of Object.keys(errorProps)) {
  Object.defineProperty(errors, name, {
    get: () => errorProps[name],
    set: (val) => {
      if (isType('String', val)) return (errorProps[name] = val);
      if (isType('Function', val)) {
        if (!isType('String', val())) throw new Error('error functions must return a string');
        return (errorProps[name] = val);
      }
      throw new Error('errors must either be a string or a function that returns a string');
    },
  });
}

Object.defineProperty(config, 'errors', { value: errors });

export default config;

import { isString } from './utils';

const config = {};

const configStringsSrc = {
  tableRoot: '',
};

Object.keys(configStringsSrc).forEach((name) => {
  Object.defineProperty(config, name, {
    get: () => configStringsSrc[name],
    set: (val) => {
      if (!isString(val)) throw new Error(`${name} must be a string`);
      return (configStringsSrc[name] = val);
    },
  });
});

const path = '{PATH}';
const value = '{VALUE}';
const type = '{TYPE}';
const option = '{OPTION}';
const atPath = `(at '${path}')`;

const errorSrc = {
  type: `expected type '${type}' ${atPath}`,
  required: `attribute '${path}' is required`,
  unrecognized: `unrecognized attribute '${path}'`,
  enum: `expected value '${value}' to be in (${option}) ${atPath}`,
  match: `expected value '${value}' to match ${option} ${atPath}`,
  minlength: `expected value '${value}' to be at least ${option} characters in length ${atPath}`,
  maxlength: `expected value '${value}' to be at most ${option} characters in length ${atPath}`,
  min: `expected value '${value}' to be at least ${option} ${atPath}`,
  max: `expected value '${value}' to be at most ${option} ${atPath}`,
};

export const errors = {};

Object.keys(errorSrc).forEach((name) => {
  Object.defineProperty(errors, name, {
    get: () => errorSrc[name],
    set: (val) => {
      if (!isString(val)) throw new Error('errors are required to be strings');
      return (errorSrc[name] = val);
    },
  });
});

Object.defineProperty(config, 'errors', { value: errors });

export default config;

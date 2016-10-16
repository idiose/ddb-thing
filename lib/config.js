import { isString } from './utils';

const config = {};

let tableRoot = '';

Object.defineProperty(config, 'tableRoot', {
  get: () => tableRoot,
  set: (value) => {
    if (!isString(value)) throw new Error('table root must be a string');
    tableRoot = value;
  },
});

const path = '{PATH}';
const value = '{VALUE}';
const type = '{TYPE}';
const option = '{OPTION}';
const atPath = `(at '${path}')`;

export const errors = new Proxy({
  type: `expected type '${type}' ${atPath}`,
  unrecognized: `unrecognized attribute '${path}'`,
  enum: `expected value '${value}' to be in (${option}) ${atPath}`,
  match: `expected value '${value}' to match ${option} ${atPath}`,
  minlength: `expected value '${value}' to be at least ${option} characters in length ${atPath}`,
  maxlength: `expected value '${value}' to be at most ${option} characters in length ${atPath}`,
  min: `expected value '${value}' to be at least ${option} ${atPath}`,
  max: `expected value '${value}' to be at most ${option} ${atPath}`,
}, {
  set: (target, name, newValue) => {
    if (!isString(newValue)) throw new Error('expected a string');
    if (!target[name]) throw new Error(`unrecognized property '${name}'`);
    Object.assign(target, { [name]: newValue });
  },
});

Object.defineProperty(config, 'errors', { value: errors });

export default config;

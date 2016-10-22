import config from './config';
import { isType } from './utils';

const { operatorPrefix: prefix } = config;
const operators = [];

function define(name, options = {}, renderer) {
  const { parse = true, requirePath, requireType: type } = options;
  operators.push(name);
  Object.defineProperty(operators, name, {
    value: {
      parse,
      render: (path, value) => {
        if (requirePath && !path) {
          throw new Error(`${prefix}${name} requires an attribute path`);
        }
        if (type && !isType(type, value)) {
          throw new Error(`${prefix}${name} requires argument type ${type}`);
        }
        return renderer(path, value);
      },
    },
  });
}

const comparators = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
for (const [name, comparator] of Object.entries(comparators)) {
  define(name, { requirePath: true }, (path, value) => `${path} ${comparator} ${value}`);
}

const requirePathAndArray = { requirePath: true, requireType: 'Array' };
define('between', requirePathAndArray, (path, [low, high]) => `${path} BETWEEN ${low} AND ${high}`);
define('in', requirePathAndArray, (path, values) => `${path} IN (${values.join(', ')})`);
define('nin', requirePathAndArray, (path, values) => `NOT ${path} IN (${values.join(', ')})`);

define('exists', { requirePath: true, requireType: 'Boolean', parse: false }, (path, value) => {
  const method = (value) ? 'attribute_exists' : 'attribute_not_exists';
  return `${method}(${path})`;
});

const methods = { type: 'attribute_type', beginsWith: 'begins_with', contains: 'contains' };
for (const [name, method] of Object.entries(methods)) {
  define(name, { requirePath: true }, (path, value) => `${method}(${path}, ${value})`);
}

define('size', { requirePath: true, parse: false }, path => `size(${path})`);

const sizeError = path => new Error(`invalid use of '${prefix}size' operator ('${path}')`);
Object.defineProperty(operators, 'validSizeOperator', {
  value: (path) => {
    if (path.match(new RegExp(`\\${prefix}size`, 'g')).length > 1) throw sizeError(path);
    if (!path.endsWith(`.${prefix}size`)) throw sizeError(path);
    return path.replace(`.${prefix}size`, '');
  },
});

const requireArray = { requireType: 'Array' };
const logicals = { or: 'OR', and: 'AND' };
for (const [name, joinder] of Object.entries(logicals)) {
  define(name, requireArray, (path, values) => {
    const conditions = values.join(` ${joinder} `);
    return (path) ? `( ${conditions} )` : conditions;
  });
}

define('nor', requireArray, (path, values) => `NOT ( ${values.join(' OR ')} )`);
define('not', {}, (path, value) => `NOT ${value}`);

// set remove add delete

export default operators;

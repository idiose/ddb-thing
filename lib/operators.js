const prefix = '$';
const operators = {};

function ensurePath(operator, path) {
  if (!path) throw new Error(`${operator} requires an attribute path`);
}

function ensureType(operator, type, value) {
  if (value.constructor.name !== type.name) throw new Error(`${operator} requires argument type ${type.name}`);
}

function define(name, { shouldParse = true, requirePath, requireType } = {}, renderer) {
  const operator = `${prefix}${name}`;
  operators[operator] = {
    shouldParse,
    render: (path, value) => {
      if (requirePath) ensurePath(operator, path);
      if (requireType) ensureType(operator, requireType, value);
      return renderer(path, value);
    },
  };
}

const comparators = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
for (const [name, comparator] of Object.entries(comparators)) {
  define(name, { requirePath: true }, (path, value) => `${path} ${comparator} ${value}`);
}

const requirePathAndArray = { requirePath: true, requireType: Array };
define('between', requirePathAndArray, (path, [low, high]) => `${path} BETWEEN ${low} AND ${high}`);
define('in', requirePathAndArray, (path, values) => `${path} IN (${values.join(', ')})`);
define('nin', requirePathAndArray, (path, values) => `NOT ${path} IN (${values.join(', ')})`);

define('exists', { requirePath: true, requireType: Boolean, shouldParse: false }, (path, value) => {
  const method = (value) ? 'attribute_exists' : 'attribute_not_exists';
  return `${method}(${path})`;
});

const methods = { type: 'attribute_type', beginsWith: 'begins_with', contains: 'contains' };
for (const [name, method] of Object.entries(methods)) {
  define(name, { requirePath: true }, (path, value) => `${method}(${path}, ${value})`);
}

const size = `${prefix}size`;
const match = new RegExp(`\\${size}`, 'g');
const sizeError = input => new Error(`invalid use of ${size} operator '${input}'`);
const validSizeOperator = (input) => {
  if (input.match(match).length > 1) throw sizeError(input);
  if (!input.endsWith(`.${size}`)) throw sizeError(input);
  return input.replace(`.${size}`, '');
};

define('size', { requirePath: true, shouldParse: false }, path => `size(${path})`);

const requireArray = { requireType: Array };
const logicals = { or: 'OR', and: 'AND' };
for (const [name, joinder] of Object.entries(logicals)) {
  define(name, requireArray, (path, values) => {
    const conditions = values.join(` ${joinder} `);
    return (path) ? `( ${conditions} )` : conditions;
  });
}

define('nor', requireArray, (path, values) => `NOT ( ${values.join(' OR ')} )`);
define('not', {}, (path, value) => `NOT ${value}`);

export { prefix, operators, validSizeOperator };

import config from './config';
import { isType, typeOf } from './utils';

const { operatorPrefix: prefix } = config;
const operators = {};

const requirePath = (name, path) => {
  if (!path) throw new Error(`${prefix}${name} requires an attribute path`);
};

const requireType = (name, value, type) => {
  if (!isType(type, value)) throw new Error(`${prefix}${name} requires argument type ${type}`);
  if (type === 'Object' && !Object.keys(value).length) {
    throw new Error(`${prefix}${name} requires a non-empty object`);
  }
  if (type === 'Number' && isNaN(value)) {
    throw new Error(`${prefix}${name} requires argument type ${type}`);
  }
};

function define(name, options = {}, render) {
  const { parses = true, requirePath: pathRequired, requireType: typeRequired } = options;
  operators[name] = (path, input, { parse }) => {
    if (pathRequired) requirePath(name, path);
    if (typeRequired) requireType(name, input, typeRequired);
    const value = (parses) ? parse(input, path || name) : input;
    return render(path, value);
  };
}

const comparators = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
for (const [name, comparator] of Object.entries(comparators)) {
  define(name, { requirePath: true }, (path, value) => `${path} ${comparator} ${value}`);
}

const requirePathAndArray = { requirePath: true, requireType: 'Array' };
define('between', requirePathAndArray, (path, [low, high]) => `${path} BETWEEN ${low} AND ${high}`);
define('in', requirePathAndArray, (path, values) => `${path} IN (${values.join(', ')})`);
define('nin', requirePathAndArray, (path, values) => `NOT ${path} IN (${values.join(', ')})`);

define('exists', { requirePath: true, requireType: 'Boolean', parses: false }, (path, value) => {
  const method = (value) ? 'attribute_exists' : 'attribute_not_exists';
  return `${method}(${path})`;
});

const methods = {
  type: 'attribute_type',
  beginsWith: 'begins_with',
  contains: 'contains',
  append: 'list_append',
  ine: 'if_not_exists',
};
for (const [name, method] of Object.entries(methods)) {
  define(name, { requirePath: true }, (path, value) => `${method}(${path}, ${value})`);
}
define('prepend', { requirePath: true }, (path, value) => `list_append(${value}, ${path})`);

operators.size = (operand, { parseString, names }) => {
  const error = `invalid use of ${prefix}size operator '${operand}'`;
  const match = new RegExp(`\\${prefix}size`, 'g');
  if (operand.match(match).length > 1) throw new Error(error);
  if (!operand.startsWith(`${prefix}size:`)) throw new Error(error);
  const path = parseString(operand.replace(`${prefix}size:`, ''), names);
  return `size(${path})`;
};

const logicals = { or: 'OR', and: 'AND' };
for (const [name, joinder] of Object.entries(logicals)) {
  define(name, { requireType: 'Array' }, (path, values) => {
    const conditions = values.join(` ${joinder} `);
    return (path) ? `( ${conditions} )` : conditions;
  });
}

define('nor', { requireType: 'Array' }, (path, values) => `NOT ( ${values.join(' OR ')} )`);
define('not', {}, (path, value) => `NOT ${value}`);

operators.inc = (path, input, { parse }) => {
  requireType('inc', input, 'Number');
  const value = parse(Math.abs(input));
  const operator = (input < 0) ? '-' : '+';
  return `${path} ${operator} ${value}`;
};

operators.set = (path, input, { parse }) => {
  requireType('set', input, 'Object');
  const sets = Object.entries(input).map(([operand, value]) => {
    const eq = `${prefix}eq`;
    // TO-DO: ensure operand isn't operator?
    if (isType('Object', value)) {
      if (!isType('Undefined', value[eq])) return parse({ [operand]: value }, path);
      return Object.entries(value).map(([subOp, subVal]) => parse({ [operand]: { [eq]: { [subOp]: subVal } } }, path)).join(', ');
    }
    return parse({ [operand]: { [eq]: value } }, operand);
  });
  return `SET ${sets.join(', ')}`;
};

operators.remove = (path, input, { parseString, names }) => {
  if (!['String', 'Array'].includes(typeOf(input))) {
    throw new Error(`${prefix}remove requires a path or a list of paths`);
  }
  const paths = (isType('Array', input)) ? input : [input];
  paths.forEach((val) => {
    if (!isType('String', val)) throw new Error(`${prefix}remove requires a path or a list of paths`);
  });
  const removes = paths.map(name => parseString(name, names));
  return `REMOVE ${removes.join(', ')}`;
};

operators.add = (path, input, { parse, parseString, names }) => {
  requireType('add', input, 'Object');
  const adds = Object.entries(input).map(([operand, arg]) => {
    const name = parseString(operand, names);
    return `${name} ${parse(arg, operand)}`;
  });
  return `ADD ${adds.join(', ')}`;
};

operators.delete = (path, input, { parse, parseString, names }) => {
  requireType('delete', input, 'Object');
  const deletes = Object.entries(input).map(([operand, arg]) => {
    const name = parseString(operand, names);
    return `${name} ${parse(arg, operand)}`;
  });
  return `DELETE ${deletes.join(', ')}`;
};

export default operators;

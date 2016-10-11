const prefix = '$';
const operators = {};
const noParse = [];

function requirePath(operator, path) {
  if (!path) throw new Error(`${operator} requires an attribute path`);
}

function requireType(operator, type, value) {
  if (value.constructor.name !== type.name) throw new Error(`${operator} requires argument type ${type.name}`);
}

function defineOperator(name, options = {}, render) {
  const operator = `${prefix}${name}`;
  if (options.noParse) noParse.push(operator);

  if (render) {
    operators[operator] = (path, value) => {
      if (options.requirePath) requirePath(operator, path);
      if (options.requireType) requireType(operator, options.requireType, value);
      return render(path, value);
    };
  }

  return {
    comparisonOperator: (comparator) => {
      operators[operator] = (path, value) => {
        requirePath(operator, path);
        return `${path} ${comparator} ${value}`;
      };
    },
    functionalOperator: (functionName) => {
      operators[operator] = (path, value) => {
        requirePath(operator, path);
        return `${functionName}(${path}, ${value})`;
      };
    },
    logicalOperator: (joinder) => {
      operators[operator] = (path, values) => {
        requireType(operator, Array, values);
        const conditions = values.join(` ${joinder} `);
        return (path) ? `( ${conditions} )` : conditions;
      };
    },
  };
}

const eq = 'eq';
const eqOperator = `${prefix}${eq}`;
defineOperator(eq).comparisonOperator('=');
defineOperator('ne').comparisonOperator('<>');
defineOperator('gt').comparisonOperator('>');
defineOperator('gte').comparisonOperator('>=');
defineOperator('lt').comparisonOperator('<');
defineOperator('lte').comparisonOperator('<=');

const pathAndArray = { requirePath: true, requireType: Array };
defineOperator('between', pathAndArray, (path, [low, high]) => `${path} BETWEEN ${low} AND ${high}`);
defineOperator('in', pathAndArray, (path, values) => `${path} IN (${values.join(', ')})`);
defineOperator('nin', pathAndArray, (path, values) => `NOT ${path} IN (${values.join(', ')})`);

defineOperator('exists', { requirePath: true, requireType: Boolean, noParse: true }, (path, value) => {
  const method = (value) ? 'attribute_exists' : 'attribute_not_exists';
  return `${method}(${path})`;
});

defineOperator('type').functionalOperator('attribute_type');
defineOperator('beginsWith').functionalOperator('begins_with');
defineOperator('contains').functionalOperator('contains');

const size = 'size';
defineOperator(size, { requirePath: true, noParse: true }, path => `size(${path})`);
const sizeOperator = `${prefix}${size}`;
const match = new RegExp(`\\${sizeOperator}`, 'g');
const sizeError = input => new Error(`invalid ${sizeOperator} structure '${input}'`);
const validSizeOperator = (input) => {
  if (input.match(match).length > 1) throw sizeError(input);
  if (!input.endsWith(`.${sizeOperator}`)) throw sizeError(input);
  return input.replace(`.${sizeOperator}`, '');
};

defineOperator('or').logicalOperator('OR');
defineOperator('and').logicalOperator('AND');

defineOperator('not', {}, (path, value) => `NOT ${value}`);
defineOperator('nor', { requireType: Array }, (path, values) => `NOT ( ${values.join(' OR ')} )`);

export { noParse, operators, eqOperator, sizeOperator, validSizeOperator };

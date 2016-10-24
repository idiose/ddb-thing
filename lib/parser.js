import config from './config';
import { typeOf, isType } from './utils';
import operators from './operators';
import AttributeList from './attribute-list';

const { operatorPrefix, attributePrefix } = config;

const eq = operators.eq;
const size = operators.size;

const isEndput = input => ['String', 'Number', 'Boolean', 'Null'].includes(typeOf(input));
const isOperator = (input) => {
  if (!input.startsWith(operatorPrefix)) return false;
  if (Object.keys(operators).includes(input.slice(operatorPrefix.length))) return true;
  return false;
};

export default function parseExpressions(expressionInputs) {
  if (!isType('Object', expressionInputs) || !Object.keys(expressionInputs).length) return {};

  const names = new AttributeList({ prefix: '#' });
  const values = new AttributeList({ prefix: ':' });

  function parseString(string, list) {
    if (string.includes(`${operatorPrefix}size`)) return size(string, { names, parseString });
    if (string.startsWith(attributePrefix)) return list.add(string.slice(attributePrefix.length));
    return string.split('.').map(val => list.add(val)).join('.');
  }

  let joinder;

  function parse(input, path) {
    if (isType('String', input)) return parseString(input, values);
    if (isEndput(input)) return values.add(input);
    if (isType('Array', input)) return input.map(operand => parse(operand, path));

    if (!isType('Object', input)) throw new Error('invalid input argument'); // necessary?

    return Object.entries(input).reduce((expression, [key, value]) => {
      const finish = segment => ((expression) ? `${expression}${joinder}${segment}` : segment);

      if (isOperator(key)) {
        const operator = operators[key.slice(operatorPrefix.length)];
        return finish(operator(path, value, { parse, parseString, names, values }));
      }

      const readiedName = parseString(key, names);
      if (isEndput(value)) return finish(eq(readiedName, value, { parse }));
      return finish(parse(value, readiedName));
    }, null);
  }

  const results = Object.entries(expressionInputs).reduce((expressions, [name, operands]) => {
    if (name === 'ProjectionExpression') {
      if (!isType('Array', operands)) throw new Error('projection expression expects array');
      const projection = operands.map((path) => {
        if (!isType('String', path)) throw new Error('projection values must be strings');
        return parseString(path, names);
      }).join(', ');
      return Object.assign(expressions, { [name]: projection });
    }
    joinder = ' AND ';
    if (name === 'UpdateExpression') joinder = ' ';
    return Object.assign(expressions, { [name]: parse(operands) });
  }, {});

  return Object.assign(results, {
    ExpressionAttributeNames: names.map,
    ExpressionAttributeValues: values.map,
  });
}

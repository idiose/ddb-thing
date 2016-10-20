import config from './config';
import { typeOf, isType } from './utils';
import operators from './operators';

import AttributeList from './attribute-list';

const { operatorPrefix } = config;

const eq = operators.eq.render;
const size = operators.size.render;
const vso = operators.validSizeOperator;

const isEndput = val => ['String', 'Number', 'Boolean', 'Null'].includes(typeOf(val));
const isOperator = (key) => {
  if (!isType('String', key)) return false;
  if (!key.startsWith(operatorPrefix)) return false;
  if (operators.includes(key.slice(operatorPrefix.length))) return true;
  return false;
};

// Expressions: KeyCondition, Filter, Projection, Condition, Update

export default function parseExpressions(queries) {
  if (!isType('Object', queries) || !Object.keys(queries).length) return {};

  const names = new AttributeList({ prefix: '#' });
  const values = new AttributeList({ prefix: ':' });

  function parseString(string, list) {
    if (string.includes(`${operatorPrefix}size`)) return size(parseString(vso(string), names));
    // TO-DO: allow passing a prefix to indicate non-nested name
    return string.split('.').map(val => list.add(val)).join('.');
  }

  function parse(input, path) {
    if (isType('Undefined', input) || isOperator(input)) throw new Error(`invalid query argument '${input}'`);

    if (isType('String', input)) return parseString(input, values);
    if (isEndput(input)) return values.add(input);
    if (isType('Array', input)) return input.map(val => parse(val, path));

    return Object.entries(input).reduce((expression, [key, value]) => {
      const finish = segment => ((expression) ? `${expression} AND ${segment}` : segment);

      if (isOperator(key)) {
        const operator = operators[key.slice(operatorPrefix.length)];
        const readiedValue = (operator.parse) ? parse(value, path || key) : value;
        return finish(operator.render(path, readiedValue));
      }

      const readiedName = parseString(key, names);
      const readiedValue = parse(value, readiedName);
      if (isEndput(value)) return finish(eq(readiedName, readiedValue));
      return finish(readiedValue);
    }, null);
  }

  const expressions = Object.entries(queries)
  .reduce((obj, [name, query]) => Object.assign(obj, { [name]: parse(query) }), {});

  Object.assign(expressions, {
    ExpressionAttributeNames: names.map,
    ExpressionAttributeValues: values.map,
  });

  return expressions;
}

/*
import AttributeList from './attribute-list';
import { prefix, operators, validSizeOperator } from './operators';

const eq = operators[`${prefix}eq`].render;
const sizeOperator = `${prefix}size`;
const size = operators[sizeOperator].render;

const isEndput = input => ['string', 'number', 'boolean'].includes(typeof input) || input === null;

export default function parseExpression(queries) {
  const names = new AttributeList({ prefix: '#' });
  const values = new AttributeList({ prefix: ':' });

  const parseString = (string, list) => {
    if (string.includes(sizeOperator)) return size(parseString(validSizeOperator(string), names));
    // TO-DO: allow passing '#some.name.with.dots' to indicate a non-nested name
    return string.split('.').map(value => list.add(value)).join('.');
  };

  function parse(input, path) {
    if (Object.keys(operators).includes(input) || input === undefined) throw new Error(`invalid query argument '${input}'`);

    if (typeof input === 'string') return parseString(input, values);
    if (isEndput(input)) return values.add(input);
    if (Array.isArray(input)) return input.map(item => parse(item, path));

    return Object.entries(input).reduce((expression, [key, value]) => {
      const finish = segment => (expression ? `${expression} AND ${segment}` : segment);

      if (Object.keys(operators).includes(key)) {
        const operator = operators[key];
        const readiedValue = (operator.shouldParse) ? parse(value, path || key) : value;
        return finish(operator.render(path, readiedValue));
      }

      const readiedName = parseString(key, names);
      const readiedValue = parse(value, readiedName);
      if (isEndput(value)) return finish(eq(readiedName, readiedValue));
      return finish(readiedValue);
    }, null);
  }

  const results = Object.entries(queries).reduce((expression, [name, query]) => (
    Object.assign(expression, { [name]: parse(query) })
  ), {});

  Object.assign(results, {
    ExpressionAttributeNames: names.map,
    ExpressionAttributeValues: values.map,
  });

  return results;
}
*/

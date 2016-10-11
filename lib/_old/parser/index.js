import List from '../utils/list';
import { noParse, operators, eqOperator, sizeOperator, validSizeOperator } from './operators';

const size = operators[sizeOperator];
const eq = operators[eqOperator];

const endputs = ['string', 'number', 'boolean'];
const isEndput = input => endputs.includes(typeof input) || input === null;

export default function parseExpression(query) {
  const names = new List({ prefix: '#' });
  const values = new List({ prefix: ':' });

  const parseString = (string, list) => {
    if (string.includes(sizeOperator)) return size(parseString(validSizeOperator(string), names));
    return string.split('.').map(value => list.add(value)).join('.');
  };

  function parse(input, path) {
    if (Object.keys(operators).includes(input) || input === undefined) throw new Error(`cannot parse ${input}`); // TO-DO: better error

    if (typeof input === 'string') return parseString(input, values);
    if (isEndput(input)) return values.add(input);
    if (Array.isArray(input)) return input.map(item => parse(item, path));

    return Object.entries(input).reduce((expression, [key, value]) => {
      const finish = segment => (expression ? `${expression} AND ${segment}` : segment);

      if (Object.keys(operators).includes(key)) {
        const readiedValue = (noParse.includes(key)) ? value : parse(value, path || key);
        return finish(operators[key](path, readiedValue));
      }

      const readiedName = parseString(key, names);
      const readiedValue = parse(value, readiedName);
      if (isEndput(value)) return finish(eq(readiedName, readiedValue));
      return finish(readiedValue);
    }, undefined);
  }

  const Expression = parse(query);
  return { Expression, ExpressionAttributeNames: names.map, ExpressionAttributeValues: values.map };
}

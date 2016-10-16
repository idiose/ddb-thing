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

import AWS from 'aws-sdk';
import config from './config';
import schemaFrom from './schema';
import wrap from './wrapper';

const things = new Map();

function thing(name, definition, options = {}) {
  const { useRoot = true, cache = true } = options;
  const tableName = (useRoot) ? `${config.tableRoot}${name}` : name;
  if (!cache) return wrap(tableName, schemaFrom(definition));
  things.set(name, things.get(name) || wrap(tableName, schemaFrom(definition)));
  return things.get(name);
}

Object.defineProperties(thing, { config: { value: config }, AWS: { value: AWS } });

export default thing;

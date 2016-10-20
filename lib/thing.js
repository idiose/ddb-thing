import AWS from 'aws-sdk';
import config from './config';
import makeSchema from './schema';
import makeThing from './wrapper';

const { tableRoot } = config;

// const things = new Map();

function thing(name, definition, options = {}) {
  // const { useRoot = true, cache = true } = options;
  const { useRoot = true } = options;
  const tableName = (useRoot) ? `${tableRoot}${name}` : name;
  return makeThing(tableName, makeSchema(definition));
  /*
  if (!cache) return makeThing(tableName, makeSchema(definition));
  things.set(name, things.get(name) || makeThing(tableName, makeSchema(definition)));
  return things.get(name);
  */
}

Object.defineProperties(thing, { config: { value: config }, AWS: { value: AWS } });

export default thing;

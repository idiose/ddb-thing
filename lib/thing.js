import AWS from 'aws-sdk';
import { options as config, errors } from './config';
import schemaFrom from './schema';
import wrapperFor from './wrapper';

function thing(name, definition, options = {}) {
  const { useRoot = true } = options;
  const tableName = (useRoot) ? `${config.tableRoot}${name}` : name;
  return wrapperFor(tableName, schemaFrom(definition));
}

Object.defineProperties(thing, {
  options: { value: config },
  errors: { value: errors },
  AWS: { value: AWS },
});

export default thing;

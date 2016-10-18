import types from './types';
import { errors } from './config';
import {
  isString,
  isBool,
  isObject,
  isArray,
  isUndefined,
  isType,
  without,
  checkMessage,
  expected,
  thingError,
} from './utils';

const compelArray = input => (isArray(input) ? input : [input]);

function describePath(path, input) {
  const [type, message] = input.type;
  if (!type || !isString(type)) throw new Error(`invalid attribute description (at '${path}')`);
  const options = without(input, 'type');
  if (!Object.keys(types).includes(type)) throw new Error(`unrecognized attribute type '${type}' (at '${path}')`);
  checkMessage(path, message);
  for (const option of Object.keys(options)) {
    if (!types[type].options.includes(option)) {
      throw new Error(`unrecognized attribute option '${option}' for type '${type}' (at '${path}')`);
    }
  }

  const validators = [].concat(...Object.keys(types[type].validators)
    .filter(key => ({}.hasOwnProperty.call(options, key)))
    .map(validator => types[type].validators[validator](path, type, compelArray(options[validator]))));

  const setters = [].concat(...Object.keys(types[type].setters)
    .filter(key => ({}.hasOwnProperty.call(options, key)))
    .map(setter => types[type].setters[setter](path, type, compelArray(options[setter]))));

  const getters = [].concat(...Object.keys(types[type].getters)
    .filter(key => ({}.hasOwnProperty.call(options, key)))
    .map(getter => types[type].getters[getter](path, type, compelArray(options[getter]))));

  const description = { type, validators, setters, getters };

  if ({}.hasOwnProperty.call(options, 'required')) {
    if (!isBool(options.required)) throw expected('required', 'a boolean', path);
    description.required = options.required;
  }

  if ({}.hasOwnProperty.call(options, 'default')) {
    if (!isType(options.default, type)) throw expected('default', `a value with type '${type}'`, path);
    description.default = options.default;
  }

  return description;
}

function parseAttribute(path, input, parentPath) {
  const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
  const invalidDescription = new Error(`invalid attribute description (at '${fullPath}')`);
  const finish = description => ({ [path]: description });
  if (isString(input) || isArray(input)) return finish(describePath(fullPath, { type: compelArray(input) }));
  if (!isObject(input)) throw invalidDescription;
  if (input.type) {
    if (isString(input.type)) return finish(describePath(fullPath, Object.assign(input, { type: [input.type] })));
    if (isArray(input.type)) return finish(describePath(fullPath, input));
  }
  if (!Object.keys(input).length) throw invalidDescription;
  return finish(Object.entries(input).reduce((attributes, description) => (
    Object.assign(attributes, parseAttribute(...description, fullPath))
  ), {}));
}

function parseAttributes(input) {
  if (!isObject(input) || !Object.keys(input).length) throw new Error('invalid attributes description');
  return Object.entries(input).reduce((attributes, description) => (
    Object.assign(attributes, parseAttribute(...description))
  ), {});
}

function parseTimeStamps(input) {
  // TO-DO: ensure input is bool or object?
  const timestamps = { created: 'created', modified: 'modified' };
  if (input.created && isString(input.created)) timestamps.created = input.created;
  if (input.modified && isString(input.modified)) timestamps.modified = input.modified;
  return timestamps;
}

export default function (definition = {}) {
  if (!isObject(definition) || !Object.keys(definition).length) throw new Error('invalid schema definition');
  const schema = { timestamps: false };

  const { attributes, timestamps } = definition;
  if (!attributes) throw new Error('attribute definition required');
  schema.attributes = parseAttributes(attributes);
  if (timestamps) schema.timestamps = parseTimeStamps(timestamps);

  schema.setDefaults = (input, descriptions = schema.attributes) => Object.entries(descriptions)
  .reduce((output, [path, description]) => {
    const { type, default: defaultVal } = description;
    if (type && isString(type)) {
      if (!isUndefined(output[path])) return output;
      if (!isUndefined(defaultVal)) return Object.assign(output, { [path]: defaultVal });
      return output;
    }
    const defaults = schema.setDefaults(output[path] || {}, description);
    return (Object.keys(defaults).length) ? Object.assign(output, { [path]: defaults }) : output;
  }, input);

  schema.compelRequired = (input, descriptions = schema.attributes, parentPath) => {
    if (!isObject(input)) throw new Error('i dunno');
    for (const [path, description] of Object.entries(descriptions)) {
      const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
      const { type, required } = description;
      if (type && isString(type)) {
        if (required && isUndefined(input[path])) {
          throw thingError(errors.required, fullPath, null, type);
        }
      } else {
        schema.compelRequired(input[path] || {}, description, fullPath);
      }
    }
  };

  schema.validate = async (input, descriptions = schema.attributes, parentPath) => {
    if (!isObject(input)) throw new Error('validate uh oh');
    for (const [path, value] of Object.entries(input)) {
      const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
      const description = descriptions[path];
      if (!description) throw thingError(errors.unrecognized, fullPath, value);
      const { type, validators } = description;
      if (type && isString(type)) {
        if (!isType(value, type)) throw thingError(errors.type, fullPath, value, type);
        for (const validator of validators) {
          await Promise.resolve(validator(value));
        }
      } else {
        if (!isObject(value)) throw thingError(errors.type, fullPath, value, 'M');
        await schema.validate(value, description, fullPath);
      }
    }
    return;
  };

  schema.runSetters = (input, descriptions = schema.attributes) => {
    if (!isObject(input)) throw new Error('i dunno');
    return Object.entries(input).reduce((output, [path, value]) => {
      const description = descriptions[path];
      if (!description) return output;
      const { type, setters } = description;
      if (type && isString(type)) {
        const modified = setters.reduce((val, setter) => setter(val), value);
        return Object.assign(output, { [path]: modified });
      }
      return Object.assign(output, { [path]: schema.runSetters(value, description) });
    }, input);
  };

  schema.runGetters = (input, descriptions = schema.attributes) => {
    if (!isObject(input)) throw new Error('i dunno');
    return Object.entries(input).reduce((output, [path, value]) => {
      const description = descriptions[path];
      if (!description) return output;
      const { type, getters } = description;
      if (type && isString(type)) {
        const modified = getters.reduce((val, getter) => getter(val), value);
        return Object.assign(output, { [path]: modified });
      }
      return Object.assign(output, { [path]: schema.runGetters(value, description) });
    }, input);
  };

  // TO-DO: schema.hooks

  return schema;
}

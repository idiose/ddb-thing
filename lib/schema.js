import types from './types';
import { errors } from './config';
import { isString, isObject, isArray, isUndefined, isType, checkMessage, thingError } from './utils';

const makeArray = input => (isArray(input) ? input : [input]);

function describePath(path, { type: [type, message], ...options }) {
  if (!Object.keys(types).includes(type)) throw new Error(`unrecognized attribute type '${type}' (at '${path}')`);
  checkMessage(path, message);
  for (const option of Object.keys(options)) {
    if (!types[type].options.includes(option)) {
      throw new Error(`unrecognized attribute option '${option}' for type '${type}' (at '${path}')`);
    }
  }

  const validators = Object.keys(types[type].validators).filter(options.hasOwnProperty)
  .map(validator => types[type].validators[validator](path, type, makeArray(options[validator])));

  const setters = Object.keys(types[type].setters).filter(options.hasOwnProperty)
  .map(setter => types[type].setters[setter](path, type, makeArray(options[setter])));

  const getters = Object.keys(types[type].getters).filter(options.hasOwnProperty)
  .map(getter => types[type].getters[getter](path, type, makeArray(options[getter])));

  return { validators, setters, getters };
}

function parseAttribute(path, input) {
  const finish = description => ({ [path]: description });
  if (isString(input) || isArray(input)) return finish(describePath(path, { type: makeArray(input) }));
  if (!isObject(input)) throw new Error(`invalid attribute description (at '${path}')`);
  if (input.type && isString(input.type)) return finish(describePath(Object.assign(input, { type: [input.type] })));
  if (input.type && isArray(input.type)) return finish(describePath(path, input));
  return finish(Object.entries(input).reduce((attributes, description) => (
    Object.assign(attributes, parseAttribute(...description))
  ), {}));
}

function parseAttributes(input) {
  if (!(input && isObject(input))) throw new Error(`invalid attributes description '${input}'`);
  return Object.entries(input).reduce((attributes, description) => (
    Object.assign(attributes, parseAttribute(...description))
  ), {});
}

function parseTimeStamps(input) {
  const timestamps = { created: 'created', modified: 'modified' };
  if (input.created && isString(input.created)) timestamps.created = input.created;
  if (input.modified && isString(input.modified)) timestamps.modified = input.modified;
  return timestamps;
}

export default function (definition = {}) {
  if (definition.constructor.name !== 'Object') throw new Error(`invalid schema definition '${definition}'`);
  const schema = { timestamps: false };

  const { attributes, timestamps } = definition;
  schema.attributes = parseAttributes(attributes);
  if (timestamps) schema.timestamps = parseTimeStamps(timestamps);
  // hooks?

  schema.setDefaults = (input, descriptions = schema.attributes) => Object.entries(descriptions)
  .reduce((output, [path, description]) => {
    if ({}.hasOwnProperty.call(output, path)) return output;
    const { type, default: defaultVal } = description;
    if (type && isString(type)) {
      return (isUndefined(defaultVal)) ? output : Object.assign(output, { [path]: defaultVal });
    }
    const defaults = schema.setDefaults({}, description);
    return (Object.keys(defaults).length) ? Object.assign(output, { [path]: defaults }) : output;
  }, input);

  schema.validate = async (input, descriptions = schema.attributes, parentPath) => {
    if (!isObject(input)) throw new Error('i dunno');
    for (const [path, value] of Object.entries(input)) {
      const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
      const description = descriptions[path];
      if (!description) throw thingError(errors.unrecognized, fullPath, value);
      const { type, validators } = description;
      if (type && isString(type)) {
        if (!isType(value, type)) throw thingError(errors.type, fullPath, value, type);
        for (const validator of validators) {
          await Promise.resolve(validator(fullPath, type, value));
        }
      }
      await schema.validate(value, description, fullPath);
    }
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

  return schema;
}

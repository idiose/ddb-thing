import types from './types';
import { errors, options as config } from './config';
import {
  isType,
  isDefined,
  isString,
  isBoolean,
  isArray,
  isObject,
  isFunction,
  typeAliases,
  withoutKeys,
  thingError,
  expected,
  validateCustomError,
} from './utils';

const compelArray = input => ((isArray(input)) ? input : [input]);

function describePath(path, input) {
  const [typeAlias, customError] = input.type;
  if (!isDefined(typeAlias)) throw new Error(`invalid attribute description (at '${path}')`);
  if (!typeAliases.has(typeAlias)) throw new Error(`unrecognized attribute type '${typeAlias}' (at '${path}')`);
  const type = typeAliases.get(typeAlias);

  const options = withoutKeys(input, 'type');
  validateCustomError(path, customError);
  for (const option of Object.keys(options)) {
    if (!types[type].options.includes(option)) {
      throw new Error(`unrecognized attribute option '${option}' for type '${type}' (at '${path}')`);
    }
  }

  const validateType = (value) => {
    if (!isType(type, value)) {
      throw thingError(errors.type || customError, path, type, value);
    }
  };

  const validators = [validateType].concat(...Object.keys(types[type].validators)
    .filter(key => isDefined(options[key]))
    .map(validator => types[type].validators[validator](path, type, compelArray(options[validator]))));

  const setters = [].concat(...Object.keys(types[type].setters)
    .filter(key => isDefined(options[key]))
    .map(setter => types[type].setters[setter](path, type, compelArray(options[setter]))));

  const getters = [].concat(...Object.keys(types[type].getters)
    .filter(key => isDefined(options[key]))
    .map(getter => types[type].getters[getter](path, type, compelArray(options[getter]))));

  const description = { type, validators, setters, getters };

  if (isDefined(options.required)) {
    if (!isBoolean(options.required)) throw expected('required', 'a boolean', path);
    description.required = options.required;
  }

  if (isDefined(options.default)) {
    if (!isType(type, options.default)) throw expected('default', `a value with type '${type}'`, path);
    description.default = options.default;
  }

  return description;
}

function parseAttribute(path, input, parentPath) {
  const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
  const invalidDescription = new Error(`invalid attribute description (at '${fullPath}')`);
  const finish = description => ({ [path]: description });
  if (isString(input) || isFunction(input) || isArray(input)) {
    return finish(describePath(fullPath, { type: compelArray(input) }));
  }
  if (!isObject(input)) throw invalidDescription;
  const { type } = input;
  if (type) {
    if (isString(type) || isFunction(type)) {
      return finish(describePath(fullPath, Object.assign(input, { type: [type] })));
    }
    if (isArray(type)) return finish(describePath(fullPath, input));
  }
  if (!Object.keys(input).length) throw invalidDescription;
  return finish(Object.entries(input)
    .reduce((attributes, description) => Object.assign(attributes, parseAttribute(...description, fullPath)), {}));
}

function parseAttributes(input) {
  if (!isObject(input) || !Object.keys(input).length) throw new Error('invalid attributes description');
  return Object.entries(input)
    .reduce((attributes, description) => Object.assign(attributes, parseAttribute(...description)), {});
}

function parseTimeStamps(input) {
  const timestamps = { created: config.timestamps.created, modified: config.timestamps.modified };
  if (isBoolean(input)) return timestamps;
  if (!isObject(input)) throw new Error('invalid timestamp definition');
  Object.keys(input).forEach((key) => {
    if (!Object.keys(timestamps).includes(key)) throw new Error(`unrecognized timestamps option '${key}'`);
  });
  if (isDefined(input.created)) {
    if (!isString(input.created)) throw new Error('timestamps.created expects a string value');
    timestamps.created = input.created;
  }
  if (isDefined(input.modified)) {
    if (!isString(input.modified)) throw new Error('timestamps.modified expects a string value');
    timestamps.modified = input.modified;
  }
  return timestamps;
}

export default function (definition) {
  if (!isObject(definition) || !Object.keys(definition).length) throw new Error('invalid schema definition');

  const schema = {
    timestamps: false,
    response: false,
    defaults: true,
    required: true,
    validate: true,
    setters: true,
    getters: true,
  };

  const { attributes, timestamps } = definition;

  schema.attributes = parseAttributes(attributes);
  if (isDefined(timestamps)) schema.timestamps = parseTimeStamps(timestamps);

  const booleanOptions = ['response', 'defaults', 'required', 'validate', 'setters', 'getters', 'consistentRead'];
  for (const option of booleanOptions) {
    if (isDefined(definition[option])) {
      if (!isBoolean(definition[option])) throw new Error(`${option} expects a boolean value`);
      schema[option] = definition[option];
    }
  }

  const stringOptions = ['consumedCapacity', 'collectionMetrics'];
  for (const option of stringOptions) {
    if (isDefined(definition[option])) {
      if (!isString(definition[option])) throw new Error(`${option} expects a string value`);
      schema[option] = definition[option];
    }
  }

  if (isDefined(definition.responseHandler)) {
    if (!isFunction(definition.responseHandler)) throw new Error('responseHandler expects a function');
    schema.responseHandler = definition.responseHandler;
  }

  Object.keys(definition).forEach((key) => {
    if (!Object.keys(schema).includes(key)) throw new Error(`unrecognized definition property '${key}'`);
  });

  return schema;
}

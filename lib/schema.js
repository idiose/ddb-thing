import types from './types';
import { errors } from './config';
import { typeOf, isType, isThingType, withoutKeys, validateCustomError, thingError, expected } from './utils';

const compelArray = input => ((isType('Array', input)) ? input : [input]);

function describePath(path, input) {
  const [type, customError] = input.type;
  if (!isType('String', type)) throw new Error(`invalid attribute description (at '${path}')`);
  if (!types.includes(type)) throw new Error(`unrecognized attribute type '${type}' (at '${path}')`);

  const options = withoutKeys(input, 'type');
  validateCustomError(path, customError);
  for (const option of Object.keys(options)) {
    if (!types[type].options.includes(option)) {
      throw new Error(`unrecognized attribute option '${option}' for type '${type}' (at '${path}')`);
    }
  }

  const validateType = (value) => {
    if (!isThingType(type, value)) {
      throw thingError(errors.types || customError, path, type, value);
    }
  };

  const validators = [validateType].concat(...Object.keys(types[type].validators)
    .filter(key => !isType('Undefined', options[key]))
    .map(validator => types[type].validators[validator](path, type, compelArray(options[validator]))));

  const setters = [].concat(...Object.keys(types[type].setters)
    .filter(key => !isType('Undefined', options[key]))
    .map(setter => types[type].setters[setter](path, type, compelArray(options[setter]))));

  const getters = [].concat(...Object.keys(types[type].getters)
    .filter(key => !isType('Undefined', options[key]))
    .map(getter => types[type].getters[getter](path, type, compelArray(options[getter]))));

  const description = { type, validators, setters, getters };

  if (Object.hasOwnProperty.call(options, 'required')) {
    if (!isType('Boolean', options.required)) throw expected('required', 'a boolean', path);
    description.required = options.required;
  }

  if (Object.hasOwnProperty.call(options, 'default')) {
    if (!isThingType(type, options.default)) throw expected('default', `a value with type '${type}'`, path);
    description.default = options.default;
  }

  return description;
}

function parseAttribute(path, input, parentPath) {
  const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
  const invalidDescription = new Error(`invalid attribute description (at '${fullPath}')`);
  const finish = description => ({ [path]: description });
  if (isType('String', input) || isType('Array', input)) {
    return finish(describePath(fullPath, { type: compelArray(input) }));
  }
  if (!isType('Object', input)) throw invalidDescription;
  const { type } = input;
  if (type) {
    if (isType('String', type)) return finish(describePath(fullPath, Object.assign(input, { type: [type] })));
    if (isType('Array', type)) return finish(describePath(fullPath, input));
  }
  if (!Object.keys(input).length) throw invalidDescription;
  return finish(Object.entries(input)
  .reduce((attributes, description) => Object.assign(attributes, parseAttribute(...description, fullPath)), {}));
}

function parseAttributes(input) {
  if (!isType('Object', input) || !Object.keys(input).length) throw new Error('invalid attributes description');
  return Object.entries(input)
  .reduce((attributes, description) => Object.assign(attributes, parseAttribute(...description)), {});
}

function parseTimeStamps(input) {
  const timestamps = { created: 'created', modified: 'modified' };
  if (isType('Boolean', input)) return timestamps;
  if (!isType('Object', input)) throw new Error('invalid timestamp definition');
  if (isType('String', input.created)) timestamps.created = input.created;
  if (isType('String', input.modified)) timestamps.modified = input.modified;
  return timestamps;
}

export default function (definition) {
  if (!isType('Object', definition) || !Object.keys(definition).length) throw new Error('invalid schema definition');

  const schema = { timestamps: false };

  const { attributes, timestamps } = definition;
  if (timestamps) schema.timestamps = parseTimeStamps(timestamps);
  schema.attributes = parseAttributes(attributes);

  schema.setDefaults = (input, descriptions = schema.attributes) => Object.entries(descriptions)
  .reduce((output, [path, description]) => {
    const { type, default: defaultVal } = description;
    if (isType('String', type)) {
      if (!isType('Undefined', output[path])) return output;
      if (!isType('Undefined', defaultVal)) return Object.assign(output, { [path]: defaultVal });
      return output;
    }
    const defaults = schema.setDefaults(output[path] || {}, description);
    if (Object.keys(defaults).length) return Object.assign(output, { [path]: defaults });
    return output;
  }, input);

  schema.compelRequired = (input, descriptions = schema.attributes, parentPath) => {
    if (!isType('Object', input)) throw new Error(`unexpected value '${typeOf(input)}'`);
    for (const [path, description] of Object.entries(descriptions)) {
      const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
      const { type, required } = description;
      if (isType('String', type)) {
        if (required && isType('Undefined', input[path])) {
          throw thingError(errors.required, fullPath, type);
        }
      } else {
        schema.compelRequired(input[path] || {}, description, fullPath);
      }
    }
  };

  schema.validate = async (input, descriptions = schema.attributes, parentPath) => {
    if (!isType('Object', input)) throw new Error(`unexpected value '${typeOf(input)}'`);
    for (const [path, value] of Object.entries(input)) {
      const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
      const description = descriptions[path];
      if (!description) throw thingError(errors.unrecognized, fullPath);
      const { type, validators } = description;
      if (isType('String', type)) {
        for (const validator of validators) {
          await Promise.resolve(validator(value));
        }
      } else {
        if (!isType('Object', value)) throw thingError(errors.type, fullPath, 'Map', value);
        await schema.validate(value, description, fullPath);
      }
    }
  };

  schema.runSetters = (input, descriptions = schema.attributes) => {
    if (!isType('Object', input)) throw new Error(`unexpected value '${typeOf(input)}'`);
    return Object.entries(input).reduce((output, [path, value]) => {
      const description = descriptions[path];
      if (!description) return output; // ??
      const { type, setters } = description;
      if (isType('String', type)) {
        const modified = setters
        .reduce((val, setter) => setter(val), value);
        return Object.assign(output, { [path]: modified });
      }
      return Object.assign(output, { [path]: schema.runSetters(value, description) });
    }, input);
  };

  schema.runGetters = (input, descriptions = schema.attributes) => {
    if (!isType('Object', input)) throw new Error(`unexpected value '${typeOf(input)}'`);
    return Object.entries(input).reduce((output, [path, value]) => {
      const description = descriptions[path];
      if (!description) return output; // ??
      const { type, getters } = description;
      if (isType('String', type)) {
        const modified = getters
        .reduce((val, getter) => getter(val), value);
        return Object.assign(output, { [path]: modified });
      }
      return Object.assign(output, { [path]: schema.runGetters(value, description) });
    }, input);
  };

  // TO-DO: hooks

  return schema;
}

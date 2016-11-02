import { errors, options } from './config';

export const typeOf = (data) => {
  if (data === null) return 'Null';
  if (data === undefined) return 'Undefined';
  return data.constructor.name;
};

export const isType = (type, data) => typeOf(data) === type;

export const isDefined = data => !isType('Undefined', data);
export const isString = data => isType('String', data);
export const isNumber = data => isType('Number', data);
export const isBoolean = data => isType('Boolean', data);
export const isArray = data => isType('Array', data);
export const isObject = data => isType('Object', data);
export const isFunction = data => isType('Function', data);

export const typeAliases = new Map();
[String, 'String', 'S'].forEach(alias => typeAliases.set(alias, 'String'));
[Number, 'Number', 'N'].forEach(alias => typeAliases.set(alias, 'Number'));
[Boolean, 'Boolean', 'BOOL'].forEach(alias => typeAliases.set(alias, 'Boolean'));
[Array, 'Array', 'List', 'L'].forEach(alias => typeAliases.set(alias, 'Array'));
[Object, 'Object', 'Map', 'M'].forEach(alias => typeAliases.set(alias, 'Object'));
[Set, 'Set', 'SS', 'NS'].forEach(alias => typeAliases.set(alias, 'Set'));

export const types = ['String', 'Number', 'Boolean', 'Array', 'Object', 'Set'];

/*
const binaryTypes = [
  'Buffer',
  'File',
  'Blob',
  'ArrayBuffer',
  'DataView',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
];
const isBinary = data => binaryTypes.includes(typeOf(data));
*/

export function withoutKeys(input, ...keys) {
  return Object.entries(input).reduce((result, [key, value]) => {
    if (keys.includes(key)) return result;
    return Object.assign(result, { [key]: value });
  }, {});
}

export function validateCustomError(path, message) {
  if (!['String', 'Function', 'Undefined'].includes(typeOf(message))) {
    throw new Error(`invalid custom error (at '${path}')`);
  }
}

export const expected = (option, expectation, path) => new Error(`option '${option}' expects ${expectation} (at '${path}')`);

export function thingError(error, ...info) {
  if (!(isType('String', error) || isType('Function', error))) throw new Error('expected error string or function');
  const message = (isType('String', error)) ? error : error(...info);
  if (!isType('String', message)) return new Error(`error (${info.join(' - ')})`);
  return new Error(message);
}

export function applyDefaults(item, descriptions) {
  return Object.entries(descriptions).reduce((output, [path, description]) => {
    const { type, default: value } = description;
    if (isString(type)) {
      if (!isDefined(output[path]) && isDefined(value)) return Object.assign(output, { [path]: value });
      return output;
    }
    const defaults = applyDefaults(output[path] || {}, description);
    if (Object.keys(defaults).length) return Object.assign(output, { [path]: defaults });
    return output;
  }, Object.assign({}, item));
}

export function ensureRequired(item, descriptions, parentPath) {
  for (const [path, description] of Object.entries(descriptions)) {
    const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
    const { type, required } = description;
    if (isString(type)) {
      if (required && !isDefined(item[path])) throw thingError(errors.required, fullPath, type);
    } else {
      ensureRequired(item[path] || {}, description, fullPath);
    }
  }
}

export async function validateInput(input, descriptions, parentPath) {
  if (!isObject(input)) throw new Error(`unexpected value at ${parentPath}`);
  for (const [key, value] of Object.entries(input)) {
    const prefixed = key.startsWith(options.attributePrefix);
    const path = (prefixed) ? key.slice(options.attributePrefix.length) : key;
    const fullPath = (parentPath) ? `${parentPath}.${path}` : path;
    const description = descriptions[path];
    if (description) {
      const { type, validators } = description;
      if (isString(type)) {
        for (const validator of validators) await Promise.resolve(validator(value));
      } else if (!prefixed) {
        if (!isObject(value)) throw thingError(errors.type, fullPath, 'Map', value);
        await validateInput(value, description, fullPath);
      } else throw thingError(errors.unrecognized, fullPath);
    } else {
      if (prefixed || !path.includes('.')) throw thingError(errors.unrecognized, fullPath);
      const [segment, rest] = path.split(/\.(.+)/);
      if (!isDefined(descriptions[segment])) throw thingError(errors.unrecognized, fullPath);
      await validateInput({ [rest]: value }, descriptions[segment]);
    }
  }
}

export function applySetters(item, descriptions) {
  if (!isObject(item)) throw new Error('unexpected value');
  return Object.entries(item).reduce((output, [key, value]) => {
    const prefixed = key.startsWith(options.attributePrefix);
    const path = (prefixed) ? key.slice(options.attributePrefix.length) : key;
    const description = descriptions[path];
    if (description) {
      const { type, setters } = description;
      if (isString(type)) {
        const result = setters.reduce((op, setter) => setter(op), value);
        return Object.assign(output, { [key]: result });
      }
      if (!prefixed) return Object.assign(output, { [key]: applySetters(value, description) });
    }
    if (prefixed || !path.includes('.')) return output;
    const [segment, rest] = path.split(/\.(.+)/);
    if (!isDefined(descriptions[segment])) return output;
    const applied = applySetters({ [rest]: value }, descriptions[segment]);
    return Object.assign(output, { [key]: applied[rest] });
  }, Object.assign({}, item));
}

export function applyGetters(item, descriptions) {
  if (!isObject(item)) throw new Error('unexpected value');
  return Object.entries(item).reduce((output, [path, value]) => {
    const description = descriptions[path];
    if (!description) return output;
    const { type, getters } = description;
    if (isString(type)) {
      const result = getters.reduce((op, getter) => getter(op), value);
      return Object.assign(output, { [path]: result });
    }
    return Object.assign(output, { [path]: applyGetters(value, description) });
  }, Object.assign({}, item));
}

function setFromArray(array) {
  if (isString(array[0])) return { SS: array };
  if (isNumber(array[0])) return { NS: array.map(number => number.toString()) };
  return { BS: array };
}

export function convertValues(input, descriptions = {}) {
  function convert(data) {
    if (isString(data)) return { S: data };
    if (isNumber(data)) return { N: data.toString() };
    if (isBoolean(data)) return { BOOL: data };
    if (isArray(data)) return { L: data.map(convert) };
    if (isObject(data)) {
      const entries = Object.entries(data).reduce((output, [key, value]) => (
        Object.assign(output, { [key]: convert(value) })
      ), {});
      return { M: entries };
    }
    if (isType('Set', data)) return setFromArray(Array.from(data));
    throw Error(`unrecognized input '${typeOf(data)}`);
  }

  return Object.entries(input).reduce((output, [path, value]) => {
    if (isArray(value) && descriptions[path] && descriptions[path].type === 'Set') {
      return Object.assign(output, { [path]: setFromArray(value) });
    }
    return Object.assign(output, { [path]: convert(value) });
  }, {});
}

export function restoreItem(data) {
  function restore(input) {
    const [type, value] = Object.entries(input)[0];
    if (type === 'N') return Number(value);
    if (type === 'L') return value.map(restore);
    if (type === 'M') return restoreItem(value);
    if (type === 'SS') return new Set(value);
    if (type === 'NS') return new Set(value.map(val => Number(val)));
    return value;
  }

  return Object.entries(data).reduce((item, [path, value]) => (
    Object.assign(item, { [path]: restore(value) })
  ), {});
}

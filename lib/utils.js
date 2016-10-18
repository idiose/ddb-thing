export const isString = input => typeof input === 'string';
export const isNumber = input => typeof input === 'number';
export const isBool = input => typeof input === 'boolean';
export const isObject = input => (!!input && input.constructor.name === 'Object');
export const isFunction = input => typeof input === 'function';
export const isArray = Array.isArray;
export const isUndefined = input => typeof input === 'undefined';
export const isNull = input => input === null;
export const isRegExp = input => (!!input && input.constructor.name === 'RegExp');

const types = {
  S: String.name,
  N: Number.name,
  BOOL: Boolean.name,
  L: Array.name,
  M: Object.name,
  B: ['hehe'],
  SS: Set.name,
  NS: Set.name,
  BS: Set.name,
};

export function isType(input, type) {
  if (!Object.keys(types).includes(type)) throw new Error(`unrecognized type '${type}'`);
  if (isUndefined(input) || isNull(input)) return false;
  return (input.constructor.name === types[type] || types[type].includes(input.constructor.name));
  // return (!isUndefined(input) && !isNull(input) && input.constructor.name === types[type]);
}

export function checkMessage(path, message) {
  if (!(isString(message) || isUndefined(message))) {
    throw new Error(`invalid error message (at '${path}')`);
  }
}

export const expected = (option, expectation, path) => new Error(`option '${option}' expects ${expectation} (at '${path}')`);

export function thingError(message, path, value, type, option) {
  return new Error(
    message
    .replace(/\{PATH\}/g, path)
    .replace(/\{VALUE\}/g, value)
    .replace(/\{TYPE\}/g, type)
    .replace(/\{OPTION\}/g, option)
  );
}

export function without(input, ...keys) {
  return Object.entries(input).reduce((result, [key, value]) => {
    if (keys.includes(key)) return result;
    return Object.assign(result, { [key]: value });
  }, {});
}

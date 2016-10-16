export const isString = input => typeof input === 'string';
export const isNumber = input => typeof input === 'number';
export const isObject = input => !!input && input.constructor.name === 'Object';
export const isFunction = input => typeof input === 'function';
export const isArray = Array.isArray;
export const isUndefined = input => typeof input === 'undefined';
export const isRegExp = input => !!input && input.constructor.name === 'RegExp';

export function isType(value, type) {
  return `${value} might be a ${type}`;
}

export function checkMessage(path, message) {
  if (!(isString(message) || isUndefined(message))) {
    throw new Error(`invalid error message (at '${path}')`);
  }
}

export function thingError(message, path, value, type, option) {
  return new Error(
    message
    .replace(/\{PATH\}/g, path)
    .replace(/\{VALUE\}/g, value)
    .replace(/\{TYPE\}/g, type)
    .replace(/\{OPTION\}/g, option)
  );
}

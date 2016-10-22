export const typeOf = (data) => {
  if (data === null) return 'Null';
  if (data === undefined) return 'Undefined';
  return data.constructor.name;
};

export const isType = (type, data) => typeOf(data) === type;

const types = ['String', 'Number', 'Boolean', 'List', 'Map', 'Binary', 'Set'];
export const typeNames = types.reduce((obj, type) => Object.assign(obj, { [type]: type }), {});

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

// TO-DO: File & Blob...?
// TO-DO: Stream?
const isBinary = data => binaryTypes.includes(typeOf(data));

export function isThingType(type, data) {
  if (!types.includes(type)) throw new Error(`unrecognized type '${type}'`); // necessary?
  if (type === typeNames.List) return isType('Array', data);
  if (type === typeNames.Map) return isType('Object', data);
  if (type === typeNames.Binary) return isBinary(data);
  return isType(type, data);
}

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

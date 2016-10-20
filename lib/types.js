import { errors } from './config';
import { isType, isThingType, typeNames, validateCustomError, thingError, expected } from './utils';

const setGetError = type => `a function or list of functions that always return type '${type}'`;
const handleValid = (valid, error, ...info) => {
  if (!valid) throw thingError(error, ...info);
};

const shared = {
  enum: (path, type, input) => {
    const enumError = expected('enum', `an array of enumerable values of type '${type}'`, path);
    const includesCustomError = isType('Array', input[0]);
    const values = (includesCustomError) ? input[0] : input;
    if (!isType('Array', values)) throw enumError;
    const customError = (includesCustomError) ? input[1] : undefined;
    validateCustomError(path, customError);
    for (const value of values) {
      if (!isThingType(type, value)) throw enumError;
    }
    return value => handleValid(values.includes(value), customError || errors.enum, path, type, value, values);
  },

  validate: (path, type, validators) => {
    for (const validator of validators) {
      if (!isType('Function', validator)) throw expected('validate', 'a function or array of functions', path);
    }
    return validators;
  },

  set: (path, type, setters) => {
    for (const setter of setters) {
      if (!isType('Function', setter)) throw expected('set', setGetError(type), path);
    }
    return setters;
  },

  get: (path, type, getters) => {
    for (const getter of getters) {
      if (!isType('Function', getter)) throw expected('get', setGetError(type), path);
    }
    return getters;
  },
};

const defaults = {
  validators: { validate: shared.validate },
  setters: { set: shared.set },
  getters: { get: shared.get },
};

const typeOptions = {
  [typeNames.String]: {
    validators: {
      match: (path, type, [regExp, customError]) => {
        validateCustomError(path, customError);
        if (!isType('RegExp', regExp)) throw expected('match', 'a regular expression', path);
        return value => handleValid(regExp.test(value), customError || errors.match, path, type, value, regExp);
      },
      minlength: (path, type, [min, customError]) => {
        validateCustomError(path, customError);
        if (!isType('Number', min)) throw expected('minlength', 'a number', path);
        return value => handleValid((value.length >= min), customError || errors.minlength, path, type, value, min);
      },
      maxlength: (path, type, [max, customError]) => {
        validateCustomError(path, customError);
        if (!isType('Number', max)) throw expected('maxlength', 'a number', path);
        return value => handleValid((value.length <= max), customError || errors.maxlength, path, type, value, max);
      },
      enum: shared.enum,
      validate: shared.validate,
    },
    setters: {
      lowercase: () => value => value.toLowerCase(),
      uppercase: () => value => value.toUpperCase(),
      trim: () => value => value.trim(),
      set: shared.set,
    },
    getters: defaults.getters,
  },

  [typeNames.Number]: {
    validators: {
      min: (path, type, [min, customError]) => {
        validateCustomError(path, customError);
        if (!isType('Number', min)) throw expected('min', 'a number', path);
        return value => handleValid((value >= min), customError || errors.min, path, type, value, min);
      },
      max: (path, type, [max, customError]) => {
        validateCustomError(path, customError);
        if (!isType('Number', max)) throw expected('max', 'a number', path);
        return value => handleValid((value <= max), customError || errors.max, path, type, value, max);
      },
      enum: shared.enum,
      validate: shared.validate,
    },
    setters: defaults.setters,
    getters: defaults.getters,
  },

  [typeNames.Boolean]: defaults,
  [typeNames.List]: defaults,
  [typeNames.Map]: defaults,
  [typeNames.Binary]: defaults,
  [typeNames.Set]: defaults,
};

const types = Object.keys(typeOptions);

for (const [type, { validators, setters, getters }] of Object.entries(typeOptions)) {
  Object.assign(typeOptions[type], {
    options: [
      'required',
      'default',
      ...Object.keys(validators),
      ...Object.keys(setters),
      ...Object.keys(getters),
    ],
  });
  Object.defineProperty(types, type, { value: typeOptions[type] });
}

export default types;

/*
import { errors } from './config';
import {
  isNumber,
  isArray,
  isRegExp,
  isFunction,
  isType,
  checkMessage,
  thingError,
  expected,
} from './utils';

import { isType, typeNames, checkMessage, thingError, expected } from './utils';

const setGetError = type => `a function or list of functions that always return type '${type}'`;

function handleValid(valid, value, path, type, option, message) {
  if (!valid) throw thingError(message, path, value, type, option);
}

const shared = {
  enum: (path, type, input) => {
    const definesError = isType(input[0], 'Array');
    const values = (definesError) ? input[0] : input;
    const message = (definesError) ? input[1] : undefined;
    checkMessage(path, message);
    const enumError = expected('enum', `an array of enumerable values of type '${type}'`, path);
    if (!isType(values, 'Array')) throw enumError;
    for (const value of values) {
      if (!isType(value, type)) throw enumError;
    }
    return value => handleValid(values.includes(value), value, path, type, values.join(', '), message || errors.enum);
  },
  validate: (path, type, validators) => {
    const functionError = expected('validate', 'a function or array of functions', path);
    for (const validator of validators) {
      if (!isType(validator, 'Function')) throw functionError;
    }
    return validators;
  },
  set: (path, type, setters) => {
    for (const setter of setters) {
      if (!isType(setter, 'Function')) throw expected('set', setGetError(type), path);
      try {
        if (!isType(setter(), type)) throw expected('set', setGetError(type), path); // require default value?
      } catch (error) {
        throw expected('set', setGetError(type), path);
      }
    }
    return setters;
  },
  get: (path, type, getters) => {
    for (const getter of getters) {
      if (!isType(getter, 'Function')) throw expected('get', setGetError(type), path);
    }
    return getters;
  },
};

const types = {
  [typeNames.String]: {
    validators: {
      match: (path, type, [regExp, message]) => {
        checkMessage(path, message);
        if (!isType(regExp, 'RegExp')) throw expected('match', 'a regular expression', path);
        return value => handleValid(regExp.test(value), value, path, type, regExp, message || errors.match);
      },
      minlength: (path, type, [min, message]) => {
        checkMessage(path, message);
        if (!isType(min, 'Number')) throw expected('minlength', 'a number', path);
        return value => handleValid((value.length >= min), value, path, type, min, message || errors.minlength);
      },
      maxlength: (path, type, [max, message]) => {
        checkMessage(path, message);
        if (!isType(max, 'Number')) throw expected('maxlength', 'a number', path);
        return value => handleValid((value.length <= max), value, path, type, max, message || errors.maxlength);
      },
      enum: shared.enum,
      validate: shared.validate,
    },
    setters: {
      lowercase: () => value => value.toLowerCase(),
      uppercase: () => value => value.toUpperCase(),
      trim: () => value => value.trim(),
      set: shared.set,
    },
    getters: {
      get: shared.get,
    },
  },

  [typeNames.Number]: {
    validators: {
      min: (path, type, [min, message]) => {
        checkMessage(path, message);
        if (!isType(min, 'Number')) throw expected('min', 'a number', path);
        return value => handleValid((value >= min), value, path, type, min, message || errors.min);
      },
      max: (path, type, [max, message]) => {
        checkMessage(path, message);
        if (!isType(max, 'Number')) throw expected('min', 'a number', path);
        return value => handleValid((value <= max), value, path, type, max, message || errors.max);
      },
      enum: shared.enum,
      validate: shared.validate,
    },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  [typeNames.Boolean]: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  [typeNames.List]: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  [typeNames.Map]: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  [typeNames.Binary]: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  [typeNames.Set]: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },
};

const keys = Object.keys;
Object.entries(types).forEach(([type, { validators, setters, getters }]) => {
  types[type].options = ['required', 'default', ...keys(validators), ...keys(setters), ...keys(getters)];
});

export default types;
*/

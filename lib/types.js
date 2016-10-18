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

const setGetError = type => `a function or list of functions that always return type '${type}'`;

function handleValid(valid, value, path, type, option, message) {
  if (!valid) throw thingError(message, path, value, type, option);
}

const shared = {
  enum: (path, type, input) => {
    const definesError = isArray(input[0]);
    const values = (definesError) ? input[0] : input;
    const message = (definesError) ? input[1] : undefined;
    checkMessage(path, message);
    const enumError = expected('enum', `an array of enumerable values of type '${type}'`, path);
    if (!isArray(values)) throw enumError;
    for (const value of values) {
      if (!isType(value, type)) throw enumError;
    }
    return value => handleValid(values.includes(value), value, path, type, values.join(', '), message || errors.enum);
  },
  validate: (path, type, validators) => {
    const functionError = expected('validate', 'a function or array of functions', path);
    for (const validator of validators) {
      // console.log(path, validator, '=====SLDKFJSDF=====');
      if (!isFunction(validator)) throw functionError;
    }
    return validators;
  },
  set: (path, type, setters) => {
    for (const setter of setters) {
      if (!isFunction(setter)) throw expected('set', setGetError(type), path);
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
      if (!isFunction(getter)) throw expected('get', setGetError(type), path);
      /*
      try {
        if (!isType(getter(), type)) throw expected('get', setGetError(type), path);
      } catch () {
        throw expected('get', setGetError(type), path);
      }
      */
    }
    return getters;
  },
};

const types = {
  S: {
    validators: {
      match: (path, type, [regExp, message]) => {
        checkMessage(path, message);
        if (!isRegExp(regExp)) throw expected('match', 'a regular expression', path);
        return value => handleValid(regExp.test(value), value, path, type, regExp, message || errors.match);
      },
      minlength: (path, type, [min, message]) => {
        checkMessage(path, message);
        if (!isNumber(min)) throw expected('minlength', 'a number', path);
        return value => handleValid((value.length >= min), value, path, type, min, message || errors.minlength);
      },
      maxlength: (path, type, [max, message]) => {
        checkMessage(path, message);
        if (!isNumber(max)) throw expected('maxlength', 'a number', path);
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

  N: {
    validators: {
      min: (path, type, [min, message]) => {
        checkMessage(path, message);
        if (!isNumber(min)) throw expected('min', 'a number', path);
        return value => handleValid((value >= min), value, path, type, min, message || errors.min);
      },
      max: (path, type, [max, message]) => {
        checkMessage(path, message);
        if (!isNumber(max)) throw expected('min', 'a number', path);
        return value => handleValid((value <= max), value, path, type, max, message || errors.max);
      },
      enum: shared.enum,
      validate: shared.validate,
    },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  BOOL: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  L: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  M: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  B: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  SS: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  NS: {
    validators: { validate: shared.validate },
    setters: { set: shared.set },
    getters: { get: shared.get },
  },

  BS: {
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


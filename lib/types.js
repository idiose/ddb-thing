import { errors } from './config';
import { isType, isThingType, typeNames, validateCustomError, thingError, expected } from './utils';

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
      if (!isType('Function', validator)) throw expected('validate', 'a function or list of functions', path);
    }
    return validators;
  },

  set: (path, type, setters) => {
    for (const setter of setters) {
      if (!isType('Function', setter)) throw expected('set', 'a function or list of functions', path);
      if (!isType(type, setter())) throw expected('set', `function(s) that always return type '${type}'`, path);
    }
    return setters;
  },

  get: (path, type, getters) => {
    for (const getter of getters) {
      if (!isType('Function', getter)) throw expected('get', 'a function or list of functions', path);
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
      lowercase: () => value => value.toLowerCase(), // TO-DO: ensure type === 'String'?
      uppercase: () => value => value.toUpperCase(), // TO-DO: ensure type === 'String'?
      trim: () => value => value.trim(), // TO-DO: ensure type === 'String'?
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

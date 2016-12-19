'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _config = require('./config');

var _utils = require('./utils');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var handleValid = function handleValid(valid, error) {
  for (var _len = arguments.length, info = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    info[_key - 2] = arguments[_key];
  }

  if (!valid) throw _utils.thingError.apply(undefined, [error].concat(info));
};

var shared = {
  enum: function _enum(path, type, input) {
    var enumError = (0, _utils.expected)('enum', 'an array of enumerable values of type \'' + type + '\'', path);
    var includesCustomError = (0, _utils.isArray)(input[0]);
    var values = includesCustomError ? input[0] : input;
    if (!(0, _utils.isArray)(values)) throw enumError;
    var customError = includesCustomError ? input[1] : undefined;
    (0, _utils.validateCustomError)(path, customError);
    if (!values.every(function (value) {
      return (0, _utils.isType)(type, value);
    })) throw enumError;
    return function (value) {
      return handleValid(values.includes(value), customError || _config.errors.enum, path, type, value, values);
    };
  },

  validate: function validate(path, type, validators) {
    if (!validators.every(_utils.isFunction)) throw (0, _utils.expected)('validate', 'a function or list of functions', path);
    return validators;
  },

  set: function set(path, type, setters) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = setters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var setter = _step.value;

        if (!(0, _utils.isFunction)(setter)) throw (0, _utils.expected)('set', 'a function or list of functions', path);
        if (!(0, _utils.isType)(type, setter())) throw (0, _utils.expected)('set', 'function(s) that always return type \'' + type + '\'', path);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return setters;
  },

  get: function get(path, type, getters) {
    if (!getters.every(_utils.isFunction)) throw (0, _utils.expected)('get', 'a function or list of functions', path);
    return getters;
  }
};

var defaults = {
  validators: { validate: shared.validate },
  setters: { set: shared.set },
  getters: { get: shared.get }
};

var typeOptions = {
  String: {
    validators: {
      match: function match(path, type, _ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            regExp = _ref2[0],
            customError = _ref2[1];

        (0, _utils.validateCustomError)(path, customError);
        if (!(0, _utils.isType)('RegExp', regExp)) throw (0, _utils.expected)('match', 'a regular expression', path);
        return function (value) {
          return handleValid(regExp.test(value), customError || _config.errors.match, path, type, value, regExp);
        };
      },
      minlength: function minlength(path, type, _ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            min = _ref4[0],
            customError = _ref4[1];

        (0, _utils.validateCustomError)(path, customError);
        if (!(0, _utils.isNumber)(min)) throw (0, _utils.expected)('minlength', 'a number', path);
        return function (value) {
          return handleValid(value.length >= min, customError || _config.errors.minlength, path, type, value, min);
        };
      },
      maxlength: function maxlength(path, type, _ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            max = _ref6[0],
            customError = _ref6[1];

        (0, _utils.validateCustomError)(path, customError);
        if (!(0, _utils.isNumber)(max)) throw (0, _utils.expected)('maxlength', 'a number', path);
        return function (value) {
          return handleValid(value.length <= max, customError || _config.errors.maxlength, path, type, value, max);
        };
      },
      enum: shared.enum,
      validate: shared.validate
    },
    setters: {
      lowercase: function lowercase() {
        return function (value) {
          return value.toLowerCase();
        };
      }, // TO-DO: ensure type === 'String'?
      uppercase: function uppercase() {
        return function (value) {
          return value.toUpperCase();
        };
      }, // TO-DO: ensure type === 'String'?
      trim: function trim() {
        return function (value) {
          return value.trim();
        };
      }, // TO-DO: ensure type === 'String'?
      set: shared.set
    },
    getters: defaults.getters
  },

  Number: {
    validators: {
      min: function min(path, type, _ref7) {
        var _ref8 = _slicedToArray(_ref7, 2),
            _min = _ref8[0],
            customError = _ref8[1];

        (0, _utils.validateCustomError)(path, customError);
        if (!(0, _utils.isNumber)(_min)) throw (0, _utils.expected)('min', 'a number', path);
        return function (value) {
          return handleValid(value >= _min, customError || _config.errors.min, path, type, value, _min);
        };
      },
      max: function max(path, type, _ref9) {
        var _ref10 = _slicedToArray(_ref9, 2),
            _max = _ref10[0],
            customError = _ref10[1];

        (0, _utils.validateCustomError)(path, customError);
        if (!(0, _utils.isNumber)(_max)) throw (0, _utils.expected)('max', 'a number', path);
        return function (value) {
          return handleValid(value <= _max, customError || _config.errors.max, path, type, value, _max);
        };
      },
      enum: shared.enum,
      validate: shared.validate
    },
    setters: defaults.setters,
    getters: defaults.getters
  },

  Boolean: defaults,
  Array: defaults,
  Object: defaults,
  Set: defaults
};

var types = Object.keys(typeOptions);

var _iteratorNormalCompletion2 = true;
var _didIteratorError2 = false;
var _iteratorError2 = undefined;

try {
  for (var _iterator2 = Object.entries(typeOptions)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
    var _step2$value = _slicedToArray(_step2.value, 2),
        type = _step2$value[0],
        _step2$value$ = _step2$value[1],
        validators = _step2$value$.validators,
        setters = _step2$value$.setters,
        getters = _step2$value$.getters;

    Object.assign(typeOptions[type], {
      options: ['required', 'default'].concat(_toConsumableArray(Object.keys(validators)), _toConsumableArray(Object.keys(setters)), _toConsumableArray(Object.keys(getters)))
    });
    Object.defineProperty(types, type, { value: typeOptions[type] });
  }
} catch (err) {
  _didIteratorError2 = true;
  _iteratorError2 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion2 && _iterator2.return) {
      _iterator2.return();
    }
  } finally {
    if (_didIteratorError2) {
      throw _iteratorError2;
    }
  }
}

exports.default = types;
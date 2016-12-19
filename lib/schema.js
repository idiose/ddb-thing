'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = function (definition) {
  if (!(0, _utils.isObject)(definition) || !Object.keys(definition).length) throw new Error('invalid schema definition');

  var schema = {
    timestamps: false,
    response: false,
    defaults: true,
    required: true,
    validate: true,
    setters: true,
    getters: true
  };

  var attributes = definition.attributes,
      timestamps = definition.timestamps;


  schema.attributes = parseAttributes(attributes);
  if ((0, _utils.isDefined)(timestamps)) schema.timestamps = parseTimeStamps(timestamps);

  var booleanOptions = ['response', 'defaults', 'required', 'validate', 'setters', 'getters', 'consistentRead'];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = booleanOptions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var option = _step2.value;

      if ((0, _utils.isDefined)(definition[option])) {
        if (!(0, _utils.isBoolean)(definition[option])) throw new Error(option + ' expects a boolean value');
        schema[option] = definition[option];
      }
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

  var stringOptions = ['consumedCapacity', 'collectionMetrics'];
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = stringOptions[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var _option = _step3.value;

      if ((0, _utils.isDefined)(definition[_option])) {
        if (!(0, _utils.isString)(definition[_option])) throw new Error(_option + ' expects a string value');
        schema[_option] = definition[_option];
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  if ((0, _utils.isDefined)(definition.responseHandler)) {
    if (!(0, _utils.isFunction)(definition.responseHandler)) throw new Error('responseHandler expects a function');
    schema.responseHandler = definition.responseHandler;
  }

  Object.keys(definition).forEach(function (key) {
    if (!Object.keys(schema).includes(key)) throw new Error('unrecognized definition property \'' + key + '\'');
  });

  return schema;
};

var _types = require('./types');

var _types2 = _interopRequireDefault(_types);

var _config = require('./config');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var compelArray = function compelArray(input) {
  return (0, _utils.isArray)(input) ? input : [input];
};

function describePath(path, input) {
  var _ref, _ref2, _ref3;

  var _input$type = _slicedToArray(input.type, 2),
      typeAlias = _input$type[0],
      customError = _input$type[1];

  if (!(0, _utils.isDefined)(typeAlias)) throw new Error('invalid attribute description (at \'' + path + '\')');
  if (!_utils.typeAliases.has(typeAlias)) throw new Error('unrecognized attribute type \'' + typeAlias + '\' (at \'' + path + '\')');
  var type = _utils.typeAliases.get(typeAlias);

  var options = (0, _utils.withoutKeys)(input, 'type');
  (0, _utils.validateCustomError)(path, customError);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.keys(options)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var option = _step.value;

      if (!_types2.default[type].options.includes(option)) {
        throw new Error('unrecognized attribute option \'' + option + '\' for type \'' + type + '\' (at \'' + path + '\')');
      }
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

  var validateType = function validateType(value) {
    if (!(0, _utils.isType)(type, value)) {
      throw (0, _utils.thingError)(_config.errors.type || customError, path, type, value);
    }
  };

  var validators = (_ref = [validateType]).concat.apply(_ref, _toConsumableArray(Object.keys(_types2.default[type].validators).filter(function (key) {
    return (0, _utils.isDefined)(options[key]);
  }).map(function (validator) {
    return _types2.default[type].validators[validator](path, type, compelArray(options[validator]));
  })));

  var setters = (_ref2 = []).concat.apply(_ref2, _toConsumableArray(Object.keys(_types2.default[type].setters).filter(function (key) {
    return (0, _utils.isDefined)(options[key]);
  }).map(function (setter) {
    return _types2.default[type].setters[setter](path, type, compelArray(options[setter]));
  })));

  var getters = (_ref3 = []).concat.apply(_ref3, _toConsumableArray(Object.keys(_types2.default[type].getters).filter(function (key) {
    return (0, _utils.isDefined)(options[key]);
  }).map(function (getter) {
    return _types2.default[type].getters[getter](path, type, compelArray(options[getter]));
  })));

  var description = { type: type, validators: validators, setters: setters, getters: getters };

  if ((0, _utils.isDefined)(options.required)) {
    if (!(0, _utils.isBoolean)(options.required)) throw (0, _utils.expected)('required', 'a boolean', path);
    description.required = options.required;
  }

  if ((0, _utils.isDefined)(options.default)) {
    if (!(0, _utils.isType)(type, options.default)) throw (0, _utils.expected)('default', 'a value with type \'' + type + '\'', path);
    description.default = options.default;
  }

  return description;
}

function parseAttribute(path, input, parentPath) {
  var fullPath = parentPath ? parentPath + '.' + path : path;
  var invalidDescription = new Error('invalid attribute description (at \'' + fullPath + '\')');
  var finish = function finish(description) {
    return _defineProperty({}, path, description);
  };
  if ((0, _utils.isString)(input) || (0, _utils.isFunction)(input) || (0, _utils.isArray)(input)) {
    return finish(describePath(fullPath, { type: compelArray(input) }));
  }
  if (!(0, _utils.isObject)(input)) throw invalidDescription;
  var type = input.type;

  if (type) {
    if ((0, _utils.isString)(type) || (0, _utils.isFunction)(type)) {
      return finish(describePath(fullPath, Object.assign(input, { type: [type] })));
    }
    if ((0, _utils.isArray)(type)) return finish(describePath(fullPath, input));
  }
  if (!Object.keys(input).length) throw invalidDescription;
  return finish(Object.entries(input).reduce(function (attributes, description) {
    return Object.assign(attributes, parseAttribute.apply(undefined, _toConsumableArray(description).concat([fullPath])));
  }, {}));
}

function parseAttributes(input) {
  if (!(0, _utils.isObject)(input) || !Object.keys(input).length) throw new Error('invalid attributes description');
  return Object.entries(input).reduce(function (attributes, description) {
    return Object.assign(attributes, parseAttribute.apply(undefined, _toConsumableArray(description)));
  }, {});
}

function parseTimeStamps(input) {
  var timestamps = { created: _config.options.timestamps.created, modified: _config.options.timestamps.modified };
  if ((0, _utils.isBoolean)(input)) return timestamps;
  if (!(0, _utils.isObject)(input)) throw new Error('invalid timestamp definition');
  Object.keys(input).forEach(function (key) {
    if (!Object.keys(timestamps).includes(key)) throw new Error('unrecognized timestamps option \'' + key + '\'');
  });
  if ((0, _utils.isDefined)(input.created)) {
    if (!(0, _utils.isString)(input.created)) throw new Error('timestamps.created expects a string value');
    timestamps.created = input.created;
  }
  if ((0, _utils.isDefined)(input.modified)) {
    if (!(0, _utils.isString)(input.modified)) throw new Error('timestamps.modified expects a string value');
    timestamps.modified = input.modified;
  }
  return timestamps;
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateInput = exports.expected = exports.types = exports.typeAliases = exports.isFunction = exports.isObject = exports.isArray = exports.isBoolean = exports.isNumber = exports.isString = exports.isDefined = exports.isType = exports.typeOf = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var validateInput = exports.validateInput = function () {
  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(input, descriptions, parentPath) {
    var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _step2$value, key, value, prefixed, path, fullPath, description, type, validators, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, validator, _path$split, _path$split2, segment, rest;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (isObject(input)) {
              _context.next = 2;
              break;
            }

            throw new Error('unexpected value at ' + parentPath);

          case 2:
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context.prev = 5;
            _iterator2 = Object.entries(input)[Symbol.iterator]();

          case 7:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context.next = 64;
              break;
            }

            _step2$value = _slicedToArray(_step2.value, 2), key = _step2$value[0], value = _step2$value[1];
            prefixed = key.startsWith(_config.options.attributePrefix);
            path = prefixed ? key.slice(_config.options.attributePrefix.length) : key;
            fullPath = parentPath ? parentPath + '.' + path : path;
            description = descriptions[path];

            if (!description) {
              _context.next = 54;
              break;
            }

            type = description.type, validators = description.validators;

            if (!isString(type)) {
              _context.next = 44;
              break;
            }

            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            _context.prev = 19;
            _iterator3 = validators[Symbol.iterator]();

          case 21:
            if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
              _context.next = 28;
              break;
            }

            validator = _step3.value;
            _context.next = 25;
            return Promise.resolve(validator(value));

          case 25:
            _iteratorNormalCompletion3 = true;
            _context.next = 21;
            break;

          case 28:
            _context.next = 34;
            break;

          case 30:
            _context.prev = 30;
            _context.t0 = _context['catch'](19);
            _didIteratorError3 = true;
            _iteratorError3 = _context.t0;

          case 34:
            _context.prev = 34;
            _context.prev = 35;

            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }

          case 37:
            _context.prev = 37;

            if (!_didIteratorError3) {
              _context.next = 40;
              break;
            }

            throw _iteratorError3;

          case 40:
            return _context.finish(37);

          case 41:
            return _context.finish(34);

          case 42:
            _context.next = 52;
            break;

          case 44:
            if (prefixed) {
              _context.next = 51;
              break;
            }

            if (isObject(value)) {
              _context.next = 47;
              break;
            }

            throw thingError(_config.errors.type, fullPath, 'Map', value);

          case 47:
            _context.next = 49;
            return validateInput(value, description, fullPath);

          case 49:
            _context.next = 52;
            break;

          case 51:
            throw thingError(_config.errors.unrecognized, fullPath);

          case 52:
            _context.next = 61;
            break;

          case 54:
            if (!(prefixed || !path.includes('.'))) {
              _context.next = 56;
              break;
            }

            throw thingError(_config.errors.unrecognized, fullPath);

          case 56:
            _path$split = path.split(/\.(.+)/), _path$split2 = _slicedToArray(_path$split, 2), segment = _path$split2[0], rest = _path$split2[1];

            if (isDefined(descriptions[segment])) {
              _context.next = 59;
              break;
            }

            throw thingError(_config.errors.unrecognized, fullPath);

          case 59:
            _context.next = 61;
            return validateInput(_defineProperty({}, rest, value), descriptions[segment]);

          case 61:
            _iteratorNormalCompletion2 = true;
            _context.next = 7;
            break;

          case 64:
            _context.next = 70;
            break;

          case 66:
            _context.prev = 66;
            _context.t1 = _context['catch'](5);
            _didIteratorError2 = true;
            _iteratorError2 = _context.t1;

          case 70:
            _context.prev = 70;
            _context.prev = 71;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 73:
            _context.prev = 73;

            if (!_didIteratorError2) {
              _context.next = 76;
              break;
            }

            throw _iteratorError2;

          case 76:
            return _context.finish(73);

          case 77:
            return _context.finish(70);

          case 78:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[5, 66, 70, 78], [19, 30, 34, 42], [35,, 37, 41], [71,, 73, 77]]);
  }));

  return function validateInput(_x, _x2, _x3) {
    return _ref5.apply(this, arguments);
  };
}();

exports.withoutKeys = withoutKeys;
exports.validateCustomError = validateCustomError;
exports.thingError = thingError;
exports.applyDefaults = applyDefaults;
exports.ensureRequired = ensureRequired;
exports.applySetters = applySetters;
exports.applyGetters = applyGetters;
exports.convertValues = convertValues;
exports.restoreItem = restoreItem;

var _config = require('./config');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var typeOf = exports.typeOf = function typeOf(data) {
  if (data === null) return 'Null';
  if (data === undefined) return 'Undefined';
  return data.constructor.name;
};

var isType = exports.isType = function isType(type, data) {
  return typeOf(data) === type;
};

var isDefined = exports.isDefined = function isDefined(data) {
  return !isType('Undefined', data);
};
var isString = exports.isString = function isString(data) {
  return isType('String', data);
};
var isNumber = exports.isNumber = function isNumber(data) {
  return isType('Number', data);
};
var isBoolean = exports.isBoolean = function isBoolean(data) {
  return isType('Boolean', data);
};
var isArray = exports.isArray = function isArray(data) {
  return isType('Array', data);
};
var isObject = exports.isObject = function isObject(data) {
  return isType('Object', data);
};
var isFunction = exports.isFunction = function isFunction(data) {
  return isType('Function', data);
};

var typeAliases = exports.typeAliases = new Map();
[String, 'String', 'S'].forEach(function (alias) {
  return typeAliases.set(alias, 'String');
});
[Number, 'Number', 'N'].forEach(function (alias) {
  return typeAliases.set(alias, 'Number');
});
[Boolean, 'Boolean', 'BOOL'].forEach(function (alias) {
  return typeAliases.set(alias, 'Boolean');
});
[Array, 'Array', 'List', 'L'].forEach(function (alias) {
  return typeAliases.set(alias, 'Array');
});
[Object, 'Object', 'Map', 'M'].forEach(function (alias) {
  return typeAliases.set(alias, 'Object');
});
[Set, 'Set', 'SS', 'NS'].forEach(function (alias) {
  return typeAliases.set(alias, 'Set');
});

var types = exports.types = ['String', 'Number', 'Boolean', 'Array', 'Object', 'Set'];

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

function withoutKeys(input) {
  for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    keys[_key - 1] = arguments[_key];
  }

  return Object.entries(input).reduce(function (result, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    if (keys.includes(key)) return result;
    return Object.assign(result, _defineProperty({}, key, value));
  }, {});
}

function validateCustomError(path, message) {
  if (!['String', 'Function', 'Undefined'].includes(typeOf(message))) {
    throw new Error('invalid custom error (at \'' + path + '\')');
  }
}

var expected = exports.expected = function expected(option, expectation, path) {
  return new Error('option \'' + option + '\' expects ' + expectation + ' (at \'' + path + '\')');
};

function thingError(error) {
  if (!(isType('String', error) || isType('Function', error))) throw new Error('expected error string or function');

  for (var _len2 = arguments.length, info = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    info[_key2 - 1] = arguments[_key2];
  }

  var message = isType('String', error) ? error : error.apply(undefined, info);
  if (!isType('String', message)) return new Error('error (' + info.join(' - ') + ')');
  return new Error(message);
}

function applyDefaults(item, descriptions) {
  return Object.entries(descriptions).reduce(function (output, _ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        path = _ref4[0],
        description = _ref4[1];

    var type = description.type,
        value = description.default;

    if (isString(type)) {
      if (!isDefined(output[path]) && isDefined(value)) return Object.assign(output, _defineProperty({}, path, value));
      return output;
    }
    var defaults = applyDefaults(output[path] || {}, description);
    if (Object.keys(defaults).length) return Object.assign(output, _defineProperty({}, path, defaults));
    return output;
  }, Object.assign({}, item));
}

function ensureRequired(item, descriptions, parentPath) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.entries(descriptions)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
          path = _step$value[0],
          description = _step$value[1];

      var fullPath = parentPath ? parentPath + '.' + path : path;
      var type = description.type,
          required = description.required;

      if (isString(type)) {
        if (required && !isDefined(item[path])) throw thingError(_config.errors.required, fullPath, type);
      } else {
        ensureRequired(item[path] || {}, description, fullPath);
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
}

function applySetters(item, descriptions) {
  if (!isObject(item)) throw new Error('unexpected value');
  return Object.entries(item).reduce(function (output, _ref6) {
    var _ref7 = _slicedToArray(_ref6, 2),
        key = _ref7[0],
        value = _ref7[1];

    var prefixed = key.startsWith(_config.options.attributePrefix);
    var path = prefixed ? key.slice(_config.options.attributePrefix.length) : key;
    var description = descriptions[path];
    if (description) {
      var type = description.type,
          setters = description.setters;

      if (isString(type)) {
        var result = setters.reduce(function (op, setter) {
          return setter(op);
        }, value);
        return Object.assign(output, _defineProperty({}, key, result));
      }
      if (!prefixed) return Object.assign(output, _defineProperty({}, key, applySetters(value, description)));
    }
    if (prefixed || !path.includes('.')) return output;

    var _path$split3 = path.split(/\.(.+)/),
        _path$split4 = _slicedToArray(_path$split3, 2),
        segment = _path$split4[0],
        rest = _path$split4[1];

    if (!isDefined(descriptions[segment])) return output;
    var applied = applySetters(_defineProperty({}, rest, value), descriptions[segment]);
    return Object.assign(output, _defineProperty({}, key, applied[rest]));
  }, Object.assign({}, item));
}

function applyGetters(item, descriptions) {
  if (!isObject(item)) throw new Error('unexpected value');
  return Object.entries(item).reduce(function (output, _ref8) {
    var _ref9 = _slicedToArray(_ref8, 2),
        path = _ref9[0],
        value = _ref9[1];

    var description = descriptions[path];
    if (!description) return output;
    var type = description.type,
        getters = description.getters;

    if (isString(type)) {
      var result = getters.reduce(function (op, getter) {
        return getter(op);
      }, value);
      return Object.assign(output, _defineProperty({}, path, result));
    }
    return Object.assign(output, _defineProperty({}, path, applyGetters(value, description)));
  }, Object.assign({}, item));
}

function setFromArray(array) {
  if (isString(array[0])) return { SS: array };
  if (isNumber(array[0])) return { NS: array.map(function (number) {
      return number.toString();
    }) };
  return { BS: array };
}

function convertValues(input) {
  var descriptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  function convert(data) {
    if (isString(data)) return { S: data };
    if (isNumber(data)) return { N: data.toString() };
    if (isBoolean(data)) return { BOOL: data };
    if (isArray(data)) return { L: data.map(convert) };
    if (isObject(data)) {
      var entries = Object.entries(data).reduce(function (output, _ref10) {
        var _ref11 = _slicedToArray(_ref10, 2),
            key = _ref11[0],
            value = _ref11[1];

        return Object.assign(output, _defineProperty({}, key, convert(value)));
      }, {});
      return { M: entries };
    }
    if (isType('Set', data)) return setFromArray(Array.from(data));
    throw Error('unrecognized input \'' + typeOf(data));
  }

  return Object.entries(input).reduce(function (output, _ref12) {
    var _ref13 = _slicedToArray(_ref12, 2),
        path = _ref13[0],
        value = _ref13[1];

    if (isArray(value) && descriptions[path] && descriptions[path].type === 'Set') {
      return Object.assign(output, _defineProperty({}, path, setFromArray(value)));
    }
    return Object.assign(output, _defineProperty({}, path, convert(value)));
  }, {});
}

function restoreItem(data) {
  function restore(input) {
    var _Object$entries$ = _slicedToArray(Object.entries(input)[0], 2),
        type = _Object$entries$[0],
        value = _Object$entries$[1];

    if (type === 'N') return Number(value);
    if (type === 'L') return value.map(restore);
    if (type === 'M') return restoreItem(value);
    if (type === 'SS') return new Set(value);
    if (type === 'NS') return new Set(value.map(function (val) {
      return Number(val);
    }));
    return value;
  }

  return Object.entries(data).reduce(function (item, _ref14) {
    var _ref15 = _slicedToArray(_ref14, 2),
        path = _ref15[0],
        value = _ref15[1];

    return Object.assign(item, _defineProperty({}, path, restore(value)));
  }, {});
}
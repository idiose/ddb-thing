'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.options = exports.errors = undefined;

var _utils = require('./utils');

var options = {};
var optionsMem = {
  tableRoot: '',
  operatorPrefix: '$',
  attributePrefix: '#',
  response: false,
  responseHandler: function responseHandler() {},
  created: 'created',
  modified: 'modified',
  consumedCapacity: undefined,
  collectionMetrics: undefined,
  consistentRead: undefined,
  defaults: true,
  required: true,
  validate: true,
  setters: true,
  getters: true
};

var strings = ['tableRoot', 'operatorPrefix', 'attributePrefix', 'consumedCapacity', 'collectionMetrics'];
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function _loop() {
    var option = _step.value;

    Object.defineProperty(options, option, {
      get: function get() {
        return optionsMem[option];
      },
      set: function set(val) {
        if (!(0, _utils.isString)(val)) throw new Error('expected a string value');
        return optionsMem[option] = val;
      }
    });
  };

  for (var _iterator = strings[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    _loop();
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

var booleans = ['response', 'consistentRead', 'defaults', 'required', 'validate', 'setters', 'getters'];
var _iteratorNormalCompletion2 = true;
var _didIteratorError2 = false;
var _iteratorError2 = undefined;

try {
  var _loop2 = function _loop2() {
    var option = _step2.value;

    Object.defineProperty(options, option, {
      get: function get() {
        return optionsMem[option];
      },
      set: function set(val) {
        if (!(0, _utils.isBoolean)(val)) throw new Error('expected a boolean value');
        return optionsMem[option] = val;
      }
    });
  };

  for (var _iterator2 = booleans[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
    _loop2();
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

Object.defineProperty(options, 'responseHandler', {
  get: function get() {
    return optionsMem.responseHandler;
  },
  set: function set(val) {
    if (!(0, _utils.isFunction)(val)) throw new Error('expected a function');
    return optionsMem.responseHandler = val;
  }
});

var timestamps = {};
var _arr = ['created', 'modified'];

var _loop3 = function _loop3() {
  var option = _arr[_i];
  Object.defineProperty(timestamps, option, {
    get: function get() {
      return optionsMem[option];
    },
    set: function set(val) {
      if (!(0, _utils.isString)(val)) throw new Error('expected a string value');
      return optionsMem[option] = val;
    }
  });
};

for (var _i = 0; _i < _arr.length; _i++) {
  _loop3();
}

Object.defineProperty(options, 'timestamps', { value: timestamps });

// ** ==== ** //
var errors = {};
var at = function at(path) {
  return '(at \'' + path + '\')';
};
var expected = function expected(value) {
  return 'expected value \'' + value + '\' to';
};
var errorsMem = {
  type: function type(path, _type) {
    return 'expected type \'' + _type + '\' ' + at(path);
  },
  required: function required(path) {
    return 'attribute \'' + path + '\' is required';
  },
  unrecognized: function unrecognized(path) {
    return 'unrecognized attribute \'' + path + '\'';
  },
  enum: function _enum(path, type, value, values) {
    return expected(value) + ' be in (' + values.join(', ') + ') ' + at(path);
  },
  match: function match(path, type, value, regExp) {
    return expected(value) + ' match ' + regExp + ' ' + at(path);
  },
  minlength: function minlength(path, type, value, min) {
    return expected(value) + ' be at least ' + min + ' characters in length ' + at(path);
  },
  maxlength: function maxlength(path, type, value, max) {
    return expected(value) + ' be at most ' + max + ' characters in length ' + at(path);
  },
  min: function min(path, type, value, _min) {
    return expected(value) + ' be at least ' + _min + ' ' + at(path);
  },
  max: function max(path, type, value, _max) {
    return expected(value) + ' be at most ' + _max + ' ' + at(path);
  }
};

var _iteratorNormalCompletion3 = true;
var _didIteratorError3 = false;
var _iteratorError3 = undefined;

try {
  var _loop4 = function _loop4() {
    var name = _step3.value;

    Object.defineProperty(errors, name, {
      get: function get() {
        return errorsMem[name];
      },
      set: function set(val) {
        if ((0, _utils.isString)(val)) return errorsMem[name] = val;
        if ((0, _utils.isFunction)(val)) {
          if (!(0, _utils.isString)(val())) throw new Error('error functions must return a string');
          return errorsMem[name] = val;
        }
        throw new Error('errors must either be a string or a function that returns a string');
      }
    });
  };

  for (var _iterator3 = Object.keys(errorsMem)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
    _loop4();
  }

  // ** ==== ** //
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

var config = {};
Object.defineProperties(config, {
  options: { value: options },
  errors: { value: errors }
});

exports.errors = errors;
exports.options = options;
exports.default = config;
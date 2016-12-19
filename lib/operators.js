'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _config = require('./config');

var _utils = require('./utils');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var operators = {};

var requirePath = function requirePath(name, path) {
  if (!path) throw new Error('' + _config.options.operatorPrefix + name + ' requires an attribute path');
};

var requireType = function requireType(name, value, type) {
  if (!(0, _utils.isType)(type, value)) throw new Error('' + _config.options.operatorPrefix + name + ' requires argument type ' + type);
  if (type === 'Object' && !Object.keys(value).length) {
    throw new Error('' + _config.options.operatorPrefix + name + ' requires a non-empty object');
  }
  if (type === 'Number' && isNaN(value)) {
    throw new Error('' + _config.options.operatorPrefix + name + ' requires argument type ' + type);
  }
};

function define(name) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var render = arguments[2];
  var _options$parses = options.parses,
      parses = _options$parses === undefined ? true : _options$parses,
      pathRequired = options.requirePath,
      typeRequired = options.requireType;

  operators[name] = function (path, input, _ref) {
    var parse = _ref.parse;

    if (pathRequired) requirePath(name, path);
    if (typeRequired) requireType(name, input, typeRequired);
    var value = parses ? parse(input, path || name) : input;
    return render(path, value);
  };
}

var comparators = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function _loop() {
    var _step$value = _slicedToArray(_step.value, 2),
        name = _step$value[0],
        comparator = _step$value[1];

    define(name, { requirePath: true }, function (path, value) {
      return path + ' ' + comparator + ' ' + value;
    });
  };

  for (var _iterator = Object.entries(comparators)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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

var requirePathAndArray = { requirePath: true, requireType: 'Array' };
define('between', requirePathAndArray, function (path, _ref2) {
  var _ref3 = _slicedToArray(_ref2, 2),
      low = _ref3[0],
      high = _ref3[1];

  return path + ' BETWEEN ' + low + ' AND ' + high;
});
define('in', requirePathAndArray, function (path, values) {
  return path + ' IN (' + values.join(', ') + ')';
});
define('nin', requirePathAndArray, function (path, values) {
  return 'NOT ' + path + ' IN (' + values.join(', ') + ')';
});

define('exists', { requirePath: true, requireType: 'Boolean', parses: false }, function (path, value) {
  var method = value ? 'attribute_exists' : 'attribute_not_exists';
  return method + '(' + path + ')';
});

var methods = {
  type: 'attribute_type',
  beginsWith: 'begins_with',
  contains: 'contains'
};
var _iteratorNormalCompletion2 = true;
var _didIteratorError2 = false;
var _iteratorError2 = undefined;

try {
  var _loop2 = function _loop2() {
    var _step2$value = _slicedToArray(_step2.value, 2),
        name = _step2$value[0],
        method = _step2$value[1];

    define(name, { requirePath: true }, function (path, value) {
      return method + '(' + path + ', ' + value + ')';
    });
  };

  for (var _iterator2 = Object.entries(methods)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
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

operators.size = function (operand, _ref4) {
  var parseString = _ref4.parseString,
      names = _ref4.names;

  var error = 'invalid use of ' + _config.options.operatorPrefix + 'size operator \'' + operand + '\'';
  var match = new RegExp('\\' + _config.options.operatorPrefix + 'size', 'g');
  if (operand.match(match).length > 1) throw new Error(error);
  if (!operand.startsWith(_config.options.operatorPrefix + 'size:')) throw new Error(error);
  var path = parseString(operand.replace(_config.options.operatorPrefix + 'size:', ''), names);
  return 'size(' + path + ')';
};

var logicals = { or: 'OR', and: 'AND' };
var _iteratorNormalCompletion3 = true;
var _didIteratorError3 = false;
var _iteratorError3 = undefined;

try {
  var _loop3 = function _loop3() {
    var _step3$value = _slicedToArray(_step3.value, 2),
        name = _step3$value[0],
        joinder = _step3$value[1];

    define(name, { requireType: 'Array' }, function (path, values) {
      var conditions = values.join(' ' + joinder + ' ');
      return path ? '( ' + conditions + ' )' : conditions;
    });
  };

  for (var _iterator3 = Object.entries(logicals)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
    _loop3();
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

define('nor', { requireType: 'Array' }, function (path, values) {
  return 'NOT ( ' + values.join(' OR ') + ' )';
});
define('not', {}, function (path, value) {
  return 'NOT ' + value;
});

operators.inc = function (path, input, _ref5) {
  var parse = _ref5.parse;

  requirePath('inc', path);
  requireType('inc', input, 'Number');
  var value = parse(Math.abs(input));
  var operator = input < 0 ? '-' : '+';
  return path + ' = ' + path + ' ' + operator + ' ' + value;
};

define('append', { requirePath: true }, function (path, value) {
  return path + ' = list_append(' + path + ', ' + value + ')';
});
define('prepend', { requirePath: true }, function (path, value) {
  return path + ' = list_append(' + value + ', ' + path + ')';
});
define('ine', { requirePath: true }, function (path, value) {
  return path + ' = if_not_exists(' + path + ', ' + value + ')';
});

operators.set = function (path, input, _ref6) {
  var parse = _ref6.parse;

  requireType('set', input, 'Object');
  var sets = Object.entries(input).map(function (_ref7) {
    var _ref8 = _slicedToArray(_ref7, 2),
        attribute = _ref8[0],
        value = _ref8[1];

    if (attribute.startsWith(_config.options.operatorPrefix)) throw new Error('unexpected operator \'' + attribute + '\'');
    if ((0, _utils.isObject)(value)) {
      return Object.entries(value).map(function (_ref9) {
        var _ref10 = _slicedToArray(_ref9, 2),
            operator = _ref10[0],
            argument = _ref10[1];

        return parse(_defineProperty({}, attribute, _defineProperty({}, operator, argument)));
      }).join(', ');
    }
    return parse(_defineProperty({}, attribute, value));
  }).join(', ');
  return 'SET ' + sets;
};

operators.remove = function (path, input, _ref11) {
  var parseString = _ref11.parseString,
      names = _ref11.names;

  if (!((0, _utils.isString)(input) || (0, _utils.isArray)(input))) {
    throw new Error(_config.options.operatorPrefix + 'remove requires a path or a list of paths');
  }
  var paths = (0, _utils.isArray)(input) ? input : [input];
  paths.forEach(function (val) {
    if (!(0, _utils.isString)(val)) throw new Error(_config.options.operatorPrefix + 'remove requires a path or a list of paths');
  });
  var removes = paths.map(function (name) {
    return parseString(name, names);
  });
  return 'REMOVE ' + removes.join(', ');
};

operators.add = function (path, input, _ref12) {
  var parse = _ref12.parse,
      parseString = _ref12.parseString,
      names = _ref12.names;

  requireType('add', input, 'Object');
  var adds = Object.entries(input).map(function (_ref13) {
    var _ref14 = _slicedToArray(_ref13, 2),
        operand = _ref14[0],
        arg = _ref14[1];

    var name = parseString(operand, names);
    return name + ' ' + parse(arg, operand);
  });
  return 'ADD ' + adds.join(', ');
};

operators.delete = function (path, input, _ref15) {
  var parse = _ref15.parse,
      parseString = _ref15.parseString,
      names = _ref15.names;

  requireType('delete', input, 'Object');
  var deletes = Object.entries(input).map(function (_ref16) {
    var _ref17 = _slicedToArray(_ref16, 2),
        operand = _ref17[0],
        arg = _ref17[1];

    var name = parseString(operand, names);
    return name + ' ' + parse(arg, operand);
  });
  return 'DELETE ' + deletes.join(', ');
};

exports.default = operators;
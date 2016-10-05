'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var prefix = '$';
var operators = {};
var noParse = [];

function requirePath(operator, path) {
  if (!path) throw new Error(operator + ' requires an attribute path');
}

function requireType(operator, type, value) {
  if (value.constructor.name !== type.name) throw new Error(operator + ' requires argument type ' + type.name);
}

function defineOperator(name) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var render = arguments[2];

  var operator = '' + prefix + name;
  if (options.noParse) noParse.push(operator);

  if (render) {
    operators[operator] = function (path, value) {
      if (options.requirePath) requirePath(operator, path);
      if (options.requireType) requireType(operator, options.requireType, value);
      return render(path, value);
    };
  }

  return {
    comparisonOperator: function comparisonOperator(comparator) {
      operators[operator] = function (path, value) {
        requirePath(operator, path);
        return path + ' ' + comparator + ' ' + value;
      };
    },
    functionalOperator: function functionalOperator(functionName) {
      operators[operator] = function (path, value) {
        requirePath(operator, path);
        return functionName + '(' + path + ', ' + value + ')';
      };
    },
    logicalOperator: function logicalOperator(joinder) {
      operators[operator] = function (path, values) {
        requireType(operator, Array, values);
        var conditions = values.join(' ' + joinder + ' ');
        return path ? '( ' + conditions + ' )' : conditions;
      };
    }
  };
}

var eq = 'eq';
var eqOperator = '' + prefix + eq;
defineOperator(eq).comparisonOperator('=');
defineOperator('ne').comparisonOperator('<>');
defineOperator('gt').comparisonOperator('>');
defineOperator('gte').comparisonOperator('>=');
defineOperator('lt').comparisonOperator('<');
defineOperator('lte').comparisonOperator('<=');

var pathAndArray = { requirePath: true, requireType: Array };
defineOperator('between', pathAndArray, function (path, _ref) {
  var _ref2 = _slicedToArray(_ref, 2);

  var low = _ref2[0];
  var high = _ref2[1];
  return path + ' BETWEEN ' + low + ' AND ' + high;
});
defineOperator('in', pathAndArray, function (path, values) {
  return path + ' IN (' + values.join(', ') + ')';
});
defineOperator('nin', pathAndArray, function (path, values) {
  return 'NOT ' + path + ' IN (' + values.join(', ') + ')';
});

defineOperator('exists', { requirePath: true, requireType: Boolean, noParse: true }, function (path, value) {
  var method = value ? 'attribute_exists' : 'attribute_not_exists';
  return method + '(' + path + ')';
});

defineOperator('type').functionalOperator('attribute_type');
defineOperator('beginsWith').functionalOperator('begins_with');
defineOperator('contains').functionalOperator('contains');

var size = 'size';
defineOperator(size, { requirePath: true, noParse: true }, function (path) {
  return 'size(' + path + ')';
});
var sizeOperator = '' + prefix + size;
var match = new RegExp('\\' + sizeOperator, 'g');
var sizeError = function sizeError(input) {
  return new Error('invalid ' + sizeOperator + ' structure \'' + input + '\'');
};
var validSizeOperator = function validSizeOperator(input) {
  if (input.match(match).length > 1) throw sizeError(input);
  if (!input.endsWith('.' + sizeOperator)) throw sizeError(input);
  return input.replace('.' + sizeOperator, '');
};

defineOperator('or').logicalOperator('OR');
defineOperator('and').logicalOperator('AND');

defineOperator('not', {}, function (path, value) {
  return 'NOT ' + value;
});
defineOperator('nor', { requireType: Array }, function (path, values) {
  return 'NOT ( ' + values.join(' OR ') + ' )';
});

exports.noParse = noParse;
exports.operators = operators;
exports.eqOperator = eqOperator;
exports.sizeOperator = sizeOperator;
exports.validSizeOperator = validSizeOperator;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = parseExpressions;

var _config = require('./config');

var _utils = require('./utils');

var _operators = require('./operators');

var _operators2 = _interopRequireDefault(_operators);

var _attributeList = require('./attribute-list');

var _attributeList2 = _interopRequireDefault(_attributeList);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var eq = _operators2.default.eq;
var size = _operators2.default.size;

var isEndput = function isEndput(input) {
  return ['String', 'Number', 'Boolean', 'Null'].includes((0, _utils.typeOf)(input));
};

function parseExpressions(expressionInputs) {
  var convertValues = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!(0, _utils.isType)('Object', expressionInputs) || !Object.keys(expressionInputs).length) return {};

  var operatorPrefix = _config.options.operatorPrefix,
      attributePrefix = _config.options.attributePrefix;

  var names = new _attributeList2.default({ prefix: '#' });
  var values = new _attributeList2.default({ prefix: ':' });

  var isOperator = function isOperator(input) {
    if (!input.startsWith(operatorPrefix)) return false;
    if (Object.keys(_operators2.default).includes(input.slice(operatorPrefix.length))) return true;
    return false;
  };

  function parseString(string, list) {
    if (string.includes(operatorPrefix + 'size')) return size(string, { names: names, parseString: parseString });
    if (list === values) return list.add(string);
    if (string.startsWith(attributePrefix)) return list.add(string.slice(attributePrefix.length));
    return string.split('.').map(function (val) {
      return list.add(val);
    }).join('.');
  }

  var joinder = void 0;

  function parse(input, path) {
    if ((0, _utils.isType)('String', input)) return parseString(input, values);
    if (isEndput(input)) return values.add(input);
    if ((0, _utils.isType)('Array', input)) return input.map(function (operand) {
      return parse(operand, path);
    });

    if (!(0, _utils.isType)('Object', input)) throw new Error('invalid input argument'); // necessary?

    return Object.entries(input).reduce(function (expression, _ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];

      var finish = function finish(segment) {
        return expression ? '' + expression + joinder + segment : segment;
      };

      if (isOperator(key)) {
        var operator = _operators2.default[key.slice(operatorPrefix.length)];
        return finish(operator(path, value, { parse: parse, parseString: parseString, names: names, values: values }));
      }

      var readiedName = parseString(key, names);
      if (isEndput(value)) return finish(eq(readiedName, value, { parse: parse }));
      return finish(parse(value, readiedName));
    }, null);
  }

  var results = Object.entries(expressionInputs).reduce(function (expressions, _ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        name = _ref4[0],
        operands = _ref4[1];

    if (name === 'ProjectionExpression') {
      if (!(0, _utils.isType)('Array', operands)) throw new Error('projection expression expects array');
      var projection = operands.map(function (path) {
        if (!(0, _utils.isType)('String', path)) throw new Error('projection values must be strings');
        return parseString(path, names);
      }).join(', ');
      return Object.assign(expressions, _defineProperty({}, name, projection));
    }
    joinder = ' AND ';
    if (name === 'UpdateExpression') joinder = ' ';
    return Object.assign(expressions, _defineProperty({}, name, parse(operands)));
  }, {});

  if (names.length) Object.assign(results, { ExpressionAttributeNames: names.map });
  if (values.length) {
    var ExpressionAttributeValues = convertValues ? (0, _utils.convertValues)(values.map) : values.map;
    Object.assign(results, { ExpressionAttributeValues: ExpressionAttributeValues });
  }

  return results;
}
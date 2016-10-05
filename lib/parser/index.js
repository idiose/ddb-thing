'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = parseExpression;

var _list = require('../utils/list');

var _list2 = _interopRequireDefault(_list);

var _operators = require('./operators');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var size = _operators.operators[_operators.sizeOperator];
var eq = _operators.operators[_operators.eqOperator];

var endputs = ['string', 'number', 'boolean'];
var isEndput = function isEndput(input) {
  return endputs.includes(typeof input === 'undefined' ? 'undefined' : _typeof(input)) || input === null;
};

function parseExpression(query) {
  var names = new _list2.default({ prefix: '#' });
  var values = new _list2.default({ prefix: ':' });

  var parseString = function parseString(string, list) {
    if (string.includes(_operators.sizeOperator)) return size(parseString((0, _operators.validSizeOperator)(string), names));
    return string.split('.').map(function (value) {
      return list.add(value);
    }).join('.');
  };

  function parse(input, path) {
    if (Object.keys(_operators.operators).includes(input) || input === undefined) throw new Error('cannot parse ' + input); // TO-DO: better error

    if (typeof input === 'string') return parseString(input, values);
    if (isEndput(input)) return values.add(input);
    if (Array.isArray(input)) return input.map(function (item) {
      return parse(item, path);
    });

    return Object.entries(input).reduce(function (expression, _ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var key = _ref2[0];
      var value = _ref2[1];

      var finish = function finish(segment) {
        return expression ? expression + ' AND ' + segment : segment;
      };

      if (Object.keys(_operators.operators).includes(key)) {
        var _readiedValue = _operators.noParse.includes(key) ? value : parse(value, path || key);
        return finish(_operators.operators[key](path, _readiedValue));
      }

      var readiedName = parseString(key, names);
      var readiedValue = parse(value, readiedName);
      if (isEndput(value)) return finish(eq(readiedName, readiedValue));
      return finish(readiedValue);
    }, undefined);
  }

  var Expression = parse(query);
  return { Expression: Expression, ExpressionAttributeNames: names.map, ExpressionAttributeValues: values.map };
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _config = require('./config');

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _wrapper = require('./wrapper');

var _wrapper2 = _interopRequireDefault(_wrapper);

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function thing(name, definition) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var _options$useRoot = options.useRoot,
      useRoot = _options$useRoot === undefined ? true : _options$useRoot;

  var tableName = useRoot ? '' + _config.options.tableRoot + name : name;
  return (0, _wrapper2.default)(tableName, (0, _schema2.default)(definition));
}

Object.defineProperties(thing, {
  options: { value: _config.options },
  errors: { value: _config.errors },
  AWS: { value: _awsSdk2.default },
  parse: { value: _parser2.default }
});

exports.default = thing;
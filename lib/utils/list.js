'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var List = function () {
  function List() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref$prefix = _ref.prefix;
    var prefix = _ref$prefix === undefined ? '' : _ref$prefix;

    _classCallCheck(this, List);

    this.prefix = prefix;
    this.items = [];
  }

  _createClass(List, [{
    key: 'add',
    value: function add(item) {
      if (!this.items.includes(item)) this.items.push(item);
      return '' + this.prefix + (this.items.indexOf(item) + 1);
    }

    /*
    *values() {
      yield* this.items;
    }
    */

  }, {
    key: 'map',
    get: function get() {
      var _this = this;

      return this.items.reduce(function (output, item, index) {
        return _extends({}, output, _defineProperty({}, '' + _this.prefix + (index + 1), item));
      }, {});
    }
  }]);

  return List;
}();

exports.default = List;
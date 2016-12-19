'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AttributeList = function () {
  function AttributeList() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$prefix = _ref.prefix,
        prefix = _ref$prefix === undefined ? '' : _ref$prefix;

    _classCallCheck(this, AttributeList);

    this.prefix = prefix;
    this.items = [];
  }

  _createClass(AttributeList, [{
    key: 'add',
    value: function add(item) {
      if (!this.items.includes(item)) this.items.push(item);
      return '' + this.prefix + (this.items.indexOf(item) + 1);
    }
  }, {
    key: 'length',
    get: function get() {
      return this.items.length;
    }
  }, {
    key: 'map',
    get: function get() {
      var _this = this;

      return this.items.reduce(function (output, item, index) {
        return Object.assign(output, _defineProperty({}, '' + _this.prefix + (index + 1), item));
      }, {});
    }
  }]);

  return AttributeList;
}();

exports.default = AttributeList;
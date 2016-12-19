'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = function (TableName, schema) {
  var _this = this;

  var ddb = new _awsSdk2.default.DynamoDB();
  var attributes = schema.attributes;


  return {
    put: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(input) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var _parseOptions, response, responseHandler, defaults, required, validate, setters, timestamps, getters, ConditionExpression, ReturnValues, ReturnConsumedCapacity, ReturnItemCollectionMetrics, item, _Object$assign, now, params, data, result;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _parseOptions = parseOptions(schema, options), response = _parseOptions.response, responseHandler = _parseOptions.responseHandler, defaults = _parseOptions.defaults, required = _parseOptions.required, validate = _parseOptions.validate, setters = _parseOptions.setters, timestamps = _parseOptions.timestamps, getters = _parseOptions.getters, ConditionExpression = _parseOptions.conditions, ReturnValues = _parseOptions.returnValues, ReturnConsumedCapacity = _parseOptions.consumedCapacity, ReturnItemCollectionMetrics = _parseOptions.collectionMetrics;
                item = Object.assign({}, input);

                if (defaults) item = (0, _utils.applyDefaults)(item, attributes);
                if (required) (0, _utils.ensureRequired)(item, attributes);

                if (!validate) {
                  _context.next = 7;
                  break;
                }

                _context.next = 7;
                return (0, _utils.validateInput)(item, attributes);

              case 7:
                if (setters) item = (0, _utils.applySetters)(item, attributes);

                if (timestamps) {
                  now = Date.now();

                  Object.assign(item, (_Object$assign = {}, _defineProperty(_Object$assign, schema.timestamps.created, now), _defineProperty(_Object$assign, schema.timestamps.modified, now), _Object$assign));
                }

                params = { TableName: TableName, Item: (0, _utils.convertValues)(item, attributes) };

                if ((0, _utils.isDefined)(ConditionExpression)) Object.assign(params, (0, _parser2.default)({ ConditionExpression: ConditionExpression }));
                if ((0, _utils.isDefined)(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity: ReturnConsumedCapacity });
                if ((0, _utils.isDefined)(ReturnItemCollectionMetrics)) Object.assign(params, { ReturnItemCollectionMetrics: ReturnItemCollectionMetrics });
                if ((0, _utils.isDefined)(ReturnValues)) Object.assign(params, { ReturnValues: ReturnValues });

                _context.next = 16;
                return ddb.putItem(params).promise();

              case 16:
                data = _context.sent;
                result = (0, _utils.isDefined)(data.Attributes) ? data.Attributes : item;


                if (getters) result = (0, _utils.applyGetters)(result, attributes);

                if (!response) {
                  _context.next = 21;
                  break;
                }

                return _context.abrupt('return', Object.assign(data, { Attributes: result }));

              case 21:

                responseHandler({ action: 'put', params: params, data: data });
                return _context.abrupt('return', result);

              case 23:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));

      return function put(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }(),

    get: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(Key) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var _parseOptions2, response, responseHandler, defaults, getters, ProjectionExpression, ReturnConsumedCapacity, ConsistentRead, params, data, Item;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _parseOptions2 = parseOptions(schema, options), response = _parseOptions2.response, responseHandler = _parseOptions2.responseHandler, defaults = _parseOptions2.defaults, getters = _parseOptions2.getters, ProjectionExpression = _parseOptions2.project, ReturnConsumedCapacity = _parseOptions2.consumedCapacity, ConsistentRead = _parseOptions2.consistentRead;
                params = { TableName: TableName, Key: (0, _utils.convertValues)(Key) };


                if ((0, _utils.isDefined)(ProjectionExpression)) Object.assign(params, (0, _parser2.default)({ ProjectionExpression: ProjectionExpression }));
                if ((0, _utils.isDefined)(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity: ReturnConsumedCapacity });
                if ((0, _utils.isDefined)(ConsistentRead)) Object.assign(params, { ConsistentRead: ConsistentRead });

                _context2.next = 7;
                return ddb.getItem(params).promise();

              case 7:
                data = _context2.sent;

                if (data.Item) {
                  _context2.next = 11;
                  break;
                }

                responseHandler({ action: 'get', params: params, data: data });
                throw new Error('no item found with Key ' + JSON.stringify(Key));

              case 11:
                Item = (0, _utils.restoreItem)(data.Item);

                if (defaults && !ProjectionExpression) Item = (0, _utils.applyDefaults)(Item, attributes);
                if (getters) Item = (0, _utils.applyGetters)(Item, attributes);

                if (!response) {
                  _context2.next = 16;
                  break;
                }

                return _context2.abrupt('return', Object.assign(data, { Item: Item }));

              case 16:

                responseHandler({ action: 'get', params: params, data: data });
                return _context2.abrupt('return', Item);

              case 18:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, _this);
      }));

      return function get(_x4, _x5) {
        return _ref2.apply(this, arguments);
      };
    }(),

    scan: function () {
      var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        var _parseOptions3, response, responseHandler, defaults, getters, FilterExpression, ProjectionExpression, IndexName, ExclusiveStartKey, Limit, Select, TotalSegments, ReturnConsumedCapacity, ConsistentRead, params, expressions, handleData, segments, data;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _parseOptions3 = parseOptions(schema, options), response = _parseOptions3.response, responseHandler = _parseOptions3.responseHandler, defaults = _parseOptions3.defaults, getters = _parseOptions3.getters, FilterExpression = _parseOptions3.filter, ProjectionExpression = _parseOptions3.project, IndexName = _parseOptions3.index, ExclusiveStartKey = _parseOptions3.startKey, Limit = _parseOptions3.limit, Select = _parseOptions3.select, TotalSegments = _parseOptions3.segments, ReturnConsumedCapacity = _parseOptions3.consumedCapacity, ConsistentRead = _parseOptions3.consistentRead;
                params = { TableName: TableName };
                expressions = {};

                if ((0, _utils.isDefined)(FilterExpression)) Object.assign(expressions, { FilterExpression: FilterExpression });
                if ((0, _utils.isDefined)(ProjectionExpression)) Object.assign(expressions, { ProjectionExpression: ProjectionExpression });

                if (Object.keys(expressions).length) Object.assign(params, (0, _parser2.default)(expressions, true));
                if ((0, _utils.isDefined)(IndexName)) Object.assign(params, { IndexName: IndexName });
                if ((0, _utils.isDefined)(ExclusiveStartKey)) Object.assign(params, { ExclusiveStartKey: (0, _utils.convertValues)(ExclusiveStartKey) });
                if ((0, _utils.isDefined)(Limit)) Object.assign(params, { Limit: Limit });
                if ((0, _utils.isDefined)(Select) && !(0, _utils.isDefined)(ProjectionExpression)) Object.assign(params, { Select: Select });
                if ((0, _utils.isDefined)(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity: ReturnConsumedCapacity });
                if ((0, _utils.isDefined)(ConsistentRead)) Object.assign(params, { ConsistentRead: ConsistentRead });

                handleData = function handleData(data) {
                  var Items = data.Items;
                  var Count = data.Count,
                      ScannedCount = data.ScannedCount,
                      LastEvaluatedKey = data.LastEvaluatedKey;


                  if ((0, _utils.isDefined)(Items)) {
                    Items = Items.map(_utils.restoreItem);
                    if (defaults) Items = Items.map(function (item) {
                      return (0, _utils.applyDefaults)(item, attributes);
                    });
                    if (getters) Items = Items.map(function (item) {
                      return (0, _utils.applyGetters)(item, attributes);
                    });
                  }

                  var results = { Count: Count, ScannedCount: ScannedCount };
                  if ((0, _utils.isDefined)(Items)) Object.assign(results, { Items: Items });
                  if ((0, _utils.isDefined)(LastEvaluatedKey)) Object.assign(results, { LastEvaluatedKey: (0, _utils.restoreItem)(LastEvaluatedKey) });

                  if (response) return Object.assign(data, results);
                  responseHandler({ action: 'scan', params: params, data: data });
                  return results;
                };

                if (!(0, _utils.isDefined)(TotalSegments)) {
                  _context3.next = 20;
                  break;
                }

                Object.assign(params, { TotalSegments: TotalSegments });
                segments = new Array(TotalSegments).fill().map(function (val, Segment) {
                  return { Segment: Segment };
                });
                _context3.next = 18;
                return Promise.all(segments.map(function (Segment) {
                  return ddb.scan(Object.assign(Segment, params)).promise();
                }));

              case 18:
                data = _context3.sent;
                return _context3.abrupt('return', data.map(handleData));

              case 20:
                _context3.next = 22;
                return ddb.scan(params).promise();

              case 22:
                _context3.t0 = _context3.sent;
                return _context3.abrupt('return', handleData(_context3.t0));

              case 24:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, _this);
      }));

      return function scan(_x7) {
        return _ref3.apply(this, arguments);
      };
    }(),

    query: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(keyConditions) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var _parseOptions4, response, responseHandler, defaults, getters, FilterExpression, ProjectionExpression, IndexName, ExclusiveStartKey, Limit, Select, reverse, ReturnConsumedCapacity, ConsistentRead, params, expressions, data, Items, Count, LastEvaluatedKey, ScannedCount, results;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _parseOptions4 = parseOptions(schema, options), response = _parseOptions4.response, responseHandler = _parseOptions4.responseHandler, defaults = _parseOptions4.defaults, getters = _parseOptions4.getters, FilterExpression = _parseOptions4.filter, ProjectionExpression = _parseOptions4.project, IndexName = _parseOptions4.index, ExclusiveStartKey = _parseOptions4.startKey, Limit = _parseOptions4.limit, Select = _parseOptions4.select, reverse = _parseOptions4.reverse, ReturnConsumedCapacity = _parseOptions4.consumedCapacity, ConsistentRead = _parseOptions4.consistentRead;
                params = { TableName: TableName };
                expressions = { KeyConditionExpression: keyConditions };

                if ((0, _utils.isDefined)(FilterExpression)) Object.assign(expressions, { FilterExpression: FilterExpression });
                if ((0, _utils.isDefined)(ProjectionExpression)) Object.assign(expressions, { ProjectionExpression: ProjectionExpression });

                Object.assign(params, (0, _parser2.default)(expressions, true));
                if ((0, _utils.isDefined)(IndexName)) Object.assign(params, { IndexName: IndexName });
                if ((0, _utils.isDefined)(ExclusiveStartKey)) Object.assign(params, { ExclusiveStartKey: (0, _utils.convertValues)(ExclusiveStartKey) });
                if ((0, _utils.isDefined)(Limit)) Object.assign(params, { Limit: Limit });
                if ((0, _utils.isDefined)(Select) && !(0, _utils.isDefined)(ProjectionExpression)) Object.assign(params, { Select: Select });
                if (reverse === true) Object.assign(params, { ScanIndexForward: false });
                if ((0, _utils.isDefined)(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity: ReturnConsumedCapacity });
                if ((0, _utils.isDefined)(ConsistentRead)) Object.assign(params, { ConsistentRead: ConsistentRead });

                _context4.next = 15;
                return ddb.query(params).promise();

              case 15:
                data = _context4.sent;
                Items = data.Items;
                Count = data.Count, LastEvaluatedKey = data.LastEvaluatedKey, ScannedCount = data.ScannedCount;


                if ((0, _utils.isDefined)(Items)) {
                  Items = Items.map(_utils.restoreItem);
                  if (defaults) Items = Items.map(function (item) {
                    return (0, _utils.applyDefaults)(item, attributes);
                  });
                  if (getters) Items = Items.map(function (item) {
                    return (0, _utils.applyGetters)(item, attributes);
                  });
                }

                results = { Count: Count, ScannedCount: ScannedCount };

                if ((0, _utils.isDefined)(Items)) Object.assign(results, { Items: Items });
                if ((0, _utils.isDefined)(LastEvaluatedKey)) Object.assign(results, { LastEvaluatedKey: (0, _utils.restoreItem)(LastEvaluatedKey) });

                if (!response) {
                  _context4.next = 24;
                  break;
                }

                return _context4.abrupt('return', Object.assign(data, results));

              case 24:
                responseHandler({ action: 'query', params: params, data: data });
                return _context4.abrupt('return', results);

              case 26:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, _this);
      }));

      return function query(_x9, _x10) {
        return _ref4.apply(this, arguments);
      };
    }(),

    update: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(Key, input) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var _parseOptions5, response, responseHandler, validate, setters, timestamps, getters, ConditionExpression, ReturnValues, ReturnConsumedCapacity, ReturnItemCollectionMetrics, updates, prefix, params, expressions, data, _data$Attributes, Attributes;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _parseOptions5 = parseOptions(schema, options), response = _parseOptions5.response, responseHandler = _parseOptions5.responseHandler, validate = _parseOptions5.validate, setters = _parseOptions5.setters, timestamps = _parseOptions5.timestamps, getters = _parseOptions5.getters, ConditionExpression = _parseOptions5.conditions, ReturnValues = _parseOptions5.returnValues, ReturnConsumedCapacity = _parseOptions5.consumedCapacity, ReturnItemCollectionMetrics = _parseOptions5.collectionMetrics;
                updates = Object.assign({}, input);
                prefix = _config.options.operatorPrefix;

                if (Object.keys(updates).filter(function (key) {
                  return key.startsWith(prefix);
                }).length) {
                  _context5.next = 10;
                  break;
                }

                if (!validate) {
                  _context5.next = 7;
                  break;
                }

                _context5.next = 7;
                return (0, _utils.validateInput)(updates, attributes);

              case 7:
                if (setters) updates = (0, _utils.applySetters)(updates, attributes);
                if (timestamps) Object.assign(updates, _defineProperty({}, schema.timestamps.modified, Date.now()));
                updates = _defineProperty({}, prefix + 'set', updates);

              case 10:
                params = { TableName: TableName, Key: (0, _utils.convertValues)(Key) };
                expressions = { UpdateExpression: updates };

                if ((0, _utils.isDefined)(ConditionExpression)) Object.assign(expressions, { ConditionExpression: ConditionExpression });

                Object.assign(params, (0, _parser2.default)(expressions, true));
                if ((0, _utils.isDefined)(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity: ReturnConsumedCapacity });
                if ((0, _utils.isDefined)(ReturnItemCollectionMetrics)) Object.assign(params, { ReturnItemCollectionMetrics: ReturnItemCollectionMetrics });
                if ((0, _utils.isDefined)(ReturnValues)) Object.assign(params, { ReturnValues: ReturnValues });

                _context5.next = 19;
                return ddb.updateItem(params).promise();

              case 19:
                data = _context5.sent;
                _data$Attributes = data.Attributes, Attributes = _data$Attributes === undefined ? {} : _data$Attributes;

                Attributes = (0, _utils.restoreItem)(Attributes);
                if (getters) Attributes = (0, _utils.applyGetters)(Attributes, attributes);

                if (!response) {
                  _context5.next = 25;
                  break;
                }

                return _context5.abrupt('return', Object.assign(data, { Attributes: Attributes }));

              case 25:

                responseHandler({ action: 'update', params: params, data: data });
                return _context5.abrupt('return', Attributes);

              case 27:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, _this);
      }));

      return function update(_x12, _x13, _x14) {
        return _ref5.apply(this, arguments);
      };
    }(),

    delete: function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(key) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var _parseOptions6, response, responseHandler, getters, ConditionExpression, ReturnValues, ReturnConsumedCapacity, ReturnItemCollectionMetrics, params, data, _data$Attributes2, Attributes;

        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _parseOptions6 = parseOptions(schema, options), response = _parseOptions6.response, responseHandler = _parseOptions6.responseHandler, getters = _parseOptions6.getters, ConditionExpression = _parseOptions6.conditions, ReturnValues = _parseOptions6.returnValues, ReturnConsumedCapacity = _parseOptions6.consumedCapacity, ReturnItemCollectionMetrics = _parseOptions6.collectionMetrics;
                params = { TableName: TableName, Key: (0, _utils.convertValues)(key) };

                if ((0, _utils.isDefined)(ConditionExpression)) Object.assign(params, (0, _parser2.default)({ ConditionExpression: ConditionExpression }, true));
                if ((0, _utils.isDefined)(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity: ReturnConsumedCapacity });
                if ((0, _utils.isDefined)(ReturnItemCollectionMetrics)) Object.assign(params, { ReturnItemCollectionMetrics: ReturnItemCollectionMetrics });
                if ((0, _utils.isDefined)(ReturnValues)) Object.assign(params, { ReturnValues: ReturnValues });

                _context6.next = 8;
                return ddb.deleteItem(params).promise();

              case 8:
                data = _context6.sent;
                _data$Attributes2 = data.Attributes, Attributes = _data$Attributes2 === undefined ? {} : _data$Attributes2;

                Attributes = (0, _utils.restoreItem)(Attributes);
                if (getters) Attributes = (0, _utils.applyGetters)(Attributes, attributes);

                if (!response) {
                  _context6.next = 14;
                  break;
                }

                return _context6.abrupt('return', data);

              case 14:

                responseHandler({ action: 'delete', params: params, data: data });
                return _context6.abrupt('return', Attributes);

              case 16:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, _this);
      }));

      return function _delete(_x16, _x17) {
        return _ref6.apply(this, arguments);
      };
    }()
  };
};

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _config = require('./config');

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var optionTypes = {
  timestamps: 'Boolean',
  response: 'Boolean',
  responseHandler: 'Function',
  consumedCapacity: 'String',
  collectionMetrics: 'String',
  consistentRead: 'Boolean',
  returnValues: 'String',
  defaults: 'Boolean',
  required: 'Boolean',
  validate: 'Boolean',
  setters: 'Boolean',
  getters: 'Boolean',
  conditions: 'Object',
  keyConditions: 'Object',
  filter: 'Object',
  project: 'Array',
  index: 'String',
  startKey: 'Object',
  limit: 'Number',
  select: 'String',
  segments: 'Number',
  reverse: 'Boolean'
};

var parseOptions = function parseOptions(schema, options) {
  var defaults = {
    timestamps: _config.options.timestamps,
    response: _config.options.response,
    responseHandler: _config.options.responseHandler,
    consumedCapacity: _config.options.consumedCapacity,
    collectionMetrics: _config.options.collectionMetrics,
    consistentRead: _config.options.consistentRead,
    defaults: _config.options.defaults,
    required: _config.options.required,
    validate: _config.options.validate,
    setters: _config.options.setters,
    getters: _config.options.getters
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Object.entries(options)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _slicedToArray(_step.value, 2),
          option = _step$value[0],
          value = _step$value[1];

      if (!Object.keys(optionTypes).includes(option)) throw new Error('unrecognized option \'' + option + '\'');
      var type = optionTypes[option];
      if (!(0, _utils.isType)(type, value)) throw new Error(option + ' expects a ' + type + ' value');
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

  return Object.assign({}, defaults, schema, options);
};
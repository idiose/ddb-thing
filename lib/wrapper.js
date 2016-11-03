import AWS from 'aws-sdk';
import { options as config } from './config';
import parse from './parser';
import {
  isType,
  isDefined,
  applyDefaults,
  ensureRequired,
  applySetters,
  validateInput,
  applyGetters,
  convertValues,
  restoreItem,
} from './utils';

const optionTypes = {
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
  reverse: 'Boolean',
};

const parseOptions = (schema, options) => {
  const defaults = {
    timestamps: config.timestamps,
    response: config.response,
    responseHandler: config.responseHandler,
    consumedCapacity: config.consumedCapacity,
    collectionMetrics: config.collectionMetrics,
    consistentRead: config.consistentRead,
    defaults: config.defaults,
    required: config.required,
    validate: config.validate,
    setters: config.setters,
    getters: config.getters,
  };

  for (const [option, value] of Object.entries(options)) {
    if (!Object.keys(optionTypes).includes(option)) throw new Error(`unrecognized option '${option}'`);
    const type = optionTypes[option];
    if (!isType(type, value)) throw new Error(`${option} expects a ${type} value`);
  }

  return Object.assign({}, defaults, schema, options);
};

export default function (TableName, schema) {
  const ddb = new AWS.DynamoDB();
  const { attributes } = schema;

  return {
    put: async (input, options = {}) => {
      const {
        response,
        responseHandler,
        defaults,
        required,
        validate,
        setters,
        timestamps,
        getters,
        conditions: ConditionExpression,
        returnValues: ReturnValues,
        consumedCapacity: ReturnConsumedCapacity,
        collectionMetrics: ReturnItemCollectionMetrics,
      } = parseOptions(schema, options);

      let item = Object.assign({}, input);
      if (defaults) item = applyDefaults(item, attributes);
      if (required) ensureRequired(item, attributes);
      if (validate) await validateInput(item, attributes);
      if (setters) item = applySetters(item, attributes);

      if (timestamps) {
        const now = Date.now();
        Object.assign(item, { [schema.timestamps.created]: now, [schema.timestamps.modified]: now });
      }

      const params = { TableName, Item: convertValues(item, attributes) };
      if (isDefined(ConditionExpression)) Object.assign(params, parse({ ConditionExpression }));
      if (isDefined(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity });
      if (isDefined(ReturnItemCollectionMetrics)) Object.assign(params, { ReturnItemCollectionMetrics });
      if (isDefined(ReturnValues)) Object.assign(params, { ReturnValues });

      const data = await ddb.putItem(params).promise();

      let result = (isDefined(data.Attributes)) ? data.Attributes : item;

      if (getters) result = applyGetters(result, attributes);

      if (response) return Object.assign(data, { Attributes: result });

      responseHandler({ action: 'put', params, data });
      return result;
    },

    get: async (Key, options = {}) => {
      const {
        response,
        responseHandler,
        defaults,
        getters,
        project: ProjectionExpression,
        consumedCapacity: ReturnConsumedCapacity,
        consistentRead: ConsistentRead,
      } = parseOptions(schema, options);

      const params = { TableName, Key: convertValues(Key) };

      if (isDefined(ProjectionExpression)) Object.assign(params, parse({ ProjectionExpression }));
      if (isDefined(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity });
      if (isDefined(ConsistentRead)) Object.assign(params, { ConsistentRead });

      const data = await ddb.getItem(params).promise();

      if (!data.Item) {
        responseHandler({ action: 'get', params, data });
        throw new Error(`no item found with Key ${JSON.stringify(Key)}`);
      }

      let Item = restoreItem(data.Item);
      if (defaults && !ProjectionExpression) Item = applyDefaults(Item, attributes);
      if (getters) Item = applyGetters(Item, attributes);

      if (response) return Object.assign(data, { Item });

      responseHandler({ action: 'get', params, data });
      return Item;
    },

    scan: async (options = {}) => {
      const {
        response,
        responseHandler,
        defaults,
        getters,
        filter: FilterExpression,
        project: ProjectionExpression,
        index: IndexName,
        startKey: ExclusiveStartKey,
        limit: Limit,
        select: Select,
        segments: TotalSegments,
        consumedCapacity: ReturnConsumedCapacity,
        consistentRead: ConsistentRead,
      } = parseOptions(schema, options);

      const params = { TableName };

      const expressions = {};
      if (isDefined(FilterExpression)) Object.assign(expressions, { FilterExpression });
      if (isDefined(ProjectionExpression)) Object.assign(expressions, { ProjectionExpression });

      if (Object.keys(expressions).length) Object.assign(params, parse(expressions, true));
      if (isDefined(IndexName)) Object.assign(params, { IndexName });
      if (isDefined(ExclusiveStartKey)) Object.assign(params, { ExclusiveStartKey: convertValues(ExclusiveStartKey) });
      if (isDefined(Limit)) Object.assign(params, { Limit });
      if (isDefined(Select) && !isDefined(ProjectionExpression)) Object.assign(params, { Select });
      if (isDefined(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity });
      if (isDefined(ConsistentRead)) Object.assign(params, { ConsistentRead });

      const handleData = (data) => {
        let { Items } = data;
        const { Count, ScannedCount, LastEvaluatedKey } = data;

        if (isDefined(Items)) {
          Items = Items.map(restoreItem);
          if (defaults) Items = Items.map(item => applyDefaults(item, attributes));
          if (getters) Items = Items.map(item => applyGetters(item, attributes));
        }

        const results = { Count, ScannedCount };
        if (isDefined(Items)) Object.assign(results, { Items });
        if (isDefined(LastEvaluatedKey)) Object.assign(results, { LastEvaluatedKey: restoreItem(LastEvaluatedKey) });

        if (response) return Object.assign(data, results);
        responseHandler({ action: 'scan', params, data });
        return results;
      };

      if (isDefined(TotalSegments)) {
        Object.assign(params, { TotalSegments });
        const segments = new Array(TotalSegments).fill().map((val, Segment) => ({ Segment }));
        const data = await Promise.all(segments.map(Segment => ddb.scan(Object.assign(Segment, params)).promise()));
        return data.map(handleData);
      }

      return handleData(await ddb.scan(params).promise());
    },

    query: async (keyConditions, options = {}) => {
      const {
        response,
        responseHandler,
        defaults,
        getters,
        filter: FilterExpression,
        project: ProjectionExpression,
        index: IndexName,
        startKey: ExclusiveStartKey,
        limit: Limit,
        select: Select,
        reverse,
        consumedCapacity: ReturnConsumedCapacity,
        consistentRead: ConsistentRead,
      } = parseOptions(schema, options);

      const params = { TableName };

      const expressions = { KeyConditionExpression: keyConditions };
      if (isDefined(FilterExpression)) Object.assign(expressions, { FilterExpression });
      if (isDefined(ProjectionExpression)) Object.assign(expressions, { ProjectionExpression });

      Object.assign(params, parse(expressions, true));
      if (isDefined(IndexName)) Object.assign(params, { IndexName });
      if (isDefined(ExclusiveStartKey)) Object.assign(params, { ExclusiveStartKey: convertValues(ExclusiveStartKey) });
      if (isDefined(Limit)) Object.assign(params, { Limit });
      if (isDefined(Select) && !isDefined(ProjectionExpression)) Object.assign(params, { Select });
      if (reverse === true) Object.assign(params, { ScanIndexForward: false });
      if (isDefined(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity });
      if (isDefined(ConsistentRead)) Object.assign(params, { ConsistentRead });

      const data = await ddb.query(params).promise();

      let { Items } = data;
      const { Count, LastEvaluatedKey, ScannedCount } = data;

      if (isDefined(Items)) {
        Items = Items.map(restoreItem);
        if (defaults) Items = Items.map(item => applyDefaults(item, attributes));
        if (getters) Items = Items.map(item => applyGetters(item, attributes));
      }

      const results = { Count, ScannedCount };
      if (isDefined(Items)) Object.assign(results, { Items });
      if (isDefined(LastEvaluatedKey)) Object.assign(results, { LastEvaluatedKey: restoreItem(LastEvaluatedKey) });

      if (response) return Object.assign(data, results);
      responseHandler({ action: 'query', params, data });
      return results;
    },

    update: async (Key, input, options = {}) => {
      const {
        response,
        responseHandler,
        validate,
        setters,
        timestamps,
        getters,
        conditions: ConditionExpression,
        returnValues: ReturnValues,
        consumedCapacity: ReturnConsumedCapacity,
        collectionMetrics: ReturnItemCollectionMetrics,
      } = parseOptions(schema, options);

      let updates = Object.assign({}, input);

      const prefix = config.operatorPrefix;
      if (!Object.keys(updates).filter(key => key.startsWith(prefix)).length) {
        if (validate) await validateInput(updates, attributes);
        if (setters) updates = applySetters(updates, attributes);
        if (timestamps) Object.assign(updates, { [schema.timestamps.modified]: Date.now() });
        updates = { [`${prefix}set`]: updates };
      }

      const params = { TableName, Key: convertValues(Key) };
      const expressions = { UpdateExpression: updates };
      if (isDefined(ConditionExpression)) Object.assign(expressions, { ConditionExpression });

      Object.assign(params, parse(expressions, true));
      if (isDefined(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity });
      if (isDefined(ReturnItemCollectionMetrics)) Object.assign(params, { ReturnItemCollectionMetrics });
      if (isDefined(ReturnValues)) Object.assign(params, { ReturnValues });

      const data = await ddb.updateItem(params).promise();

      let { Attributes = {} } = data;
      Attributes = restoreItem(Attributes);
      if (getters) Attributes = applyGetters(Attributes, attributes);

      if (response) return Object.assign(data, { Attributes });

      responseHandler({ action: 'update', params, data });
      return Attributes;
    },

    delete: async (key, options = {}) => {
      const {
        response,
        responseHandler,
        getters,
        conditions: ConditionExpression,
        returnValues: ReturnValues,
        consumedCapacity: ReturnConsumedCapacity,
        collectionMetrics: ReturnItemCollectionMetrics,
      } = parseOptions(schema, options);

      const params = { TableName, Key: convertValues(key) };
      if (isDefined(ConditionExpression)) Object.assign(params, parse({ ConditionExpression }, true));
      if (isDefined(ReturnConsumedCapacity)) Object.assign(params, { ReturnConsumedCapacity });
      if (isDefined(ReturnItemCollectionMetrics)) Object.assign(params, { ReturnItemCollectionMetrics });
      if (isDefined(ReturnValues)) Object.assign(params, { ReturnValues });

      const data = await ddb.deleteItem(params).promise();

      let { Attributes = {} } = data;
      Attributes = restoreItem(Attributes);
      if (getters) Attributes = applyGetters(Attributes, attributes);

      if (response) return data;

      responseHandler({ action: 'delete', params, data });
      return Attributes;
    },
  };
}

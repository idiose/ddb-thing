import AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();

const conf = { prefix: '' };
const wrappers = new Map();

export default function DDBThing(name, options) {
  DDBThing.setPrefix = prefix => conf.prefix = prefix || conf.prefix;
}

/*
export default (config = {}, awsConfig) => {
  if (awsConfig) AWS.config.update(awsConfig);
}
*/


/*
export default (config) => {

  if (!(config.aws && config.aws.accessKeyId && config.aws.secretAccessKey)) {
    throw new Error('DynamoDB Module: AWS Access Key ID & Secret Access Key required.');
  }

  AWS.config.update(config.aws);

  const DB = new AWS.DynamoDB();
  const docClient = new AWS.DynamoDB.DocumentClient();

  const defaults = config.defaults || {};
  const TableNameRoot = defaults.TableNameRoot || '';

  if (defaults.ensureTables) {
    ensureTables(DB, TableNameRoot, defaults);
  }

  const apis = Object.keys(tableDescriptions);

  return (name) => {

    if (!apis.includes(name)) {
      throw new Error(`DynamoDB Module: Unrecognized data type '${name}'.`);
    }

    const TableName = TableNameRoot + name;

    const module = {

      create: (item) => new Promise((resolve, reject) => {
        const Item = { id: shortid.generate(), created: Date.now(), ...item };
        docClient.put({ TableName, Item }, (err) => {
          if (err) return reject(err);
          resolve(Item);
        });
      }),


      get: (id, passedOptions = {}) => new Promise((resolve, reject) => {
        docClient.get({ TableName, Key: { id }, ...passedOptions }, (err, data) => {
          if (err) return reject(err);
          if (!data.Item) return reject(new Error(`Item not found: no ${name} with id '${id}'.`));
          resolve(data.Item);
        });
      }),


      find: async (_query, _passedOptions) => { // default assignment doesn't seem to like async methods =(
        const _options = _passedOptions || {};
        const params = { TableName, Select: 'ALL_ATTRIBUTES' };
        let index;
        let query;
        const filters = {};
        const { sort: rawSort = '', limit: Limit, ConsistentRead, ...options } = _options;

        const reverse = rawSort.includes('-');
        const sort = rawSort.replace('-', '');

        if (sort) {
          if (_query) {
            const { globals = [], locals = [] } = tableDescriptions[name];
            index = [...globals, ...locals].find(({ partition, sort: indexSort }) => _query.hasOwnProperty(partition) && sort === indexSort);
            if (index) {
              const { partition } = index;
              index = `${partition}-${sort}`;
              query = { [partition]: _query[partition] };
              if (_query.hasOwnProperty('sort')) query[sort] = _query[sort];
              // Object.assign(filters, ...Object.entries(_query).filter(([key]) => ![partition, sort].includes(key)).map(([key, val]) => ({ [key]: val })));
              Object.assign(filters, ...Object.entries(_query).filter(([key]) => key !== partition).map(([key, val]) => ({ [key]: val })));
            }
          }
        }

        query = query || _query;

        if (query) {
          const { Expression, ExpressionAttributeNames, ExpressionAttributeValues } = parseExpression(query);
          Object.assign(params, { ExpressionAttributeNames, ExpressionAttributeValues });
          if (index) {
            Object.assign(params, { IndexName: index, KeyConditionExpression: Expression });
          } else {
            Object.assign(params, { FilterExpression: Expression });
          }
        }

        if (index && Object.keys(filters).length) {
          const { Expression: FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } = parseExpression(filters);
          Object.assign(params, { FilterExpression });
          Object.assign(params.ExpressionAttributeNames, ExpressionAttributeNames);
          Object.assign(params.ExpressionAttributeValues, ExpressionAttributeValues);
        }

        if (Limit) Object.assign(params, { Limit });

        if (ConsistentRead) Object.assign(params, { ConsistentRead });

        const results = await fetch((index) ? 'query' : 'scan', params);
        if (!index && sort && results.length && results[0].hasOwnProperty(sort)) results.sort((itemA, itemB) => itemA[sort] > itemB[sort]);
        if (reverse) results.reverse();

        if (Limit) {
          return results.slice(0, Limit);
        }

        return results;
      },

      update: (id, updates, conditionQuery, passedOptions = {}) => new Promise((resolve, reject) => {
        module.get(id, passedOptions).then(item => { // (marco): i wonder if this get should be a consistent read... or use the docClient.update method instead of .put?
          const Item = { ...item, ...updates, modified: Date.now() };
          const params = { TableName, Item };

          if (conditionQuery) {
            const { Expression, ExpressionAttributeNames, ExpressionAttributeValues } = parseExpression(conditionQuery);
            Object.assign(params, { ExpressionAttributeNames, ExpressionAttributeValues });
            Object.assign(params, { ConditionExpression: Expression });
          }

          docClient.put(params, (err) => {
            if (err) return reject(err);
            resolve(Item);
          });
        }, reject);
      }),

      delete: (id) => new Promise((resolve, reject) => {
        docClient.delete({ TableName, Key: { id } }, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      }),

    };

    return module;
  };
};
*/

import 'babel-polyfill'; // required for testing =(
import AWS from 'aws-sdk';
import shortid from 'shortid';
import uuid from 'uuid';

/* ----==== ENSURE TABLES ====---- */
const tableDescriptions = {
  users: {
    attributes: [],
  },
  groups: {
    attributes: [],
  },
  nodes: {
    attributes: [
      { AttributeName: 'node', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
      { AttributeName: 'created', AttributeType: 'N' },
    ],
    globals: [
      { partition: 'node', sort: 'name', include: ['slug', 'hidden'] },
      { partition: 'node', sort: 'created', include: ['name', 'slug', 'hidden'] },
    ],
  },
  documents: {
    attributes: [
      { AttributeName: 'node', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
      { AttributeName: 'created', AttributeType: 'N' },
    ],
    globals: [
      { partition: 'node', sort: 'name', include: ['slug', 'master', 'template', 'yields', 'hidden'] },
      { partition: 'node', sort: 'created', include: ['name', 'slug', 'master', 'template', 'yields', 'hidden'] },
    ],
  },
  branches: {
    attributes: [
      { AttributeName: 'document', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
      { AttributeName: 'created', AttributeType: 'N' },
    ],
    globals: [
      { partition: 'document', sort: 'name', include: ['master', 'head'] },
      { partition: 'document', sort: 'created', include: ['name'] },
    ],
  },
  commits: {
    attributes: [
      { AttributeName: 'branch', AttributeType: 'S' },
      { AttributeName: 'created', AttributeType: 'N' },
      { AttributeName: 'owner', AttributeType: 'S' },
    ],
    globals: [
      { partition: 'branch', sort: 'created', include: ['date', 'owner', 'description', 'components', 'properties'] },
      { partition: 'owner', sort: 'created', include: ['date', 'branch', 'description', 'components', 'properties'] },
    ],
  },
  schemas: {
    attributes: [],
  },
  publications: {
    attributes: [],
  },
  publicationRecords: {
    attributes: [],
  },
  requests: {
    attributes: [
      { AttributeName: 'owner', AttributeType: 'S' },
      { AttributeName: 'assignee', AttributeType: 'S' },
      { AttributeName: 'created', AttributeType: 'N' },
    ],
    globals: [
      { partition: 'owner', sort: 'created', include: ['date', 'type', 'status', 'assignee', 'data', 'message'] },
      { partition: 'assignee', sort: 'created', include: ['date', 'type', 'status', 'owner', 'data', 'message'] },
    ],
  },
  events: {
    attributes: [
      { AttributeName: 'owner', AttributeType: 'S' },
      { AttributeName: 'created', AttributeType: 'N' },
    ],
    globals: [
      { partition: 'owner', sort: 'created', include: ['type', 'status'] },
    ],
  },
};

const buildIndex = ({ partition = 'id', sort, include }) => ({
  IndexName: `${partition}-${sort}`,
  KeySchema: [{ AttributeName: partition, KeyType: 'HASH' }, { AttributeName: sort, KeyType: 'RANGE' }],
  Projection: (include) ? { ProjectionType: 'INCLUDE', NonKeyAttributes: include } : { ProjectionType: 'KEYS_ONLY' },
});

const ensureTables = (DB, TableNameRoot, defaults) => {
  const ReadCapacityUnits = defaults.ReadCapacityUnits || 1;
  const WriteCapacityUnits = defaults.WriteCapacityUnits || 1;
  const ProvisionedThroughput = { ReadCapacityUnits, WriteCapacityUnits };

  Object.entries(tableDescriptions).forEach(([name, { attributes, globals, locals }]) => {
    const tableParams = {
      TableName: TableNameRoot + name,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: attributes.concat({ AttributeName: 'id', AttributeType: 'S' }),
      ProvisionedThroughput,
    };

    if (globals) {
      tableParams.GlobalSecondaryIndexes = globals.map(buildIndex).map((index) => Object.assign(index, { ProvisionedThroughput }));
    }

    if (locals) {
      tableParams.LocalSecondaryIndexes = locals.map(buildIndex);
    }

    DB.describeTable({ TableName: tableParams.TableName }, (describeTableErr) => {
      // TO-DO: handle other errors/compare schema
      if (describeTableErr && describeTableErr.code === 'ResourceNotFoundException') {
        console.log('DynamoDB Module:', tableParams.TableName, 'doesn\'t exist. Creating...');

        DB.createTable(tableParams, (createTableErr, data) => {
          // TO-DO: handle errors/responses
          console.log(createTableErr);
          console.log(data);
        });
      }
    });
  });
};

/* ----==== EXPRESSION PARSING ====---- */

/*
const sampleQuery = {
  $and: [
    { $or: [
      { eyes: { $size: { $gt: { mouth: { $size: null }}}}},
      { friends: { $gt: 500 }},
      { job: { $in: ['police officer', 'lawyer', 'nurse']}}
    ]},
    { $or: [
      { passcard: { $exists: false }},
      { creditcardnumber: { $type: 'N' }},
      { head: { $nin: ['sky', 'clouds', 'sand'] }},
      { name: { $contains: 'est' }}
    ]},
    { "meta.characters.favorite": { $in: ['rick', 'morty'] } },
  ]
}
*/

const _comparators = (comparator, path, value) => `${path} ${comparator} ${value}`;
const _functions = (name, path, value) => `${name}(${((value) ? [path, value].join(', ') : path)})`;

// const _logicals = (logical, value) => `( ${value.join(` ${logical} `)} )`;
const _logicals = (logical, value) => {
  const joined = value.join(` ${logical} `);
  if (value.length > 1) return `( ${joined} )`;
  return joined;
};

const _renderers = {
  $eq: (path, value) => _comparators('=', path, value),
  $ne: (path, value) => _comparators('<>', path, value),
  $gt: (path, value) => _comparators('>', path, value),
  $gte: (path, value) => _comparators('>=', path, value),
  $lt: (path, value) => _comparators('<', path, value),
  $lte: (path, value) => _comparators('<=', path, value),
  $in: (path, value) => `${path} IN (${(value.length) ? value.join(', ') : 'thanksObama'})`,
  $nin: (path, value) => `NOT ${path} IN (${value.join(', ')})`,
  $exists: (path, value, rawValue) => _functions((rawValue) ? 'attribute_exists' : 'attribute_not_exists', path),
  $type: (path, type) => _functions('attribute_type', path, type),
  $beginsWith: (path, substring) => _functions('begins_with', path, substring),
  $contains: (path, operand) => _functions('contains', path, operand),
  $size: (path, value) => (value) ? `size(${path}) ${value.replace(`${path} `, '')}` : `size(${path})`,
  $or: (path, values) => _logicals('OR', values),
  $and: (path, values) => _logicals('AND', values),
  $not: (path, value) => `NOT ${value}`,
};

const DBOperators = Object.keys(_renderers);
const unsafeExpressionCharacters = /[^A-Za-z0-9]/g;

const parseExpression = (query) => {

  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};

  const parse = (segment, path) => {
    if (typeof segment !== 'boolean' && segment !== 0 && !segment) return segment;

    if (['string', 'number', 'boolean'].includes(typeof segment)) {
      const valueRef = `:${uuid.v4().split('-')[0]}`;
      const attributeValue = Object.entries(ExpressionAttributeValues).find(([, val]) => val === segment);
      if (attributeValue) return attributeValue[0];
      Object.assign(ExpressionAttributeValues, { [valueRef]: segment });
      return valueRef;
    }

    if (Array.isArray(segment)) return segment.map(parse);

    const [key, _value] = Object.entries(segment)[0];
    let value = _value;

    if (DBOperators.includes(key)) return _renderers[key](path, parse(value, path), value);

    if (typeof value !== 'object') {
      value = { $eq: value };
    }

    const nextPath = `#${key.replace(unsafeExpressionCharacters, '')}`;
    Object.assign(ExpressionAttributeNames, { [nextPath]: key });
    return parse(value, nextPath);
  };

  let segment = query;
  if (Object.keys(query).length > 1) {
    segment = { $and: Object.entries(query).map(([key, value]) => ({ [key]: value })) };
  }

  const Expression = parse(segment);
  Object.keys(ExpressionAttributeValues).forEach(key => {
    if (!Expression.includes(key)) delete ExpressionAttributeValues[key];
  });

  return {
    Expression,
    ExpressionAttributeNames,
    ExpressionAttributeValues: (Object.keys(ExpressionAttributeValues).length) ? ExpressionAttributeValues : null, // Note: prolly gonna cause problems
  };
};

/* ----==== Module ====---- */

export default (config) => {

  if (!(config.aws && config.aws.accessKeyId && config.aws.secretAccessKey)) {
    throw new Error('DynamoDB Module: AWS Access Key ID & Secret Access Key required.');
  }

  AWS.config.update(config.aws);

  const DB = new AWS.DynamoDB();
  const docClient = new AWS.DynamoDB.DocumentClient();

  const fetch = (method, { Limit: limit = 1000, ...params }, itemCount = 0) => new Promise((resolve, reject) => {
    docClient[method](params, async (err, result) => {
      const { Items, LastEvaluatedKey: ExclusiveStartKey } = result || {};

      if (err) return reject(err);
      if (ExclusiveStartKey && itemCount < limit) {
        return resolve([...Items, ... await fetch(method, { ...params, Limit: limit, ExclusiveStartKey }, itemCount + Items.length)]);
      }

      resolve(Items);
    });
  });

  const defaults = config.defaults || {};
  const TableNameRoot = defaults.TableNameRoot || '';

  if (defaults.ensureTables) {
    ensureTables(DB, TableNameRoot, defaults);
  }

  const apis = Object.keys(tableDescriptions);

  return (name) => {

    if (!apis.includes(name)) {
      throw new Error(`DynamoDB Module: Unrecognized data type '${name}'.`);
    }

    const TableName = TableNameRoot + name;

    const module = {

      /* ----========---- */
      create: (item) => new Promise((resolve, reject) => {
        const Item = { id: shortid.generate(), created: Date.now(), ...item };
        docClient.put({ TableName, Item }, (err) => {
          if (err) return reject(err);
          resolve(Item);
        });
      }),

      /* ----========---- */
      get: (id, passedOptions = {}) => new Promise((resolve, reject) => {
        docClient.get({ TableName, Key: { id }, ...passedOptions }, (err, data) => {
          if (err) return reject(err);
          if (!data.Item) return reject(new Error(`Item not found: no ${name} with id '${id}'.`));
          resolve(data.Item);
        });
      }),

      /* ----========---- */
      find: async (_query, _passedOptions) => { // default assignment doesn't seem to like async methods =(
        const _options = _passedOptions || {};
        const params = { TableName /*, Select: 'ALL_ATTRIBUTES' */ };
        let index;
        let query;
        const filters = {};
        const { sort: rawSort = '', limit: Limit, ConsistentRead, ...options } = _options;

        const reverse = rawSort.includes('-');
        const sort = rawSort.replace('-', '');

        if (sort) {
          if (_query) {
            const { globals = [], locals = [] } = tableDescriptions[name];
            index = [...globals, ...locals].find(({ partition, sort: indexSort }) => _query.hasOwnProperty(partition) && sort === indexSort);
            if (index) {
              const { partition } = index;
              index = `${partition}-${sort}`;
              query = { [partition]: _query[partition] };
              if (_query.hasOwnProperty('sort')) query[sort] = _query[sort];
              // Object.assign(filters, ...Object.entries(_query).filter(([key]) => ![partition, sort].includes(key)).map(([key, val]) => ({ [key]: val })));
              Object.assign(filters, ...Object.entries(_query).filter(([key]) => key !== partition).map(([key, val]) => ({ [key]: val })));
            }
          }
        }

        query = query || _query;

        if (query) {
          const { Expression, ExpressionAttributeNames, ExpressionAttributeValues } = parseExpression(query);
          Object.assign(params, { ExpressionAttributeNames, ExpressionAttributeValues });
          if (index) {
            Object.assign(params, { IndexName: index, KeyConditionExpression: Expression });
          } else {
            Object.assign(params, { FilterExpression: Expression });
          }
        }

        if (index && Object.keys(filters).length) {
          const { Expression: FilterExpression, ExpressionAttributeNames, ExpressionAttributeValues } = parseExpression(filters);
          Object.assign(params, { FilterExpression });
          Object.assign(params.ExpressionAttributeNames, ExpressionAttributeNames);
          Object.assign(params.ExpressionAttributeValues, ExpressionAttributeValues);
        }

        if (Limit) Object.assign(params, { Limit });

        if (ConsistentRead) Object.assign(params, { ConsistentRead });

        const results = await fetch((index) ? 'query' : 'scan', params);
        if (!index && sort && results.length && results[0].hasOwnProperty(sort)) results.sort((itemA, itemB) => itemA[sort] > itemB[sort]);
        if (reverse) results.reverse();

        if (Limit) {
          return results.slice(0, Limit);
        }

        return results;
      },

      /* ----========---- */
      update: (id, updates, conditionQuery, passedOptions = {}) => new Promise((resolve, reject) => {
        module.get(id, passedOptions).then(item => { // (marco): i wonder if this get should be a consistent read... or use the docClient.update method instead of .put?
          const Item = { ...item, ...updates, modified: Date.now() };
          const params = { TableName, Item };

          if (conditionQuery) {
            const { Expression, ExpressionAttributeNames, ExpressionAttributeValues } = parseExpression(conditionQuery);
            Object.assign(params, { ExpressionAttributeNames, ExpressionAttributeValues });
            Object.assign(params, { ConditionExpression: Expression });
          }

          docClient.put(params, (err) => {
            if (err) return reject(err);
            resolve(Item);
          });
        }, reject);
      }),

      /* ----========---- */
      delete: (id) => new Promise((resolve, reject) => {
        docClient.delete({ TableName, Key: { id } }, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      }),

    };

    return module;
  };
};

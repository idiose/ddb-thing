// TO-DO: wrap output (virtuals, defaults, getters, etc.)

import AWS from 'aws-sdk';

AWS.config.update({
  region: 'ap-northeast-1',
  endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();

export default function (TableName, schema) {
  const { timestamps, setDefaults, compelRequired, runSetters, runGetters, validate } = schema;
  // TO-DO: allow schema definitions to disable hooks & transforms across the board

  const wrapper = {
    create: async (input, options = {}) => {
      let Item = input;
      // console.log(JSON.stringify(Item), '==== INPUT');
      if (!options.skipDefaults) Item = setDefaults(Item);
      // console.log(JSON.stringify(Item), '==== DEFAULTED');
      if (!options.skipRequired) compelRequired(Item);
      if (!options.skipValidation) await validate(Item);
      // console.log(JSON.stringify(Item), '==== VALIDATED');
      if (!options.skipSetters) Item = runSetters(Item);
      // console.log(JSON.stringify(Item), '==== SET');
      if (timestamps && !options.skipValidation) {
        const now = Date.now();
        Object.assign(Item, { [timestamps.created]: now, [timestamps.modified]: now });
      }
      // console.log(JSON.stringify(Item), '==== TIMESTAMPED');

      // TO-DO: before hooks
      // const data = await docClient.put({ TableName, Item }).promise();
      // TO-DO: after hooks
      if (!options.skipGetters) Item = runGetters(Item);
      // console.log(JSON.stringify(Item), '==== GOT');
      return Item;
    },

    get: async (Key, options = {}) => {
      // const ddbOptions = options.ddb || {};
      // const data = await docClient.get({ TableName, Key, ...ddbOptions }).promise();
      const data = 'lol';
      if (!data.Item) throw new Error('Item not found'); // TO-DO: let client handle this?
      let item = data.Item;
      if (!options.skipDefaults) item = setDefaults(item);
      if (!options.skipGetters) item = runGetters(item);
      return item;
    },

    find: async (query, options = {}) => {
      options();
      // use options.sort to determine scan vs. query via table introspection?
      // QUERY:
      // KeyConditionExpression
      // ScanIndexForward

      // SCAN:
      // Segment, TotalSegments

      // BOTH:
      // IndexName ??
      // ExclusiveStartKey
      // FilterExpression
      // Select, ProjectionExpression
      // Limit
    },

    update: async (Key, updates, options = {}) => {
      options();
      // oh boy...
      /*
      let Item = input;
      if (!options.skipDefaults) Item = setDefaults(Item);
      if (!options.skipTransforms) Item = setSetters(Item);
      if (!options.skipValidation) Item = validate(Item);
      if (timestamps && !options.skipValidation) {
        const now = Date.now();
        Object.assign(Item, { [timestamps.created]: now, [timestamps.modified]: now });
      }

      // TO-DO: before hooks?
      await docClient.put({ TableName, Item }).promise();
      // TO-DO: after hooks?
      return Item;
      */
    },

    delete: async (Key, conditions = {}, options = {}) => {
      options();
      const data = await docClient.delete({ TableName, Key }).promise();
      return data;
    },
  };

  // statics? methods?
  return wrapper;
}

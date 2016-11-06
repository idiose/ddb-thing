# DDB Thing

DDB Thing is an API wrapper meant to make working with [DynamoDB](https://aws.amazon.com/dynamodb) in Node.js more manageable.

## Getting Started

### Installation

```sh
$ npm install ddb-thing
```

### Configuring AWS

DDB Thing uses the [AWS SDK for Javascript](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html), which requires [configuration](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/configuring-the-jssdk.html).

```js
import thing from 'ddb-thing';

thing.AWS.config.loadFromPath('./awsconfig.json');
```

### Usage

```js
thing.options.tableRoot = 'my-project-';

const schema = {
  attributes: { username: String, email: String },
  timestamps: true,
};

const users = thing('users', schema); // will use table 'my-project-users'
const messages = thing('messages', messageSchema, { useRoot: false }); // will use table 'messages'

const conditions = { email: { $exists: false } };
const newUser = await users.put({ username: 'username', email: 'email' }, { conditions });
```

### Options

The following can be reassigned (`thing.options[option]`)

Option | Type | Default | Description
--- | --- | --- | ---
**tableRoot** | `String` | `''` | used as `TableName` prefix for namespaced tables
**operatorPrefix** | `String` | `'$'` | used to identify operators when parsing expressions
**attributePrefix** | `String` | `'#'` | used to indicate a path containing `'.'`s is _not_ referring to nested values
**response** | `Boolean` | `false` | when `true`, thing actions return the full DynamoDB response
**responseHandler** | `Function` | `() => {}` | see below
**created** | `String` | `'created'` | the attribute name to use for timestamps
**modified** | `String` | `'modified'` | the attribute name to use for timestamps
**consumedCapacity** | `String` | `undefined` | set this to _always_ pass a [ReturnConsumedCapacity](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ConsumedCapacity.html) parameter to AWS
**collectionMetrics** | `String` | `undefined` | set this to _always_ pass a [ReturnItemCollectionMetrics](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ItemCollectionMetrics.html) parameter to AWS
**consistentRead** | `Boolean` | `undefined` | set this to _always_ pass a `ConsistentRead` parameter to AWS
**defaults** | `Boolean` | `true` | toggles applying default attribute values
**required** | `Boolean` | `true` | toggles compelling attributes marked as required to be present when using `.put`
**validate** | `Boolean` | `true` | toggles input validation
**setters** | `Boolean` | `true` | toggles applying setters
**getters** | `Boolean` | `true` | toggles applying getters

**responseHandler** is meant to divorce monitoring logic from item interaction. When `response` is `false` (the default), DDB Thing will return only the data relevant to the action used (`Item`s, `Count`, etc.) and call this method with the single argument `{ action, params, data }`.

* **action**: the action called (`put`, `get`, etc.)
* **params**: the complete params as passed to AWS (with the exception of `Segment` which can be inferred from param order)
* **data**: the complete DynamoDB response

#### Errors

Each built-in validation error can be reassigned (`thing.errors[error]`) to either a `String` or a `Function`.
Functions can, in general, expect arguments:

* **path**: the attribute path (i.e. `'name.first'`, `'age'`)
* **type**: the expected type (i.e. `'String'`, `'Number'`)
* **value**: the value provided (i.e. `'Peter'`, `45`)
* **optionValue**: the value provided in the schema for the given option (i.e. for `{..., min: 5 }` the optionValue is `5`)

Built in errors: `type`, `required`, `enum`, `match`, `minlength`, `maxlength`, `min`, `max`

```js
thing.errors.type = 'wrong type!';
thing.errors.match = (path, type, value, regExp) => `${path} was supposed to match '${regExp}'!`;
```

## Schemas

```js
const attributeOptions = {};
const descriptionOptions = {};

const customTypeErrorString = 'wrong type!';
const customTypeErrorFunction = (path, type) => `expected a ${type} at ${path}!`;

const description = {
  attributes: {
    region: String,
    email: [String, customTypeErrorString],
    name: {
      first: { type: String, ...attributeOptions },
      last: { type: [String, customTypeErrorFunction], ...attributeOptions },
    },
  },
  ...descriptionOptions,
}
```

### Attribute Types & Options

DDB Thing currently only supports `String`, `Number`, `Boolean`, `Array`, `Object`, and `Set` types.

#### Attribute Options

Attribute Type | Option | Value Type | Description
--- | --- | --- | ---
`Any` | `required` | `Boolean` | Indicates the attribute is required.
`Any` | `default` | `Any` | Default value when none exists.
`Any` | `validate` | `Function`, `Array` | See custom validation
`Any` | `set` | `Function`, `Array` | See setters & getters
`Any` | `get` | `Function`, `Array` | See setters & getters
`String`, `Number` | `enum` | `Array` | Indicates value must be one of provided values
`String` | `match` | `RegExp` | Validates value against provided regular expression
`String` | `minlength` | `Number` | Indicates `value.length` must be at least *n*
`String` | `maxlength` | `Number` | Indicates `value.length` cannot exceed *n*
`String` | `lowercase` | `Boolean` | Includes a `.toLowerCase()` setter
`String` | `uppercaes` | `Boolean` | Includes a `.toUpperCase()` setter
`String` | `trim` | `Boolean` | Includes a `.trim()` setter
`Number` | `min` | `Number` | Indicates value must be at least *n*
`Number` | `max` | `Number` | Indicates value cannot exceed *n*

#### Custom Validation
Custom validators (synchronous or asynchronous) are passed to the `validate` option as a function or array of functions.

```js
const validName = (value) => {
  if (!/^[A-Za-z0-9]+$/.test(value)) throw new Error('Invalid username');
};

const validTitle = async (value) => {
  const { id } = await imdb.findMovieByTitle(value);
  if (!id) throw new Error('Can\t find that movie');
};

const attribtues = {
  username: { type: String, minlength: 6, validate: validName },
  favoriteMovie: { type: String, validate: [validName, validTitle] },
};
```

#### Setters & Getters
DDB Thing setters & getters are executed in the order they are defined. Setters are run after validators.

```js
const spacesToDots = value => value.replace(/\s/g, '.');
const dashesToDots = value => value.replace(/\-/g, '.');
const stats = ['pending', 'active', 'inactive'];
const statusCodeToString = value => stats[value];

const = attributes = {
  phone: { type: String, trim: true, set: [spacesToDots, dashesToDots] },
  status: { type: Number, enum: [0, 1, 2], get: statusCodeToString },
};
```

### Description Options

Schemas can override any of the following thing options:

`response`, `responseHandler`, `defaults`, `required`, `validate`, `setters`, `getters`, `consistentRead`, `consumedCapacity`, `collectionMetrics`

Schemas can also customize timestamps:

```js
description.timestamps = true;
description.timestamps = { created: 'createAt' };
description.timestamps = { modified: 'lastUpdated' };
description.timestamps = { created: 'C', modified: 'M' };
```

## API

In addition to the specified parameters, actions can also override the following schema options (when applicable):

`response`, `responseHandler`, `defaults`, `required`, `validate`, `setters`, `timestamps`, `getters`, `consistentRead`, `consumedCapacity`, `collectionMetrics`

### .put(*Key*[, { *conditions*, *returnValues* }])
Writes an item to the table. Delegates to [DynamoDB.putItem](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html)

* **conditions**: parses a [ConditionExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.SpecifyingConditions.html)
* **returnValues**: forwards value as `ReturnValues` param

```js
const user = await users.put({ hash: 'ABC', range: 123 });

// to prevent overwriting an existing item, pass conditions
const conditions = { hash: { $exists: false } };
const user = await users.put({ hash: 'ABC', range: 123 }, { conditions });
```

### .get(*Key*[, { *project* }])
Retrieves an item with provided Key. Delegates to [DynamoDB.getItem](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html)

* **Key**: the item's primary Key
* **project**: parses a [ProjectionExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.AccessingItemAttributes.html)

```js
const user = await users.get({ hash: 'ABC', range: 123 });
const { name, address } = await users.get({ hash: 'ABC', range: 123 }, { project: ['name', 'address'] });
```

### .scan([, { *filter*, *project*, *index*, *startKey*, *limit*, *select*, *segments* }])
Scans table for Items. Delegates to [DynamoDB.scan](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html)

* **filter**: parses a [FilterExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/QueryAndScan.html#FilteringResults)
* **project**: parses a [ProjectionExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.AccessingItemAttributes.html)
* **index**: forwards value as `IndexName` param
* **startKey**: forwards Key as `ExclusiveStartKey` param
* **limit**: forwards value as `Limit` param
* **select**: forwards value as `Select` param (unless `project` is also being passed)
* **segments**: initiates a parallel scan with the specified number of segments

```js
const { Items, Count, ScannedCount, LastEvaluatedKey } = await users.scan({ filter: { active: true } });
const [segmentOne, segmentTwo] = await users.scan({ project: ['name', 'address'], segments: 2 });
const { Item: { name, address } } = segmentOne;
```

### .query(*KeyCondition*[, { *filter*, *project*, *index*, *startKey*, *limit*, *select*, *reverse* }])
Queries a table at the specified partition. Delegates to [DynamoDB.query](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html)

* **KeyCondition**: parses a [KeyConditionExpression](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-KeyConditionExpression)
* **filter**: parses a [FilterExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/QueryAndScan.html#FilteringResults)
* **project**: parses a [ProjectionExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.AccessingItemAttributes.html)
* **index**: forwards value as `IndexName` param
* **startKey**: forwards Key as `ExclusiveStartKey` param
* **limit**: forwards value as `Limit` param
* **select**: forwards value as `Select` param (unless `project` is also being passed)
* **reverse**: if `true`, forwards `ScanIndexForward` param as `false`

```js
const key = { hash: 'ABC', range: { $between: [0, 100] } };
const filter = { price: { $gt: 50 } };
const { Items, Count, ScannedCount, LastEvaluatedKey } = await query(key, { filter });
```

### .update(*Key*, *updates*[, { *conditions*, *returnValues* }])
Updates an item at specified Key. Delegate to [DynamoDB.updateItem](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html)

* **Key**: the item's primary Key
* **updates**: parses an [UpdateExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.Modifying.html).
* **conditions**: parses a [ConditionExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.SpecifyingConditions.html)
* **returnValues**: forwards value as `ReturnValues` param

_**Note**_: "Simple" `updates` like `{ active: true }` will be interpreted as `{ $set: { active: true } }`. If update operators (`$set`, `$remove`, `$add`, `$delete`) are present, validation, setters, and timestamps are skipped.

```js
const key = { hash: 'ABC', range: 123 };
const user = await users.update(key, { 'name.last': 'Smith' });

const updates = { $set: 'name.last': 'Smith', age: { $inc: 1 }, $delete: { friends: 'Jack' } };
const { name: { last }, age, friends } = await users.update(key, updates, { returnValues: 'UPDATED_NEW' });
```

### .delete(*Key*[, { *conditions*, *returnValues* }])
Delete an item from the table. Delegates to [DynamoDB.delete](http://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_DeleteItem.html)

* **Key**: the item's primary Key
* **conditions**: parses a [ConditionExpression](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.SpecifyingConditions.html)
* **returnValues**: forwards value as `ReturnValues` param

```js
await users.delete({ hash: 'ABC', range: 123 });
```

## Expressions

DDB Thing is built on a utility that parses DynamoDB Expressions from mongo-like argument structures. For those who do not wish to use the wrapper's added utility, the underlying parser can be accessed directly.

**UpdateExpression** and **ProjectionExpression** are special cases; the former will return an appropriately formatted UpdateExpression string, while the latter requires an array of strings and will return an appropriately formatted ProjectionExpression string.

Any other key will return a string formatted as a **ConditionExpression**.

```js
import parse from 'ddb-thing/parser'; // or use thing.parse()

const expressions = {
  KeyConditionExpression: { hash: 'ABC', range: { $between: [50, 100] } },
  UpdateExpression: { $set: { size: 'big', inStock: true }, $delete: { colors: 'blue' } },
  ProjectionExpression: ['size', 'inStock'],
  MySpecialExpression: { $or: [{ service: 'fast' }, { price: 'cheap' }] },
};

const convertValues = true;
const resultOne = parse(expressions);
const resultTwo = parse(expressions, convertValues);
```

resultOne:
```json
{
  "KeyCondtionExpression": "#1 = :1 AND #2 BETWEEN :2 AND :3",
  "UpdateExpression": "SET #3 = :4, #4 = :5 DELETE #5 :6",
  "ProjectionExpression": "#3, #4",
  "MySpecialExpression": "#6 = :7 OR #7 = :8",
  "ExpressionAttributesNames": {
    "#1": "hash",
    "#2": "range",
    "#3": "size",
    "#4": "inStock",
    "#5": "colors",
    "#6": "service",
    "#7": "price",
  },
  "ExpressionAttributeValues": {
    ":1": "ABC",
    ":2": 50,
    ":3": 100,
    ":4": "big",
    ":5": true,
    ":6": "blue",
    ":7": "fast",
    ":8": "cheap",
  }
}
```

resultTwo.ExpressionAttributeValues:
```json
{
  ":1": { "S": "ABC" },
  ":2": { "N": 50 },
  ":3": { "N": 100 },
  ":4": { "S": "big" },
  ":5": { "BOOL": true },
  ":6": { "S": "blue" },
  ":7": { "S": "fast" },
  ":8": { "S": "cheap" },
}
```

## Operators
Operators are identified by the `operatorPrefix` which defaults to `'$'`. `'.'`s in an attribute path assume the path is referring to nested values. If your path is in fact _not_ nested, indicate so with the `attributePrefix`, which defaults to `'#'`.

`{ 'nested.path': 'blue' }` => `'#1.#2 = :1'` vs. `{ '#not.actually.nested': 'red' }` => `'#1 = :1'`

_For readability, `path` => `#path` and `value` => `:value`_

### Comparators

Operator | Example | Result
--- | --- | ---
**eq** | `{ path: { $eq: 'value' } }` | `'#path => :value'`
**ne** | `{ path: { $ne: 'value' } }` | `'#path <> :value'`
**gt** | `{ path: { $gt: value } }` | `'#path > :value'`
**gte** | `{ path: { $gte: 'value' } }` | `'#path >= :value'`
**lt** | `{ path: { $lt: 'value' } }` | `'#path < :value'`
**lte** | `{ path: { $lte: 'value' } }` | `'#path <= :value'`
**between** | `{ path: { $between: ['one', 'two'] } }` | `'#path BETWEEN :one AND :two'`
**in** | `{ path: { $in: ['one', 'two', ...n]} }` | `'#path IN (:one, :two, ...:n)'`
**nin** | `{ path: { $nin: ['one', 'two', ...n]} }` | `'NOT #path IN (:one, :two, ...:n)'`

### Functions

_**Note**_: the `size` operator behaves differently

Operator | Example | Result
--- | --- | ---
**exists** | `{ path: { $exists: true } }` | `'attribute_exists(#path)'`
 | `{ path: { $exists: false } }` | `'attribute_not_exists(#path)'`
**type** | `{ path: { $type: 'S' } }` | `'type(#path, :S)'`
**beginsWith** | `{ path: { $beginsWith: 'value' } }` | `'begins_with(#path, :value)'`
**contains** | `{ path: { $contains: 'value' } }` | `'contains(#path, :value)'`
**size** | `{ $size:path: { $gt: $size:otherPath } }` | `'size(#path) > size(#otherPath)'`


### Logical Evaluations

Operator | Example | Result
--- | --- | ---
**and** | `{ $and: [{ one: 'one' }, { two: 'two' }] }` | `'#one = :one AND #two = :two'`
**or** | `{ $or: [{ path: 'one' }, { path: 'two' }] }` | `'#path = :one OR #path = :two'`
**nor** | `{ $nor: [{ path: 'one' }, { path: 'two' }] }` | `'NOT #path = :one OR #path = :two'`
**not** | `{ $not: { path: { $beginsWith: 'value' } } }` | `'NOT begins_with(#path, :value)'`

### Update Operators

Operator | Example | Result
--- | --- | ---
**set** | `{ $set: { path: 'value' } }` | `'SET #path = :value'`
**append** | `{ path: { $append: 'value' } }` | `'#path = list_append(#path, :value)'`
**prepend** | `{ path: { $prepend: 'value' } }` | `'#path = list_append(:value, #path)'`
**ine** | `{ path: { $ine: 'value' } }` | `'#path = if_not_exists(#path, :value)'`
**inc** | `{ path: { $inc: 5 } }` | `'#path = #path + :5'`
 | `{ path: { $inc: -5 } }` | `'#path = #path - :5'`
**remove** | `{ $remove: ['path', 'nested.path'] }` | `'REMOVE #path, #nested.#path'`
**add** | `{ $add: { path: 'value' } }` | `'ADD #path :value'`
**delete** | `{ $delete: { path: 'value' } }` | `'DELETE #path :value'`

### Behavioral Notes

Input | Output
--- | ---
`{ path: value }` | `#path = :value`
`{ one: 1, two: 2 }` | `#one = :1 AND #two = :2` _when **ConditionExpression**_
`{ one: 1, two: 2 }` | `#one = :1, #two = :2` _when **UpdateExpression**_
`{ $set: { list: { $prepend: 'this', $append: 'that' } } }` | `'SET #list = list_append(:this, #list), #list = list_append(#list, :that)'`
`{ path: { $contains: 'abc', $beginsWith: 'a' } }` | `'contains(#path, :abc) AND begins_with(#path, :a)'`

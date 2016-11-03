# DDB Thing

DDB Thing is an API wrapper meant to make working with [DynamoDB](https://aws.amazon.com/dynamodb) in Node.js more manageable.

## Quick Start

```sh
$ npm install ddb-thing
```

#### Things

```js
import thing from 'ddb-thing';

thing.AWS.config.loadFromPath('./config.json');
thing.options.tableRoot = 'my-project-'; // if your tables are namespaced you can set a global root

const userSchema = {
  attributes: {
    name: { first: String, last: String },
    email: { type: String, required: true },
    friends: Set,
    active: { type: Boolean, default: false },
  },
  timestamps: true,
};

const User = thing('users', userSchema); // will expect a table named 'my-project-users'

export const users = {
  create: async (input) => {
    // ...
    // create a ConditionExpression to prevent overwriting
    const conditions = { email: { $exists: false } };
    const user = await User.put(input, { conditions });
    // ...
    return user;
  },

  activeUserEmails: () => {
    return User.scan({ filter: { active: true }, { project: ['email'] } });
  },

  removeFriend: async (friend) => {
    // ...
    const updatedUser = await User.update({ $delete: { friends: friend } });
    updatedUser.friends.has(friend); // false
    return updatedUser;
  },
};
```

#### Expression Parsing

DDB Thing is built on a utility that parses DynamoDB Expressions from mongo-like argument structures.
For those who do not wish to use the wrapper's added utility, the underlying parser can be accessed directly.

**UpdateExpression** and **ProjectionExpression** are special cases; the former will return an appropriately
formatted UpdateExpression string, while the latter requires an array of strings and will return an appropriately
formatted ProjectionExpression string.

Any other key will return a string formatted as a **ConditionExpression**.

```js
import parse from 'ddb-thing/parser';

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
```js
{
  KeyCondtionExpression: '#1 = :1 AND #2 BETWEEN :2 AND :3',
  UpdateExpression: 'SET #3 = :4, #4 = :5 DELETE #5 :6',
  ProjectionExpression: '#3, #4',
  MySpecialExpression: '#6 = :7 OR #7 = :8',
  ExpressionAttributesNames: {
    '#1': 'hash',
    '#2': 'range',
    '#3': 'size',
    '#4': 'inStock',
    '#5': 'colors',
    '#6': 'service',
    '#7': 'price',
  },
  ExpressionAttributeValues: {
    ':1': 'ABC',
    ':2': 50,
    ':3': 100,
    ':4': 'big',
    ':5': true,
    ':6': 'blue',
    ':7': 'fast',
    ':8': 'cheap',
  },
}
```

resultTwo.ExpressionAttributeValues:
```js
{
  ':1': { S: 'ABC' },
  ':2': { N: 50 },
  ':3': { N: 100 },
  ':4': { S: 'big' },
  ':5': { BOOL: true },
  ':6': { S: 'blue' },
  ':7': { S: 'fast' },
  ':8': { S: 'cheap' },
}
```

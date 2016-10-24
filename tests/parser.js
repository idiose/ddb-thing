import { describe, it } from 'mocha';
import { expect } from 'chai';

import parseExpression from '../lib/parser';

describe('parseExpression', () => {
  it('parses input queries into named DynamoDB Expressions with AttributeNames and AttributeValues', () => {
    expect(parseExpression({
      Expression: { '$size:name': { $gte: 20 } },
    })).to.deep.equal({
      Expression: 'size(#1) >= :1',
      ExpressionAttributeNames: { '#1': 'name' },
      ExpressionAttributeValues: { ':1': 20 },
    });

    expect(parseExpression({
      Expression: { 'user.accomplishments.count': { $lt: '$size:ego' } },
    })).to.deep.equal({
      Expression: '#1.#2.#3 < size(#4)',
      ExpressionAttributeNames: { '#1': 'user', '#2': 'accomplishments', '#3': 'count', '#4': 'ego' },
      ExpressionAttributeValues: {},
    });

    expect(parseExpression({
      Expression: { $and: [
        { 'head.location': { $in: ['clouds', 'sand'] } },
        { $or: [{ ambition: { $exists: true } }, { experience: { $contains: 'years' } }] },
      ] },
    })).to.deep.equal({
      Expression: '#1.#2 IN (:1, :2) AND ( attribute_exists(#3) OR contains(#4, :3) )',
      ExpressionAttributeNames: { '#1': 'head', '#2': 'location', '#3': 'ambition', '#4': 'experience' },
      ExpressionAttributeValues: { ':1': 'clouds', ':2': 'sand', ':3': 'years' },
    });

    expect(parseExpression({
      Expression: { human: true, employed: { $eq: true }, job: { $ne: 'programmer' } },
    })).to.deep.equal({
      Expression: '#1 = :1 AND #2 = :1 AND #3 <> :2',
      ExpressionAttributeNames: { '#1': 'human', '#2': 'employed', '#3': 'job' },
      ExpressionAttributeValues: { ':1': true, ':2': 'programmer' },
    });

    expect(parseExpression({
      Expression: { age: { $not: { $between: [20, 30] } }, nationality: { $nin: ['USA', 'UK', 'Switzerland'] } },
    })).to.deep.equal({
      Expression: 'NOT #1 BETWEEN :1 AND :2 AND NOT #2 IN (:3, :4, :5)',
      ExpressionAttributeNames: { '#1': 'age', '#2': 'nationality' },
      ExpressionAttributeValues: { ':1': 20, ':2': 30, ':3': 'USA', ':4': 'UK', ':5': 'Switzerland' },
    });

    expect(parseExpression({
      Expression: { $nor: [{ age: { $type: 'N' } }, { name: { $beginsWith: 'J' } }] },
    })).to.deep.equal({
      Expression: 'NOT ( attribute_type(#1, :1) OR begins_with(#2, :2) )',
      ExpressionAttributeNames: { '#1': 'age', '#2': 'name' },
      ExpressionAttributeValues: { ':1': 'N', ':2': 'J' },
    });

    expect(parseExpression({
      UpdateExpression: { expired: true }, FilterExpression: { status: 'active' },
    })).to.deep.equal({
      UpdateExpression: '#1 = :1',
      FilterExpression: '#2 = :2',
      ExpressionAttributeNames: { '#1': 'expired', '#2': 'status' },
      ExpressionAttributeValues: { ':1': true, ':2': 'active' },
    });

    expect(parseExpression({
      UpdateExpression: {
        $set: { price: 10, qty: { $inc: 5 }, rating: { $ine: 0 } },
        $add: { locations: 'chicago', products: 'paper bag' },
      },
    })).to.deep.equal({
      UpdateExpression: 'SET #1 = :1, #2 = #2 + :2, #3 = if_not_exists(#3, :3) ADD #4 :4, #5 :5',
      ExpressionAttributeNames: {
        '#1': 'price',
        '#2': 'qty',
        '#3': 'rating',
        '#4': 'locations',
        '#5': 'products',
      },
      ExpressionAttributeValues: { ':1': 10, ':2': 5, ':3': 0, ':4': 'chicago', ':5': 'paper bag' },
    });

    expect(parseExpression({
      UpdateExpression: {
        $set: {
          bucketlist: {
            $append: 'build a house',
            $prepend: 'paint a self-portrait',
          },
        },
        $remove: ['batteries', 'shoes'],
        $delete: { friends: 'tom' },
      },
      ProjectionExpression: ['bucketlist', 'friends'],
      ConditionExpression: { profile: 'mine' },
    })).to.deep.equal({
      UpdateExpression: 'SET #1 = list_append(#1, :1), #1 = list_append(:2, #1) REMOVE #2, #3 DELETE #4 :3',
      ProjectionExpression: '#1, #4',
      ConditionExpression: '#5 = :4',
      ExpressionAttributeNames: {
        '#1': 'bucketlist',
        '#2': 'batteries',
        '#3': 'shoes',
        '#4': 'friends',
        '#5': 'profile',
      },
      ExpressionAttributeValues: {
        ':1': 'build a house',
        ':2': 'paint a self-portrait',
        ':3': 'tom',
        ':4': 'mine',
      },
    });

    expect(parseExpression({
      UpdateExpression: {
        $set: {
          '#name.legal.first': { $eq: 'jack' },
          'accounts.financial.primary': { $inc: -50 },
        },
      },
    })).to.deep.equal({
      UpdateExpression: 'SET #1 = :1, #2.#3.#4 = #2.#3.#4 - :2',
      ExpressionAttributeNames: {
        '#1': 'name.legal.first',
        '#2': 'accounts',
        '#3': 'financial',
        '#4': 'primary',
      },
      ExpressionAttributeValues: { ':1': 'jack', ':2': 50 },
    });
  });
});

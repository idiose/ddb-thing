import { describe, it } from 'mocha';
import { expect } from 'chai';

import parseExpression from '../lib/parser';

const requiresPath = operator => it('throws an error if no path argument is provided', () => {
  expect(() => parseExpression({
    Expression: { [`$${operator}`]: 'value' },
  })).to.throw(`$${operator} requires an attribute path`);
});

const requiresArray = operator => it('throws an error if value is not an array', () => {
  expect(() => parseExpression({
    Expression: { path: { [`$${operator}`]: 'not array' } },
  })).to.throw(`$${operator} requires argument type Array`);
});

describe('operators', () => {
  const comparators = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
  for (const [operator, comparator] of Object.entries(comparators)) {
    describe(`.${operator}`, () => {
      it(`joins path and value arguments with "${comparator}"`, () => {
        expect(parseExpression({
          Expression: { path: { [`$${operator}`]: 'value' } },
        })).to.deep.equal({
          Expression: `#1 ${comparator} :1`,
          ExpressionAttributeNames: { '#1': 'path' },
          ExpressionAttributeValues: { ':1': 'value' },
        });
      });
      requiresPath(operator);
    });
  }

  describe('.between', () => {
    it('returns a BETWEEN comparator', () => {
      expect(parseExpression({
        Expression: { path: { $between: [5, 15] } },
      })).to.deep.equal({
        Expression: '#1 BETWEEN :1 AND :2',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 5, ':2': 15 },
      });
    });
    requiresPath('between');
    requiresArray('between');
  });

  describe('.in', () => {
    it('returns an IN comparator', () => {
      expect(parseExpression({
        Expression: { path: { $in: ['here', 'there'] } },
      })).to.deep.equal({
        Expression: '#1 IN (:1, :2)',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'here', ':2': 'there' },
      });
    });
    requiresPath('in');
    requiresArray('in');
  });

  describe('.nin', () => {
    it('returns an NOT IN comparator', () => {
      expect(parseExpression({
        Expression: { path: { $nin: ['here', 'there'] } },
      })).to.deep.equal({
        Expression: 'NOT #1 IN (:1, :2)',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'here', ':2': 'there' },
      });
    });
    requiresPath('nin');
    requiresArray('nin');
  });

  describe('.exists', () => {
    it('returns an exists function when value argument is true', () => {
      expect(parseExpression({
        Expression: { path: { $exists: true } },
      })).to.deep.equal({
        Expression: 'attribute_exists(#1)',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: {},
      });
    });
    it('returns a not_exists function when value argument is false', () => {
      expect(parseExpression({
        Expression: { path: { $exists: false } },
      })).to.deep.equal({
        Expression: 'attribute_not_exists(#1)',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: {},
      });
    });
    it('throws an error if value is not a boolean', () => {
      expect(() => parseExpression({
        Expression: { path: { $exists: 'true' } },
      })).to.throw('$exists requires argument type Boolean');
    });
    requiresPath('exists');
  });

  const functionals = {
    type: 'attribute_type',
    beginsWith: 'begins_with',
    contains: 'contains',
    append: 'list_append',
    ine: 'if_not_exists',
  };
  for (const [operator, method] of Object.entries(functionals)) {
    describe(`.${operator}`, () => {
      it(`places path and value into "${method}" method`, () => {
        expect(parseExpression({
          Expression: { path: { [`$${operator}`]: 'value' } },
        })).to.deep.equal({
          Expression: `${method}(#1, :1)`,
          ExpressionAttributeNames: { '#1': 'path' },
          ExpressionAttributeValues: { ':1': 'value' },
        });
      });
      requiresPath(operator);
    });
  }

  describe('.prepend', () => {
    it('places value and path into "append" method', () => {
      expect(parseExpression({
        Expression: { path: { $prepend: 'value' } },
      })).to.deep.equal({
        Expression: 'list_append(:1, #1)',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'value' },
      });
    });
    requiresPath('prepend');
  });

  describe('.size', () => {
    it('returns size method', () => {
      expect(parseExpression({
        Expression: { '$size:path': 'big' },
      })).to.deep.equal({
        Expression: 'size(#1) = :1',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'big' },
      });
      expect(parseExpression({
        Expression: { path: '$size:otherPath' },
      })).to.deep.equal({
        Expression: '#1 = size(#2)',
        ExpressionAttributeNames: { '#1': 'path', '#2': 'otherPath' },
        ExpressionAttributeValues: {},
      });
    });
    it('throws an error when passed an invalid size operator', () => {
      expect(() => parseExpression({
        Expression: { 'thing:$size': 'value' },
      })).to.throw('invalid use of $size operator \'thing:$size\'');
      expect(() => parseExpression({
        Expression: { '$size:$size.thing': 'value' },
      })).to.throw('invalid use of $size operator \'$size:$size.thing\'');
    });
  });

  const logicals = { or: 'OR', and: 'AND' };
  for (const [operator, joinder] of Object.entries(logicals)) {
    describe(`.${operator}`, () => {
      it(`joins values with ${joinder}`, () => {
        expect(parseExpression({
          Expression: { [`$${operator}`]: ['one', 'two'] },
        })).to.deep.equal({
          Expression: `:1 ${joinder} :2`,
          ExpressionAttributeNames: {},
          ExpressionAttributeValues: { ':1': 'one', ':2': 'two' },
        });
      });
      it('parenthesizes response when path provided', () => {
        expect(parseExpression({
          Expression: { path: { [`$${operator}`]: ['one', 'two'] } },
        })).to.deep.equal({
          Expression: `( :1 ${joinder} :2 )`,
          ExpressionAttributeNames: { '#1': 'path' },
          ExpressionAttributeValues: { ':1': 'one', ':2': 'two' },
        });
      });
      requiresArray(operator);
    });
  }

  describe('.not', () => {
    it('negates value with NOT', () => {
      expect(parseExpression({
        Expression: { $not: { path: 'value' } },
      })).to.deep.equal({
        Expression: 'NOT #1 = :1',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'value' },
      });
    });
  });

  describe('.nor', () => {
    it('negates parenthesized values joined with OR', () => {
      expect(parseExpression({
        Expression: { path: { $nor: ['one', 'two'] } },
      })).to.deep.equal({
        Expression: 'NOT ( :1 OR :2 )',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'one', ':2': 'two' },
      });
    });
    requiresArray('nor');
  });

  describe('.inc', () => {
    it('returns a increment expression for positive numbers', () => {
      expect(parseExpression({
        Expression: { path: { $inc: 5 } },
      })).to.deep.equal({
        Expression: '#1 + :1',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 5 },
      });
    });
    it('returns a decrement expression for negative numbers', () => {
      expect(parseExpression({
        Expression: { path: { $inc: -5 } },
      })).to.deep.equal({
        Expression: '#1 - :1',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 5 },
      });
    });
    it('throws an error if input is not a number', () => {
      expect(() => parseExpression({
        Expression: { path: { $inc: '6' } },
      })).to.throw('$inc requires argument type Number');
      expect(() => parseExpression({
        Expression: { path: { $inc: NaN } },
      })).to.throw('$inc requires argument type Number');
    });
    requiresPath('inc');
  });

  describe('.set', () => {
    it('returns a set expression', () => {
      expect(parseExpression({
        Expression: { $set: { path: 'value' } },
      })).to.deep.equal({
        Expression: 'SET #1 = :1',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'value' },
      });
    });
    it('joins multiple sets with commas', () => {
      expect(parseExpression({
        Expression: { $set: { path: 'value', otherPath: 'otherValue' } },
      })).to.deep.equal({
        Expression: 'SET #1 = :1, #2 = :2',
        ExpressionAttributeNames: { '#1': 'path', '#2': 'otherPath' },
        ExpressionAttributeValues: { ':1': 'value', ':2': 'otherValue' },
      });
    });
    it('continues parsing if value is a non $eq object', () => {
      expect(parseExpression({
        Expression: { $set: { path: { $ine: 'value' } } },
      })).to.deep.equal({
        Expression: 'SET #1 = if_not_exists(#1, :1)',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: { ':1': 'value' },
      });
    });
    it('expects an object arg', () => {
      expect(() => parseExpression({
        Expression: { $set: 'uh oh' },
      })).to.throw('$set requires argument type Object');
    });
  });

  describe('.remove', () => {
    it('returns a remove expression', () => {
      expect(parseExpression({
        Expression: { $remove: 'path' },
      })).to.deep.equal({
        Expression: 'REMOVE #1',
        ExpressionAttributeNames: { '#1': 'path' },
        ExpressionAttributeValues: {},
      });
    });
    it('joins multiple paths with commas', () => {
      expect(parseExpression({
        Expression: { $remove: ['path', 'otherPath'] },
      })).to.deep.equal({
        Expression: 'REMOVE #1, #2',
        ExpressionAttributeNames: { '#1': 'path', '#2': 'otherPath' },
        ExpressionAttributeValues: {},
      });
    });
    it('throws an error if arg is not string or array of strings', () => {
      const expected = '$remove requires a path or a list of paths';
      expect(() => parseExpression({
        Expression: { $remove: 5 },
      })).to.throw(expected);
      expect(() => parseExpression({
        Expression: { $remove: [5] },
      })).to.throw(expected);
    });
  });

  const updaters = ['add', 'delete'];
  for (const operator of updaters) {
    describe(`.${operator}`, () => {
      it(`returns a ${operator} expression`, () => {
        expect(parseExpression({
          Expression: { [`$${operator}`]: { path: 'value' } },
        })).to.deep.equal({
          Expression: `${operator.toUpperCase()} #1 :1`,
          ExpressionAttributeNames: { '#1': 'path' },
          ExpressionAttributeValues: { ':1': 'value' },
        });
      });
      it('joins multiple paths with commas', () => {
        expect(parseExpression({
          Expression: { [`$${operator}`]: { path: 'value', otherPath: 'otherValue' } },
        })).to.deep.equal({
          Expression: `${operator.toUpperCase()} #1 :1, #2 :2`,
          ExpressionAttributeNames: { '#1': 'path', '#2': 'otherPath' },
          ExpressionAttributeValues: { ':1': 'value', ':2': 'otherValue' },
        });
      });
      it('throws an error if arg is not an object', () => {
        expect(() => parseExpression({
          Expression: { [`$${operator}`]: 5 },
        })).to.throw(`${operator} requires argument type Object`);
      });
    });
  }
});

describe('parser', () => {
  it('returns an expression for each provided input along with names and values', () => {
    expect(parseExpression({
      First: { thing: 'value' },
      Second: { thing: { $ne: 'value' } },
      Third: { thing: { $contains: 'value' } },
    })).to.deep.equal({
      First: '#1 = :1',
      Second: '#1 <> :1',
      Third: 'contains(#1, :1)',
      ExpressionAttributeNames: { '#1': 'thing' },
      ExpressionAttributeValues: { ':1': 'value' },
    });
  });

  it('joins conditions with AND by default', () => {
    expect(parseExpression({
      Condition: { thing: 'value', otherThing: 'otherValue' },
    })).to.deep.equal({
      Condition: '#1 = :1 AND #2 = :2',
      ExpressionAttributeNames: { '#1': 'thing', '#2': 'otherThing' },
      ExpressionAttributeValues: { ':1': 'value', ':2': 'otherValue' },
    });
  });

  it('joins update expressions with spaces instead', () => {
    expect(parseExpression({
      UpdateExpression: { thing: 'value', otherThing: 'otherValue' },
    })).to.deep.equal({
      UpdateExpression: '#1 = :1 #2 = :2',
      ExpressionAttributeNames: { '#1': 'thing', '#2': 'otherThing' },
      ExpressionAttributeValues: { ':1': 'value', ':2': 'otherValue' },
    });
  });

  it('rejects projection expressions that aren\'t paths', () => {
    expect(() => parseExpression({
      ProjectionExpression: 'wrong path',
    })).to.throw('projection expression expects array');
    expect(() => parseExpression({
      ProjectionExpression: [1, 2, 3],
    })).to.throw('projection values must be strings');
  });

  it('joins projection paths with commas', () => {
    expect(parseExpression({
      ProjectionExpression: ['pathOne', 'pathTwo', 'nested.path'],
    })).to.deep.equal({
      ProjectionExpression: '#1, #2, #3.#4',
      ExpressionAttributeNames: { '#1': 'pathOne', '#2': 'pathTwo', '#3': 'nested', '#4': 'path' },
      ExpressionAttributeValues: {},
    });
  });

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

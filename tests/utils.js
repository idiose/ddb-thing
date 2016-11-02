import { describe, it } from 'mocha';
import { expect } from 'chai';

import {
  withoutKeys,
  validateCustomError,
  thingError,
  applyDefaults,
  ensureRequired,
  validateInput,
  applySetters,
  applyGetters,
  convertValues,
  restoreItem,
} from '../lib/utils';

const itemToConvert = {
  name: { legal: { first: 'jack', last: 'smith' }, street: 'crazy j' },
  possessions: ['one', 2, true, 'blue'],
  favoriteNumbers: new Set([54, 83, 92]),
  info: { head: { eyes: 2 }, tall: true, fingers: 10 },
};

const itemToRestore = {
  name: {
    M: {
      legal: {
        M: { first: { S: 'jack' }, last: { S: 'smith' } },
      },
      street: { S: 'crazy j' },
    },
  },
  possessions: { L: [{ S: 'one' }, { N: '2' }, { BOOL: true }, { S: 'blue' }] },
  favoriteNumbers: { NS: ['54', '83', '92'] },
  info: {
    M: {
      head: {
        M: {
          eyes: { N: '2' },
        },
      },
      tall: { BOOL: true },
      fingers: { N: '10' },
    },
  },
};

describe('utils', () => {
  describe('.withoutKeys', () => {
    it('returns a new object from source object without specified keys', () => {
      expect(withoutKeys({ a: 1, b: 2, c: 3, d: 2 }, 'b', 'd')).to.deep.equal({ a: 1, c: 3 });
    });
  });

  describe('.validateCustomError', () => {
    it('throws an error when provided custom error is not a function, string, or undefined', () => {
      expect(validateCustomError('path', undefined)).to.equal(undefined);
      expect(validateCustomError('path', 'error')).to.equal(undefined);
      expect(validateCustomError('path', () => {})).to.equal(undefined);
      const expected = 'invalid custom error (at \'path\')';
      expect(() => validateCustomError('path', true)).to.throw(expected);
      expect(() => validateCustomError('path', 1)).to.throw(expected);
      expect(() => validateCustomError('path', {})).to.throw(expected);
      expect(() => validateCustomError('path', null)).to.throw(expected);
    });
  });

  describe('.thingError', () => {
    it('throws an error if error argument is not a string for function', () => {
      const expected = 'expected error string or function';
      expect(() => thingError(true)).to.throw(expected);
      expect(() => thingError(null)).to.throw(expected);
      expect(() => thingError(5)).to.throw(expected);
      expect(() => thingError({})).to.throw(expected);
    });

    it('returns an error instance with message set to provided error string', () => {
      const result = thingError('error message');
      expect(result).to.be.instanceof(Error);
      expect(result.message).to.equal('error message');
    });

    it('returns an error instance with message set to the string result of the provided error function', () => {
      const result = thingError(() => 'error from function');
      expect(result).to.be.instanceof(Error);
      expect(result.message).to.equal('error from function');
    });

    it('passes additonal arguments to provided error function when applicable', () => {
      const func = (name, location) => `can't find ${name} @ ${location}`;
      const result = thingError(func, 'bill', 'new york');
      expect(result).to.be.instanceof(Error);
      expect(result.message).to.equal('can\'t find bill @ new york');
    });

    it('returns a generic error if provided function does not produce a string', () => {
      const resultOne = thingError(() => true);
      expect(resultOne).to.be.instanceof(Error);
      expect(resultOne.message).to.equal('error ()');
      const resultTwo = thingError(() => 50, 'jack', 'jill');
      expect(resultTwo).to.be.instanceof(Error);
      expect(resultTwo.message).to.equal('error (jack - jill)');
    });
  });

  describe('.applyDefaults', () => {
    const attributes = {
      name: {
        first: { type: 'String', default: 'John' },
        last: { type: 'String', default: 'Smith' },
      },
      email: { type: 'String', default: 'sample@gmail.com' },
      status: { type: 'String' },
    };

    it('assigns defaults to provided input', () => {
      expect(applyDefaults({}, attributes)).to.deep.equal({
        name: { first: 'John', last: 'Smith' },
        email: 'sample@gmail.com',
      });
    });

    it('does not overwrite existing values', () => {
      expect(applyDefaults({
        name: { first: 'Paul' }, email: 'easypeazy@money.com',
      }, attributes)).to.deep.equal({
        name: { first: 'Paul', last: 'Smith' },
        email: 'easypeazy@money.com',
      });
    });
  });

  describe('.ensureRequired', () => {
    const attributes = {
      name: {
        first: { type: 'String', required: true },
        last: { type: 'String', required: true },
      },
      email: { type: 'String', required: true },
      status: { type: 'String' },
    };

    it('throws an error when a required field is missing', () => {
      expect(() => ensureRequired({
        name: { first: 'John' },
        email: 'abc',
      }, attributes)).to.throw('attribute \'name.last\' is required');
    });

    it('allows non-required fields to be missing', () => {
      expect(ensureRequired({
        name: { first: 'jack', last: 'dandy' }, email: 'abc',
      }, attributes)).to.equal(undefined);
    });
  });

  describe('.validateInput', () => {
    const isString = (val) => {
      if (typeof val !== 'string') throw new Error('invalid');
    };
    const attributes = {
      name: {
        first: { type: 'String', validators: [isString] },
        last: { type: 'String', validators: [isString] },
      },
      email: { type: 'String', validators: [isString] },
      'pseudo.nested': { type: 'String', validators: [isString] },
    };

    it('runs each attributes provided validators', async () => {
      const first = await validateInput({
        name: { first: 'jack', last: 'dandy' },
        email: 'abc',
        'pseudo.nested': 'abc',
      }, attributes);
      expect(first).to.equal(undefined);

      const second = await validateInput({
        'name.first': 'jack', 'name.last': 'dandy', email: 'abc', '#pseudo.nested': 'abc',
      }, attributes);
      expect(second).to.equal(undefined);

      try {
        await validateInput({ name: { first: 5 } }, attributes);
      } catch (error) {
        expect(error.message).to.equal('invalid');
      }

      try {
        await validateInput({ '#pseudo.nested': 5 }, attributes);
      } catch (error) {
        expect(error.message).to.equal('invalid');
      }
    });

    it('throws a type error when expecting a nested value', async () => {
      try {
        await validateInput({ name: 'jack' }, attributes);
      } catch (error) {
        expect(error.message).to.equal('expected type \'Map\' (at \'name\')');
      }
    });

    it('throws an unrecognized error when encoutering an unrecognized attribute path', async () => {
      try {
        await validateInput({ non: { existent: { path: 'lol' } } }, attributes);
      } catch (error) {
        expect(error.message).to.equal('unrecognized attribute \'non\'');
      }

      try {
        await validateInput({ 'non.existent.path': 'lol' }, attributes);
      } catch (error) {
        expect(error.message).to.equal('unrecognized attribute \'non.existent.path\'');
      }
    });
  });

  describe('.applySetters', () => {
    const uppercase = val => val.toUpperCase();
    const attributes = {
      name: {
        first: { type: 'String', setters: [uppercase] },
        last: { type: 'String', setters: [uppercase] },
      },
      email: { type: 'String', setters: [] },
      'pseudo.nested': { type: 'String', setters: [uppercase] },
    };

    it('runs each attributes provided setters', () => {
      expect(applySetters({
        name: { first: 'jack', last: 'smith' },
        email: 'abc',
        'pseudo.nested': 'plop',
      }, attributes)).to.deep.equal({
        name: { first: 'JACK', last: 'SMITH' },
        email: 'abc',
        'pseudo.nested': 'PLOP',
      });

      expect(applySetters({
        'name.first': 'jack', 'name.last': 'smith', email: 'abc', '#pseudo.nested': 'plop',
      }, attributes)).to.deep.equal({
        'name.first': 'JACK',
        'name.last': 'SMITH',
        email: 'abc',
        '#pseudo.nested': 'PLOP',
      });
    });
  });

  describe('.applyGetters', () => {
    const uppercase = val => val.toUpperCase();
    const attributes = {
      name: {
        first: { type: 'String', getters: [uppercase] },
        last: { type: 'String', getters: [uppercase] },
      },
      email: { type: 'String', getters: [] },
      'pseudo.nested': { type: 'String', getters: [uppercase] },
    };

    it('runs each attributes provided getters', () => {
      expect(applyGetters({
        name: { first: 'jack', last: 'smith' },
        email: 'abc',
        'pseudo.nested': 'plop',
      }, attributes)).to.deep.equal({
        name: { first: 'JACK', last: 'SMITH' },
        email: 'abc',
        'pseudo.nested': 'PLOP',
      });
    });
  });

  describe('.convertValues', () => {
    it('converts objects into DynamoDB AttributeValue', () => {
      expect(convertValues(itemToConvert)).to.deep.equal(itemToRestore);
    });

    it('turns arrays into sets when attribute type is Set', () => {
      expect(convertValues({
        list: ['one', 'two', 'three'],
        notList: ['one', 'two', 'three'],
      }, { notList: { type: 'Set' } })).to.deep.equal({
        list: { L: [{ S: 'one' }, { S: 'two' }, { S: 'three' }] },
        notList: { SS: ['one', 'two', 'three'] },
      });
    });
  });

  describe('.restoreItem', () => {
    it('converts DynamoDB AttributeValue back into item', () => {
      expect(restoreItem(itemToRestore)).to.deep.equal(itemToConvert);
    });
  });
});

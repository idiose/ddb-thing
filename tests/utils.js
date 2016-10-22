import { describe, it } from 'mocha';
import { expect } from 'chai';

import { isThingType, withoutKeys, validateCustomError, thingError } from '../lib/utils';

describe('utils', () => {
  describe('.isThingType', () => {
    it('determines whether or not input is the given ddb-thing type', () => {
      expect(isThingType('String', '')).to.equal(true);
      expect(isThingType('Number', '')).to.equal(false);
      expect(isThingType('List', [])).to.equal(true);
      expect(isThingType('Map', [])).to.equal(false);
      expect(isThingType('Binary', new Buffer(''))).to.equal(true);
      expect(isThingType('Binary', new Uint32Array(''))).to.equal(true);
      expect(isThingType('Binary', '')).to.equal(false);
    });
    it('throws an error when type is unrecognized', () => {
      expect(() => isThingType('nonType', '')).to.throw('unrecognized type \'nonType\'');
    });
  });

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
});

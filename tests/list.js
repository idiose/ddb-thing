import { describe, it } from 'mocha';
import { expect } from 'chai';

import List from '../lib/attribute-list';

describe('List', () => {
  describe('.prototype.constructor', () => {
    it('accepts optional key prefix and prefixes outgoing keys', () => {
      const prefix = '$';
      const expectedKey = `${prefix}1`;
      const value = 'test value';
      const list = new List({ prefix });
      const key = list.add(value);
      expect(key).to.equal(expectedKey);
      expect(list.map).to.deep.equal({ [expectedKey]: value });
    });
  });

  describe('.prototype.add()', () => {
    it('inserts a new value and returns its key', () => {
      const value = 'new value';
      const list = new List();
      expect(list.map).to.deep.equal({});
      const key = list.add('new value');
      expect(key).to.equal('1');
      expect(list.map).to.deep.equal({ 1: value });
    });

    it('returns the key of an existing value without reinserting it', () => {
      const value = 'duplicate value';
      const list = new List();
      list.add(value);
      expect(list.map).to.deep.equal({ 1: value });
      const key = list.add(value);
      expect(key).to.equal('1');
      expect(list.map).to.deep.equal({ 1: value });
    });
  });

  describe('.prototype.map', () => {
    it('returns an object of key-value pairs', () => {
      const list = new List();
      list.add('test value 1');
      list.add('test value 2');
      list.add('test value 3');
      expect(list.map).to.deep.equal({
        1: 'test value 1',
        2: 'test value 2',
        3: 'test value 3',
      });
    });
  });
});

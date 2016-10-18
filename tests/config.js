import { describe, it } from 'mocha';
import { expect } from 'chai';

import { errors, default as config } from '../lib/config';

describe('config', () => {
  describe('.tableRoot', () => {
    it('can be reassigned to a new string value', () => {
      const newRoot = 'new root';
      expect(config.tableRoot).to.equal('');
      config.tableRoot = newRoot;
      expect(config.tableRoot).to.equal(newRoot);
    });
    it('refuses non-string reassignment', () => {
      expect(() => (config.tableRoot = {})).to.throw('tableRoot must be a string');
    });
  });

  describe('.errors.*', () => {
    it('can be reassigned to a new string value', () => {
      const newTypeError = 'new error';
      errors.type = newTypeError;
      expect(errors.type).to.equal(newTypeError);
    });
    it('refuses non-string reassignment', () => {
      expect(() => (errors.type = true)).to.throw('errors are required to be strings');
    });
  });
});

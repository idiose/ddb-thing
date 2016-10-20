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
    it('can be reassigned to a new string or function value', () => {
      const newTypeErrorString = 'new error';
      errors.type = newTypeErrorString;
      expect(errors.type).to.equal(newTypeErrorString);
      const newTypeErrorFunction = () => 'error message from function';
      errors.type = newTypeErrorFunction;
      expect(errors.type).to.equal(newTypeErrorFunction);
    });
    it('refuses non-string|non-function reassignment', () => {
      const expectedError = 'errors must either be a string or a function that returns a string';
      expect(() => (errors.type = true)).to.throw(expectedError);
      expect(() => (errors.type = 50)).to.throw(expectedError);
    });
    it('refuses functions that do not return a string value', () => {
      const expectedError = 'error functions must return a string';
      expect(() => (errors.type = () => true)).to.throw(expectedError);
      expect(() => (errors.type = () => 50)).to.throw(expectedError);
    });
  });
});

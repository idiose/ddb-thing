import { describe, it } from 'mocha';
import { expect } from 'chai';

import { errors, options } from '../lib/config';

describe('config', () => {
  describe('.options', () => {
    const strings = ['tableRoot', 'operatorPrefix', 'attributePrefix'];
    for (const option of strings) {
      describe(`.${option}`, () => {
        it('can be reassigned to a new string', () => {
          const oldVal = options[option];
          const newVal = 'new value';
          options[option] = newVal;
          expect(options[option]).to.equal(newVal);
          options[option] = oldVal;
        });

        it('refuses non-string reassignment', () => {
          expect(() => { options[option] = 5; }).to.throw('expected a string value');
          expect(() => { options[option] = undefined; }).to.throw('expected a string value');
          expect(() => { options[option] = true; }).to.throw('expected a string value');
        });
      });
    }

    const booleans = ['response', 'defaults', 'required', 'validate', 'setters', 'getters'];
    for (const option of booleans) {
      describe(`.${option}`, () => {
        it('can be reassigned to a new boolean', () => {
          const current = options[option];
          options[option] = !current;
          expect(options[option]).to.equal(!current);
          options[option] = current;
        });

        it('refuses non-boolean reassignment', () => {
          expect(() => { options[option] = 5; }).to.throw('expected a boolean value');
          expect(() => { options[option] = undefined; }).to.throw('expected a boolean value');
          expect(() => { options[option] = 'true'; }).to.throw('expected a boolean value');
        });
      });
    }

    describe('.responseHandler', () => {
      it('can be reassigned to a new function', () => {
        const newHandler = () => {};
        options.responseHandler = newHandler;
        expect(options.responseHandler).to.equal(newHandler);
      });

      it('refuses non-function reassignment', () => {
        expect(() => { options.responseHandler = true; }).to.throw('expected a function');
        expect(() => { options.responseHandler = 'hello'; }).to.throw('expected a function');
      });
    });

    describe('.timestamps', () => {
      it('cannot be reassigned', () => {
        expect(() => (options.timestamps = 'new value')).to.throw('Cannot assign to read only property \'timestamps\' of [object Object]');
      });

      for (const option of ['created', 'modified']) {
        describe(`.${option}`, () => {
          it('can be reassigned to a new string', () => {
            const oldVal = options.timestamps[option];
            const newVal = 'new value';
            options.timestamps[option] = newVal;
            expect(options.timestamps[option]).to.equal(newVal);
            options.timestamps[option] = oldVal;
          });

          it('refuses non-string reassignment', () => {
            expect(() => { options.timestamps[option] = 5; }).to.throw('expected a string value');
            expect(() => { options.timestamps[option] = undefined; }).to.throw('expected a string value');
            expect(() => { options.timestamps[option] = true; }).to.throw('expected a string value');
          });
        });
      }
    });
  });

  describe('.errors.*', () => {
    it('can be reassigned to a new string or function value', () => {
      const defaultVal = errors.type;
      const newTypeErrorString = 'new error';
      errors.type = newTypeErrorString;
      expect(errors.type).to.equal(newTypeErrorString);
      const newTypeErrorFunction = () => 'error message from function';
      errors.type = newTypeErrorFunction;
      expect(errors.type).to.equal(newTypeErrorFunction);
      errors.type = defaultVal;
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

import { describe, it } from 'mocha';
import { expect } from 'chai';

import types from '../lib/types';

describe('types', () => {
  describe('.*all', () => {
    describe('.validators', () => {
      describe('.validate', () => {
        const validate = types.String.validators.validate;
        it('throws an error if any input is not a function', () => {
          const expected = 'option \'validate\' expects a function or list of functions (at \'path\')';
          expect(() => validate('path', 'type', [() => {}, 2, () => {}])).to.throw(expected);
          expect(() => validate('path', 'type', [() => {}, '', () => {}])).to.throw(expected);
        });
        it('returns provided array of functions', () => {
          const methods = [function checkTires() {}, function checkOil() {}];
          expect(validate('path', 'type', methods)).to.eql(methods);
        });
      });
    });

    describe('.setters', () => {
      describe('.set', () => {
        const set = types.String.setters.set;
        it('throws an error if any input is not a function', () => {
          const expected = 'option \'set\' expects a function or list of functions (at \'path\')';
          expect(() => set('path', 'type', [2, () => {}])).to.throw(expected);
          expect(() => set('path', 'type', ['', () => {}])).to.throw(expected);
        });
        it('throws an error if any input methods do not return expected type', () => {
          expect(() => set('path', 'String', [() => 51]))
          .to.throw('option \'set\' expects function(s) that always return type \'String\' (at \'path\')');
        });
        it('returns provided array of functions', () => {
          const methods = [function setTires() { return ''; }, function fillOil() { return ''; }];
          expect(set('path', 'String', methods)).to.eql(methods);
        });
      });
    });

    describe('.getters', () => {
      describe('.get', () => {
        const get = types.String.getters.get;
        it('throws an error if any input is not a function', () => {
          const expected = 'option \'get\' expects a function or list of functions (at \'path\')';
          expect(() => get('path', 'type', [() => {}, 2, () => {}])).to.throw(expected);
          expect(() => get('path', 'type', [() => {}, '', () => {}])).to.throw(expected);
        });
        it('returns provided array of functions', () => {
          const methods = [function tintWindows() {}, function kickTire() {}];
          expect(get('path', 'type', methods)).to.eql(methods);
        });
      });
    });
  });

  describe('.String & .Number', () => {
    describe('.validators', () => {
      describe('.enum', () => {
        const string = types.String;
        const expected = 'option \'enum\' expects an array of enumerable values of type \'String\' (at \'path\')';
        it('throws an error when input is not an array', () => {
          expect(() => string.validators.enum('path', 'String', 'string')).to.throw(expected);
          expect(() => string.validators.enum('path', 'String', [true])).to.throw(expected);
        });
        it('throws an error when provided values do not match type', () => {
          expect(() => string.validators.enum('path', 'String', [[5, 7]])).to.throw(expected);
        });
        it('returns a validator that will compare value to enum values', () => {
          const result = string.validators.enum('path', 'String', [['red', 'blue']]);
          expect(result('red')).to.equal(undefined);
          expect(() => result('pink')).to.throw('expected value \'pink\' to be in (red, blue) (at \'path\')');
        });
        it('passes custom error strings/methods onward', () => {
          const stringError = 'not a size';
          const resultOne = string.validators.enum('path', 'String', [['big', 'small'], stringError]);
          expect(() => resultOne('huge')).to.throw(stringError);
          const functionError = (path, type, value) => `${value} is unrecognized`;
          const resultTwo = string.validators.enum('path', 'String', [['big', 'small'], functionError]);
          expect(() => resultTwo('enourmous')).to.throw('enourmous is unrecognized');
        });
      });
    });
  });

  describe('.String', () => {
    const string = types.String;
    describe('.options', () => {
      it('includes all string options', () => {
        expect(string.options).to.eql(
          ['required', 'default', 'match', 'minlength', 'maxlength', 'enum', 'validate', 'lowercase', 'uppercase', 'trim', 'set', 'get']
        );
      });
    });
    describe('.validators', () => {
      it('includes all string validators', () => {
        expect(Object.keys(string.validators)).to.eql(['match', 'minlength', 'maxlength', 'enum', 'validate']);
      });
      describe('.match', () => {
        it('throws an error when input is not a regexp', () => {
          const expected = 'option \'match\' expects a regular expression (at \'path\')';
          expect(() => string.validators.match('path', 'type', 'string')).to.throw(expected);
          expect(() => string.validators.match('path', 'type', [true])).to.throw(expected);
        });
        it('returns a validator that will match input against regexp', () => {
          const result = string.validators.match('path', 'type', [/^[^0-9]+$/]);
          expect(result('howdy')).to.equal(undefined);
          expect(() => result('57 things')).to.throw('expected value \'57 things\' to match /^[^0-9]+$/ (at \'path\')');
        });
        it('passes custom error strings/methods onward', () => {
          const stringError = 'i don\'t like that letter';
          const resultOne = string.validators.match('path', 'type', [/^[^a-z]$/, stringError]);
          expect(() => resultOne('g')).to.throw(stringError);
          const functionError = (path, type, value) => `${value} is a bad choice`;
          const resultTwo = string.validators.match('path', 'type', [/^[a-z]$/, functionError]);
          expect(() => resultTwo('A')).to.throw('A is a bad choice');
        });
      });

      describe('.minlength', () => {
        it('throws an error when input is not a number', () => {
          const expected = 'option \'minlength\' expects a number (at \'path\')';
          expect(() => string.validators.minlength('path', 'type', 'string')).to.throw(expected);
          expect(() => string.validators.minlength('path', 'type', [true])).to.throw(expected);
        });
        it('returns a validator that will compare value length to minlength', () => {
          const result = string.validators.minlength('path', 'type', [3]);
          expect(result('howdy')).to.equal(undefined);
          expect(() => result('hi')).to.throw('expected value \'hi\' to be at least 3 characters in length (at \'path\')');
        });
        it('passes custom error strings/methods onward', () => {
          const stringError = 'too small';
          const resultOne = string.validators.minlength('path', 'type', [5, stringError]);
          expect(() => resultOne('g')).to.throw(stringError);
          const functionError = (path, type, value) => `${value} is too short`;
          const resultTwo = string.validators.minlength('path', 'type', [5, functionError]);
          expect(() => resultTwo('A')).to.throw('A is too short');
        });
      });

      describe('.maxlength', () => {
        it('throws an error when input is not a number', () => {
          const expected = 'option \'maxlength\' expects a number (at \'path\')';
          expect(() => string.validators.maxlength('path', 'type', 'string')).to.throw(expected);
          expect(() => string.validators.maxlength('path', 'type', [true])).to.throw(expected);
        });
        it('returns a validator that will compare value length to maxlength', () => {
          const result = string.validators.maxlength('path', 'type', [4]);
          expect(result('hi')).to.equal(undefined);
          expect(() => result('howdy')).to.throw('expected value \'howdy\' to be at most 4 characters in length (at \'path\')');
        });
        it('passes custom error strings/methods onward', () => {
          const stringError = 'too big';
          const resultOne = string.validators.maxlength('path', 'type', [5, stringError]);
          expect(() => resultOne('too long')).to.throw(stringError);
          const functionError = (path, type, value) => `${value} is too long`;
          const resultTwo = string.validators.maxlength('path', 'type', [5, functionError]);
          expect(() => resultTwo('too long')).to.throw('too long is too long');
        });
      });
    });
    describe('.setters', () => {
      it('includes all String setters', () => {
        expect(Object.keys(string.setters)).to.eql(['lowercase', 'uppercase', 'trim', 'set']);
      });
    });
  });

  describe('.Number', () => {
    const number = types.Number;
    describe('.options', () => {
      it('includes all number options', () => {
        expect(number.options).to.eql(
          ['required', 'default', 'min', 'max', 'enum', 'validate', 'set', 'get']
        );
      });
    });

    describe('.validators', () => {
      describe('.min', () => {
        it('throws an error when input is not a number', () => {
          const expected = 'option \'min\' expects a number (at \'path\')';
          expect(() => number.validators.min('path', 'type', 'string')).to.throw(expected);
          expect(() => number.validators.min('path', 'type', [true])).to.throw(expected);
        });
        it('returns a validator that will compare value to min', () => {
          const result = number.validators.min('path', 'type', [3]);
          expect(result(4)).to.equal(undefined);
          expect(() => result(2)).to.throw('expected value \'2\' to be at least 3 (at \'path\')');
        });
        it('passes custom error strings/methods onward', () => {
          const stringError = 'too small';
          const resultOne = number.validators.min('path', 'type', [5, stringError]);
          expect(() => resultOne(3)).to.throw(stringError);
          const functionError = (path, type, value) => `${value} is too small`;
          const resultTwo = number.validators.min('path', 'type', [5, functionError]);
          expect(() => resultTwo(4)).to.throw('4 is too small');
        });
      });

      describe('.max', () => {
        it('throws an error when input is not a number', () => {
          const expected = 'option \'max\' expects a number (at \'path\')';
          expect(() => number.validators.max('path', 'type', 'string')).to.throw(expected);
          expect(() => number.validators.max('path', 'type', [true])).to.throw(expected);
        });
        it('returns a validator that will compare value to max', () => {
          const result = number.validators.max('path', 'type', [3]);
          expect(result(2)).to.equal(undefined);
          expect(() => result(4)).to.throw('expected value \'4\' to be at most 3 (at \'path\')');
        });
        it('passes custom error strings/methods onward', () => {
          const stringError = 'too big';
          const resultOne = number.validators.max('path', 'type', [5, stringError]);
          expect(() => resultOne(6)).to.throw(stringError);
          const functionError = (path, type, value) => `${value} is too big`;
          const resultTwo = number.validators.max('path', 'type', [5, functionError]);
          expect(() => resultTwo(7)).to.throw('7 is too big');
        });
      });
    });
  });
});

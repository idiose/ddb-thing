import { describe, it } from 'mocha';
import { expect } from 'chai';

import operators from '../lib/operators';

const parse = (val) => {
  if (Array.isArray(val)) return val.map(item => `-${item}`);
  if (typeof val === 'object') {
    return Object.entries(val).reduce((string, [key, value]) => `-${key} = ${parse(value)}`, '');
  }
  return `-${val}`;
};
const parseString = val => `-${val}`;
const names = {};

const path = 'path';
const value = 'value';
const pValue = '-value';
const values = ['one', 'two', 'three'];

const requiresPath = operator => it('throws an error if no path argument is provided', () => {
  expect(() => operators[operator](null, value, { parse })).to.throw(`$${operator} requires an attribute path`);
});

const requiresArray = operator => it('throws an error if value is not an array', () => {
  expect(() => operators[operator](path, value, { parse })).to.throw(`$${operator} requires argument type Array`);
});

describe('operators', () => {
  const comparators = { eq: '=', ne: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
  for (const [operator, comparator] of Object.entries(comparators)) {
    describe(`.${operator}`, () => {
      it(`joins path and value arguments with "${comparator}"`, () => {
        expect(operators[operator](path, value, { parse })).to.equal(`${path} ${comparator} ${pValue}`);
      });
      requiresPath(operator);
    });
  }

  const between = 'between';
  describe(`.${between}`, () => {
    it('returns a BETWEEN comparator', () => {
      expect(operators[between](path, values, { parse })).to.equal('path BETWEEN -one AND -two');
    });
    requiresPath(between);
    requiresArray(between);
  });

  const inOp = 'in';
  describe(`.${inOp}`, () => {
    it('returns an IN comparator', () => {
      expect(operators[inOp](path, values, { parse })).to.equal('path IN (-one, -two, -three)');
    });
    requiresPath(inOp);
    requiresArray(inOp);
  });

  const nin = 'nin';
  describe(`.${nin}`, () => {
    it('returns an NOT IN comparator', () => {
      expect(operators[nin](path, values, { parse })).to.equal('NOT path IN (-one, -two, -three)');
    });
    requiresPath(nin);
    requiresArray(nin);
  });

  const exists = 'exists';
  describe(`.${exists}`, () => {
    it('returns an exists function when value argument is true', () => {
      expect(operators[exists](path, true, { parse })).to.equal(`attribute_exists(${path})`);
    });
    it('returns a not_exists function when value argument is false', () => {
      expect(operators[exists](path, false, { parse })).to.equal(`attribute_not_exists(${path})`);
    });
    it('throws an error if value is not a boolean', () => {
      expect(() => operators[exists](path, 'not bool', { parse })).to.throw(`${exists} requires argument type Boolean`);
    });
    requiresPath(exists);
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
        expect(operators[operator](path, value, { parse })).to.equal(`${method}(${path}, -${value})`);
      });
      requiresPath(operator);
    });
  }

  const prepend = 'prepend';
  describe(`.${prepend}`, () => {
    it('places value and path into "append" method', () => {
      expect(operators[prepend](path, value, { parse })).to.equal(`list_append(-${value}, ${path})`);
    });
    requiresPath(prepend);
  });

  const size = 'size';
  describe(`.${size}`, () => {
    const sizeops = {
      parseString,
      names,
    };
    it('returns size method', () => {
      expect(operators[size]('$size:path', sizeops)).to.equal('size(-path)');
    });
    it('throws an error when passed an invalid size operator', () => {
      for (const input of ['$size.thing', 'thing.$size.$size', 'thing.$size.thing']) {
        expect(() => operators[size](input, sizeops).to.throw(`invalid use of $size operator '${input}'`));
      }
    });
  });

  const logicals = { or: 'OR', and: 'AND' };
  for (const [operator, joinder] of Object.entries(logicals)) {
    describe(`.${operator}`, () => {
      it(`joins values with ${joinder}`, () => {
        expect(operators[operator](null, values, { parse })).to.equal(`-one ${joinder} -two ${joinder} -three`);
      });
      it('parenthesizes response when path provided', () => {
        expect(operators[operator](path, values, { parse })).to.equal(`( -one ${joinder} -two ${joinder} -three )`);
      });
      requiresArray(operator);
    });
  }

  const not = 'not';
  describe(`.${not}`, () => {
    it('negates value with NOT', () => {
      expect(operators[not](path, value, { parse })).to.equal(`NOT -${value}`);
    });
  });

  const nor = 'nor';
  describe(`.${nor}`, () => {
    it('negates parenthesized values joined with OR', () => {
      expect(operators[nor](path, values, { parse })).to.equal('NOT ( -one OR -two OR -three )');
    });
    requiresArray(nor);
  });

  const inc = 'inc';
  describe(`.${inc}`, () => {
    it('returns a increment expression for positive numbers', () => {
      expect(operators[inc](path, 5, { parse })).to.equal(`${path} + -5`);
      expect(operators[inc](path, -5, { parse })).to.equal(`${path} - -5`);
    });
    it('throws an error if input is not a number', () => {
      expect(() => operators[inc](path, value, { parse })).to.throw(`${inc} requires argument type Number`);
      expect(() => operators[inc](path, NaN, { parse })).to.throw(`${inc} requires argument type Number`);
    });
  });

  /* TO-DO: better dummy parse?
  const set = 'set';
  describe(`.${set}`, () => {
    const setops = {
      parse,
      parseString,
      names,
    };
    it('returns a set expression', () => {
      expect(operators[set](path, { path: value }, setops)).to.equal(`SET -${path} = -${value}`);
    });
    it('expects an object arg', () => {
      expect(() => operators[set](path, 'string', setops)).to.throw(`${set} requires argument type Object`);
    });
  });
  */

  const remove = 'remove';
  describe(`.${remove}`, () => {
    it('returns a remove expression', () => {
      expect(operators[remove](path, [value], { parseString, names })).to.equal('REMOVE -value');
      expect(operators[remove](path, ['one', 'two'], { parseString, names })).to.equal('REMOVE -one, -two');
    });
    it('throws an error if arg is not string or array of strings', () => {
      const expected = `${remove} requires a path or a list of paths`;
      expect(() => operators[remove](path, 5, { parseString, names })).to.throw(expected);
      expect(() => operators[remove](path, [5], { parseString, names })).to.throw(expected);
    });
  });

  const updaters = ['add', 'delete'];
  for (const operator of updaters) {
    describe(`.${operator}`, () => {
      it(`returns a ${operator} expression`, () => {
        expect(operators[operator](path, { a: 2, b: 3 }, { parse, parseString, names }))
        .to.equal(`${operator.toUpperCase()} -a -2, -b -3`);
      });
      it('throws an error if arg is not an object', () => {
        const expected = `${operator} requires argument type Object`;
        expect(() => operators[operator](path, 5, { parseString, names })).to.throw(expected);
        expect(() => operators[operator](path, [5], { parseString, names })).to.throw(expected);
      });
    });
  }
});

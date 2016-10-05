import { describe, it } from 'mocha';
import { expect } from 'chai';

import { noParse, operators } from '../src/parser/operators';

describe('noParse', () => {
  it('should include "$size" & "$exist"', () => {
    expect(noParse).to.deep.equal(['$exists', '$size']);
  });
});

const testPath = 'path';
const testValue = 'value';
const testValues = ['one', 'two', 'three'];

const requiresPath = operator => it('throws an error if no path argument is provided', () => {
  expect(() => operators[operator](null, testValue)).to.throw(`${operator} requires an attribute path`);
});

const requiresArray = operator => it('throws an error if value is not an array', () => {
  expect(() => operators[operator](testPath, testValue)).to.throw(`${operator} requires argument type Array`);
});

describe('operators', () => {
  const comparators = {
    $eq: '=',
    $ne: '<>',
    $gt: '>',
    $gte: '>=',
    $lt: '<',
    $lte: '<=',
  };
  for (const [operator, comparator] of Object.entries(comparators)) {
    describe(`.${operator}`, () => {
      it(`joins path and value arguments with "${comparator}"`, () => {
        expect(operators[operator](testPath, testValue)).to.equal(`${testPath} ${comparator} ${testValue}`);
      });
      requiresPath(operator);
    });
  }

  const $between = '$between';
  describe(`.${$between}`, () => {
    it('returns a BETWEEN comparator', () => {
      expect(operators[$between](testPath, testValues)).to.equal('path BETWEEN one AND two');
    });
    requiresPath($between);
    requiresArray($between);
  });

  const $in = '$in';
  describe(`.${$in}`, () => {
    it('returns an IN comparator', () => {
      expect(operators[$in](testPath, testValues)).to.equal('path IN (one, two, three)');
    });
    requiresPath($in);
    requiresArray($in);
  });

  const $nin = '$nin';
  describe(`.${$nin}`, () => {
    it('returns an NOT IN comparator', () => {
      expect(operators[$nin](testPath, testValues)).to.equal('NOT path IN (one, two, three)');
    });
    requiresPath($nin);
    requiresArray($nin);
  });

  const $exists = '$exists';
  describe(`.${$exists}`, () => {
    it('returns an exists function when value argument is true', () => {
      expect(operators[$exists](testPath, true)).to.equal(`attribute_exists(${testPath})`);
    });
    it('returns a not_exists function when value argument is false', () => {
      expect(operators[$exists](testPath, false)).to.equal(`attribute_not_exists(${testPath})`);
    });
    it('throws an error if value is not a boolean', () => {
      expect(() => operators[$exists](testPath, 'not bool')).to.throw(`${$exists} requires argument type Boolean`);
    });
    requiresPath($exists);
  });

  const functionals = { $type: 'attribute_type', $beginsWith: 'begins_with', $contains: 'contains' };
  for (const [operator, method] of Object.entries(functionals)) {
    describe(`.${operator}`, () => {
      it(`places path and value into "${method}" method`, () => {
        expect(operators[operator](testPath, testValue)).to.equal(`${method}(${testPath}, ${testValue})`);
      });
      requiresPath(operator);
    });
  }

  const $size = '$size';
  describe(`.${$size}`, () => {
    it('returns size method', () => {
      expect(operators[$size](testPath, testValue)).to.equal(`size(${testPath})`);
    });
    requiresPath($size);
  });

  const logicals = { $or: 'OR', $and: 'AND' };
  for (const [operator, joinder] of Object.entries(logicals)) {
    describe(`.${operator}`, () => {
      it(`joins values with ${joinder}`, () => {
        expect(operators[operator](null, testValues)).to.equal(`one ${joinder} two ${joinder} three`);
      });
      it('parenthesizes response when path provided', () => {
        expect(operators[operator](testValue, testValues)).to.equal(`( one ${joinder} two ${joinder} three )`);
      });
      requiresArray(operator);
    });
  }

  const $not = '$not';
  describe(`.${$not}`, () => {
    it('negates value with NOT', () => {
      expect(operators[$not](testPath, testValue)).to.equal(`NOT ${testValue}`);
    });
  });

  const $nor = '$nor';
  describe(`.${$nor}`, () => {
    it('negates parenthesized values joined with OR', () => {
      expect(operators[$nor](testPath, testValues)).to.equal('NOT ( one OR two OR three )');
    });
    requiresArray($nor);
  });
});

import { describe, it } from 'mocha';
import { expect } from 'chai';

import { operators, validSizeOperator } from '../lib/operators';

const testPath = 'path';
const testValue = 'value';
const testValues = ['one', 'two', 'three'];

const requiresPath = operator => it('throws an error if no path argument is provided', () => {
  expect(() => operators[operator].render(null, testValue)).to.throw(`${operator} requires an attribute path`);
});

const requiresArray = operator => it('throws an error if value is not an array', () => {
  expect(() => operators[operator].render(testPath, testValue)).to.throw(`${operator} requires argument type Array`);
});

const expectShouldParse = (operator, shouldParse) => it(`should have 'shouldParse' set to '${shouldParse}'`, () => {
  expect(operators[operator].shouldParse).to.equal(shouldParse);
});

describe('validSizeOperator', () => {
  it('returns the input without the operator present', () => {
    expect(validSizeOperator('user.profile.image.$size')).to.equal('user.profile.image');
  });
  it('throws an error when passed an invalid size operator path', () => {
    for (const input of ['$size.thing', 'thing.$size.$size', 'thing.$size.thing']) {
      expect(() => validSizeOperator(input).to.throw(`invalid use of $size operator '${input}'`));
    }
  });
});

describe('operators', () => {
  const comparators = { $eq: '=', $ne: '<>', $gt: '>', $gte: '>=', $lt: '<', $lte: '<=' };
  for (const [operator, comparator] of Object.entries(comparators)) {
    describe(`.${operator}`, () => {
      it(`joins path and value arguments with "${comparator}"`, () => {
        expect(operators[operator].render(testPath, testValue)).to.equal(`${testPath} ${comparator} ${testValue}`);
      });
      requiresPath(operator);
      expectShouldParse(operator, true);
    });
  }

  const $between = '$between';
  describe(`.${$between}`, () => {
    it('returns a BETWEEN comparator', () => {
      expect(operators[$between].render(testPath, testValues)).to.equal('path BETWEEN one AND two');
    });
    requiresPath($between);
    requiresArray($between);
    expectShouldParse($between, true);
  });

  const $in = '$in';
  describe(`.${$in}`, () => {
    it('returns an IN comparator', () => {
      expect(operators[$in].render(testPath, testValues)).to.equal('path IN (one, two, three)');
    });
    requiresPath($in);
    requiresArray($in);
    expectShouldParse($in, true);
  });

  const $nin = '$nin';
  describe(`.${$nin}`, () => {
    it('returns an NOT IN comparator', () => {
      expect(operators[$nin].render(testPath, testValues)).to.equal('NOT path IN (one, two, three)');
    });
    requiresPath($nin);
    requiresArray($nin);
    expectShouldParse($nin, true);
  });

  const $exists = '$exists';
  describe(`.${$exists}`, () => {
    it('returns an exists function when value argument is true', () => {
      expect(operators[$exists].render(testPath, true)).to.equal(`attribute_exists(${testPath})`);
    });
    it('returns a not_exists function when value argument is false', () => {
      expect(operators[$exists].render(testPath, false)).to.equal(`attribute_not_exists(${testPath})`);
    });
    it('throws an error if value is not a boolean', () => {
      expect(() => operators[$exists].render(testPath, 'not bool')).to.throw(`${$exists} requires argument type Boolean`);
    });
    requiresPath($exists);
    expectShouldParse($exists, false);
  });

  const functionals = { $type: 'attribute_type', $beginsWith: 'begins_with', $contains: 'contains' };
  for (const [operator, method] of Object.entries(functionals)) {
    describe(`.${operator}`, () => {
      it(`places path and value into "${method}" method`, () => {
        expect(operators[operator].render(testPath, testValue)).to.equal(`${method}(${testPath}, ${testValue})`);
      });
      requiresPath(operator);
      expectShouldParse(operator, true);
    });
  }

  const $size = '$size';
  describe(`.${$size}`, () => {
    it('returns size method', () => {
      expect(operators[$size].render(testPath, testValue)).to.equal(`size(${testPath})`);
    });
    requiresPath($size);
    expectShouldParse($size, false);
  });

  const logicals = { $or: 'OR', $and: 'AND' };
  for (const [operator, joinder] of Object.entries(logicals)) {
    describe(`.${operator}`, () => {
      it(`joins values with ${joinder}`, () => {
        expect(operators[operator].render(null, testValues)).to.equal(`one ${joinder} two ${joinder} three`);
      });
      it('parenthesizes response when path provided', () => {
        expect(operators[operator].render(testValue, testValues)).to.equal(`( one ${joinder} two ${joinder} three )`);
      });
      requiresArray(operator);
      expectShouldParse(operator, true);
    });
  }

  const $not = '$not';
  describe(`.${$not}`, () => {
    it('negates value with NOT', () => {
      expect(operators[$not].render(testPath, testValue)).to.equal(`NOT ${testValue}`);
    });
    expectShouldParse($not, true);
  });

  const $nor = '$nor';
  describe(`.${$nor}`, () => {
    it('negates parenthesized values joined with OR', () => {
      expect(operators[$nor].render(testPath, testValues)).to.equal('NOT ( one OR two OR three )');
    });
    requiresArray($nor);
    expectShouldParse($nor, true);
  });
});

import { describe, it } from 'mocha';
import { expect } from 'chai';

import schema from '../lib/schema';

describe('schema', () => {
  it('throws an error when provided definition is invalid or incomplete', () => {
    const invalidSchema = 'invalid schema definition';
    expect(() => schema()).to.throw(invalidSchema);
    expect(() => schema(true)).to.throw(invalidSchema);
    expect(() => schema({})).to.throw(invalidSchema);
    expect(() => schema({ timestamps: true })).to.throw('invalid attributes description');
  });
  it('throws an error when attribute description(s) are invalid or incomplete', () => {
    const invalidAttributes = 'invalid attributes description';
    const invalidAttribute = path => `invalid attribute description (at '${path}')`;
    expect(() => schema({ attributes: true })).to.throw(invalidAttributes);
    expect(() => schema({ attributes: {} })).to.throw(invalidAttributes);
    expect(() => schema({ attributes: { name: true } })).to.throw(invalidAttribute('name'));
    expect(() => schema({ attributes: { name: {} } })).to.throw(invalidAttribute('name'));
    expect(() => schema({ attributes: { name: { first: {} } } })).to.throw(invalidAttribute('name.first'));
    expect(() => schema({ attributes: { name: { first: [] } } })).to.throw(invalidAttribute('name.first'));
  });
  it('throws an error when provided unrecognized attribute types', () => {
    const unrecognizedType = (type, path) => `unrecognized attribute type '${type}' (at '${path}')`;
    expect(() => schema({ attributes: { name: ['E'] } })).to.throw(unrecognizedType('E', 'name'));
    expect(() => schema({ attributes: { name: { first: 'P' } } })).to.throw(unrecognizedType('P', 'name.first'));
    expect(() => schema({ attributes: { name: { first: [true] } } })).to.throw(unrecognizedType('true', 'name.first'));
  });
  it('throws an error when provded an unrecognized option for a given type', () => {
    const unrecognizedOption = (option, type, path) => `unrecognized attribute option '${option}' for type '${type}' (at '${path}')`;
    expect(() => schema({ attributes: { name: { type: String, min: 5 } } })).to.throw(unrecognizedOption('min', 'String', 'name'));
    expect(() => schema({ attributes: { name: { type: Set, match: /hi/ } } })).to.throw(unrecognizedOption('match', 'Set', 'name'));
  });
  it('throws an error when \'required\' option is not a boolean', () => {
    const notBool = 'option \'required\' expects a boolean (at \'name\')';
    expect(() => schema({ attributes: { name: { type: String, required: 'yes' } } })).to.throw(notBool);
    expect(() => schema({ attributes: { name: { type: String, required: [] } } })).to.throw(notBool);
  });
  it('throws an error when \'default\' option is given a value that doesn\'t match described type', () => {
    const wrongType = type => `option 'default' expects a value with type '${type}' (at \'name\')`;
    expect(() => schema({ attributes: { name: { type: String, default: 5 } } }))
      .to.throw(wrongType('String'));
    expect(() => schema({ attributes: { name: { type: Boolean, default: 'true' } } }))
      .to.throw(wrongType('Boolean'));
  });
});

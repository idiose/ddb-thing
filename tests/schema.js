import { describe, it } from 'mocha';
import { expect } from 'chai';

import { typeNames } from '../lib/utils';
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
    expect(() => schema({ attributes: { name: { first: [true] } } })).to.throw(invalidAttribute('name.first'));
  });
  it('throws an error when provided unrecognized attribute types', () => {
    const unrecognizedType = (type, path) => `unrecognized attribute type '${type}' (at '${path}')`;
    expect(() => schema({ attributes: { name: ['E'] } })).to.throw(unrecognizedType('E', 'name'));
    expect(() => schema({ attributes: { name: { first: 'P' } } })).to.throw(unrecognizedType('P', 'name.first'));
  });
  it('throws an error when provded an unrecognized option for a given type', () => {
    const unrecognizedOption = (option, type, path) => `unrecognized attribute option '${option}' for type '${type}' (at '${path}')`;
    expect(() => schema({ attributes: { name: { type: typeNames.String, min: 5 } } })).to.throw(unrecognizedOption('min', typeNames.String, 'name'));
    expect(() => schema({ attributes: { name: { type: typeNames.List, match: /hi/ } } })).to.throw(unrecognizedOption('match', typeNames.List, 'name'));
  });
  it('throws an error when \'required\' option is not a boolean', () => {
    const notBool = 'option \'required\' expects a boolean (at \'name\')';
    expect(() => schema({ attributes: { name: { type: typeNames.String, required: 'yes' } } })).to.throw(notBool);
    expect(() => schema({ attributes: { name: { type: typeNames.String, required: [] } } })).to.throw(notBool);
  });
  it('throws an error when \'default\' option is given a value that doesn\'t match described type', () => {
    const wrongType = type => `option 'default' expects a value with type '${type}' (at \'name\')`;
    expect(() => schema({ attributes: { name: { type: typeNames.String, default: 5 } } })).to.throw(wrongType(typeNames.String));
    expect(() => schema({ attributes: { name: { type: typeNames.Boolean, default: 'true' } } })).to.throw(wrongType(typeNames.Boolean));
  });

  const validDefinition = {
    attributes: {
      name: {
        first: { type: typeNames.String, default: 'Rick', required: true, minlength: 3 },
        last: {
          type: typeNames.String,
          default: 'Sanchez',
          validate: (value) => {
            if (value === 'pizza') throw new Error('pizza isn\'t a name!');
          },
        },
      },
      settings: {
        password: { type: typeNames.String, get: val => (val && val.replace(/[A-Za-z0-9]/g, '*')) || '' },
      },
      address: {
        permanent: { type: typeNames.String, default: 'space', required: true },
        mailing: { type: typeNames.String, trim: true },
      },
      age: {
        type: typeNames.Number,
        default: 50,
        validate: [
          (value) => {
            if (value < 0) throw new Error('...huh?');
          },
          value => new Promise((resolve, reject) => {
            setTimeout(() => {
              if (value === 69) return reject(new Error('hee hee hee'));
              return resolve();
            }, 1000);
          }),
        ],
        get: val => `${val}`,
      },
      gender: {
        type: typeNames.String,
        enum: ['male', 'female'],
        uppercase: true,
        required: true,
        get: [val => ((val && val[0]) || ''), val => ((val && val.toLowerCase()) || '')],
      },
      occupation: { type: typeNames.String, default: 'scientist' },
    },
  };

  const validSchema = schema(validDefinition);

  describe('.setDefaults', () => {
    it('includes provided object with default values', () => {
      expect(validSchema.setDefaults({
        name: { last: 'Astley' },
        occupation: 'singer',
      })).to.deep.equal({
        name: { first: 'Rick', last: 'Astley' },
        address: { permanent: 'space' },
        age: 50,
        occupation: 'singer',
      });
    });
  });

  describe('.compelRequired', () => {
    it('throws an error if an attribute is required and is undefined', () => {
      expect(() => validSchema.compelRequired({
        name: { last: 'Astely' },
      })).to.throw('attribute \'name.first\' is required');
      expect(() => validSchema.compelRequired({
        name: { first: 'Jack' },
      })).to.throw('attribute \'address.permanent\' is required');
    });
  });

  describe('.validate', () => {
    it('throws an error when an attribute fails validation', async () => {
      try {
        await validSchema.validate({ name: { first: 'hi' } });
      } catch (error) {
        expect(error.message).to.equal('expected value \'hi\' to be at least 3 characters in length (at \'name.first\')');
      }
      try {
        await validSchema.validate({ gender: 'yellow' });
      } catch (error) {
        expect(error.message).to.equal('expected value \'yellow\' to be in (male, female) (at \'gender\')');
      }
      try {
        await validSchema.validate({ name: { last: 'pizza' } });
      } catch (error) {
        expect(error.message).to.equal('pizza isn\'t a name!');
      }
      try {
        await validSchema.validate({ age: -1 });
      } catch (error) {
        expect(error.message).to.equal('...huh?');
      }
      try {
        await validSchema.validate({ age: 69 });
      } catch (error) {
        expect(error.message).to.equal('hee hee hee');
      }
    });
  });

  describe('.runSetters', () => {
    it('applies setter transforms on provided input', () => {
      expect(validSchema.runSetters({
        address: { mailing: '   plz trim me   ' },
        gender: 'male',
      })).to.deep.equal({
        address: { mailing: 'plz trim me' },
        gender: 'MALE',
      });
    });
  });

  describe('.runGetters', () => {
    it('applies getter transforms on provided input', () => {
      expect(validSchema.runGetters({
        settings: { password: 'secret' },
        age: 15,
        gender: 'MALE',
      })).to.deep.equal({
        settings: { password: '******' },
        age: '15',
        gender: 'm',
      });
    });
  });
});

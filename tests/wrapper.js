import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import AWS from 'aws-sdk';

import awsconfig from '../awsconfig.json';
import schema from '../lib/schema';
import wrapper from '../lib/wrapper';

AWS.config.update(awsconfig);
const DDB = new AWS.DynamoDB();

const TableName = 'ddb-thing-test-users';

const User = wrapper(TableName, schema({
  attributes: {
    hash: { type: String, required: true },
    range: { type: 'String', required: true, lowercase: true },
    object: {
      one: { type: 'String', required: true },
      two: { type: 'String', required: true, trim: true },
    },
    set: { type: 'Set' },
    bool: { type: 'Boolean', default: false, get: active => active.toString() },
  },
  timestamps: true,
}));

const hashes = ['AAA', 'BBB', 'CCC'];
const seeds = [].concat(...hashes.map(hash => [].concat(hashes.map(range => ({
  hash,
  range: range.toLowerCase(),
  object: { one: `${hash}${range}`, two: `${range}${hash}` },
})))));
const testFetchKey = { hash: 'AAA', range: 'aaa' };

const testUserKey = { hash: 'testhash', range: 'testrange' };
const testUser = {
  hash: testUserKey.hash,
  range: testUserKey.range,
  object: { one: 'testone', two: 'testtwo' },
  set: new Set(['one', 'two', 'three']),
};

describe('wrapper', () => {
  before(async () => {
    await DDB.createTable({
      TableName,
      KeySchema: [{ AttributeName: 'hash', KeyType: 'HASH' }, { AttributeName: 'range', KeyType: 'RANGE' }],
      AttributeDefinitions: [{ AttributeName: 'hash', AttributeType: 'S' }, { AttributeName: 'range', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
    }).promise();

    await Promise.all(seeds.map(User.put));
  });

  after(async () => {
    await DDB.deleteTable({ TableName }).promise();
  });

  describe('.put', () => {
    it('puts an item into the db', async () => {
      const user = await User.put(testUser);
      expect(user).to.have.all.keys(['hash', 'range', 'object', 'bool', 'set', 'created', 'modified']);
      expect(user.bool).to.equal('false');
      const fetched = await User.get(testUserKey);
      expect(fetched).to.deep.equal(user);
      await User.delete(testUserKey);
    });

    it('optionally skips insertion of default values', async () => {
      const user = await User.put(testUser, { defaults: false });
      expect(user.bool).to.equal(undefined);
      const fetched = await User.get(testUserKey, { defaults: false });
      expect(fetched.bool).to.equal(undefined);
      await User.delete(testUserKey);
    });

    it('optionally skips requiring required fields', async () => {
      const user = await User.put(testUserKey, { required: false });
      expect(user.object).to.equal(undefined);
      const fetched = await User.get(testUserKey);
      expect(fetched.object).to.equal(undefined);
      await User.delete(testUserKey);
    });

    it('optionally skips validation', async () => {
      const user = await User.put(Object.assign({}, testUser, { bool: 'yes' }), { validate: false });
      expect(user.bool).to.equal('yes');
      const fetched = await User.get(testUserKey);
      expect(fetched.bool).to.equal('yes');
      await User.delete(testUserKey);
    });

    it('optionally skips setters', async () => {
      const object = { one: 'testone', two: '  testtwo  ' };
      const user = await User.put(Object.assign({}, testUser, { object }), { setters: false });
      expect(user.object.two).to.equal('  testtwo  ');
      const fetched = await User.get(testUserKey);
      expect(fetched.object.two).to.equal('  testtwo  ');
      await User.delete(testUserKey);
    });

    it('optionally skips getters', async () => {
      const user = await User.put(testUser, { getters: false });
      expect(user.bool).to.equal(false);
      await User.delete(testUserKey);
    });

    it('passes conditions to ddb', async () => {
      await User.put(testUser);
      try {
        await User.put(testUser, { conditions: { hash: { $exists: false } } });
      } catch (error) {
        expect(error.message).to.equal('The conditional request failed');
      }
      await User.delete(testUserKey);
    });

    it('optionally returns ddb response', async () => {
      const user = await User.put(testUser, { response: true });
      expect(user).to.have.key('Attributes');
      await User.delete(testUserKey);
    });
  });

  describe('.get', () => {
    it('retrieves an item by provided key', async () => {
      const user = await User.get(testFetchKey);
      expect(user.object).to.deep.equal({ one: 'AAAAAA', two: 'AAAAAA' });
      expect(user.bool).to.equal('false');
    });

    it('optionally skips getters', async () => {
      const user = await User.get(testFetchKey, { getters: false });
      expect(user.bool).to.equal(false);
    });

    it('passes projections to ddb', async () => {
      const user = await User.get(testFetchKey, { project: ['object.one'] });
      expect(user).to.deep.equal({ object: { one: 'AAAAAA' } });
    });

    it('optionally return ddb response', async () => {
      const user = await User.get(testFetchKey, { response: true });
      expect(user).to.have.key('Item');
    });

    it('throws an error when no item found', async () => {
      const badKey = { hash: 'none', range: 'none' };
      try {
        await User.get(badKey);
      } catch (error) {
        expect(error.message).to.equal(`no item found with Key ${JSON.stringify(badKey)}`);
      }
    });
  });

  describe('.scan', () => {
    it('scans items...', async () => {
      const results = await User.scan();
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(9);
      expect(results.Items.length).to.equal(9);
      expect(results.Items[0].bool).to.equal('false');
    });

    it('forwards filters to ddb', async () => {
      const results = await User.scan({ filter: { hash: { $not: { $contains: 'A' } } } });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(6);
      expect(results.Items.length).to.equal(6);
      expect(results.Items.every(({ hash }) => !hash.includes('A'))).to.equal(true);
    });

    it('forwards projections to ddb', async () => {
      const results = await User.scan({ filter: { hash: 'AAA' }, project: ['hash'] });
      expect(results.Count).to.equal(3);
      expect(results.Items.length).to.equal(3);
      for (const item of results.Items) {
        expect(item).to.deep.equal({ hash: 'AAA', bool: 'false' });
      }
    });

    it('passes startKey to ddb', async () => {
      const results = await User.scan({ startKey: { hash: 'CCC', range: 'ccc' } });
      expect(results.Count).to.equal(6);
      expect(results.Items.length).to.equal(6);
      expect(results.Items[0].hash).to.equal('AAA');
      expect(results.Items[0].range).to.equal('aaa');
    });

    it('passes limit to ddb', async () => {
      const results = await User.scan({ limit: 1 });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount', 'LastEvaluatedKey']);
      expect(results.Items.length).to.equal(1);
      expect(results.Count).to.equal(1);
      expect(results.Items[0].range).to.equal('aaa');
      expect(results.LastEvaluatedKey).to.deep.equal({ hash: 'CCC', range: 'aaa' });
    });

    it('passes select to ddb when no projection present', async () => {
      const results = await User.scan({ select: 'COUNT' });
      expect(results).to.have.all.keys(['Count', 'ScannedCount']);
      expect(results.Count).to.equal(9);
    });

    it('optionally skips getters', async () => {
      const results = await User.scan({ getters: false });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(9);
      expect(results.Items.length).to.equal(9);
      expect(results.Items[0].bool).to.equal(false);
    });

    it('supports parallel scans', async () => {
      const results = await User.scan({ segments: 2 });
      expect(results).to.be.an('array');
      expect(results.length).to.equal(2);
      for (const result of results) {
        expect(result).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
        expect(result.Items[0].bool).to.equal('false');
      }
    });
  });

  describe('.query', () => {
    it('queries items with provided key condition', async () => {
      const results = await User.query({ hash: 'AAA' });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(3);
      expect(results.Items.length).to.equal(3);
      expect(results.Items[0].range).to.equal('aaa');
    });

    it('queries items with provided key and range condition', async () => {
      const results = await User.query({ hash: 'AAA', range: { $beginsWith: 'b' } });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(1);
      expect(results.Items.length).to.equal(1);
      expect(results.Items[0].range).to.equal('bbb');
    });

    it('forwards filters to ddb', async () => {
      const results = await User.query({ hash: 'AAA' }, { filter: { 'object.one': { $not: { $contains: 'B' } } } });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(2);
      expect(results.ScannedCount).to.equal(3);
      expect(results.Items.length).to.equal(2);
      expect(results.Items[0].range).to.equal('aaa');
      expect(results.Items[1].range).to.equal('ccc');
    });

    it('forwards projections to ddb', async () => {
      const results = await User.query({ hash: 'BBB' }, { project: ['hash'] });
      expect(results.Items.length).to.equal(3);
      for (const item of results.Items) {
        expect(item).to.deep.equal({ hash: 'BBB', bool: 'false' });
      }
    });

    it('passes startKey to ddb', async () => {
      const results = await User.query({ hash: 'CCC' }, { startKey: { hash: 'CCC', range: 'bbb' } });
      expect(results.Items.length).to.equal(1);
      expect(results.Count).to.equal(1);
      expect(results.Items[0].range).to.equal('ccc');
    });

    it('passes limit to ddb', async () => {
      const results = await User.query({ hash: 'CCC' }, { limit: 1 });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount', 'LastEvaluatedKey']);
      expect(results.Items.length).to.equal(1);
      expect(results.Count).to.equal(1);
      expect(results.Items[0].range).to.equal('aaa');
      expect(results.LastEvaluatedKey).to.deep.equal({ hash: 'CCC', range: 'aaa' });
    });

    it('passes select to ddb when no projection present', async () => {
      const results = await User.query({ hash: 'CCC' }, { select: 'COUNT' });
      expect(results).to.have.all.keys(['Count', 'ScannedCount']);
      expect(results.Count).to.equal(3);
    });

    it('optionally reverses sort order', async () => {
      const results = await User.query({ hash: 'AAA' }, { reverse: true });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(3);
      expect(results.Items.length).to.equal(3);
      expect(results.Items[0].range).to.equal('ccc');
    });

    it('optionally skips getters', async () => {
      const results = await User.query({ hash: 'AAA' }, { getters: false });
      expect(results).to.have.all.keys(['Items', 'Count', 'ScannedCount']);
      expect(results.Count).to.equal(3);
      expect(results.Items.length).to.equal(3);
      expect(results.Items[0].bool).to.equal(false);
    });
  });

  describe('.update', () => {
    beforeEach(async () => {
      await User.put(testUser);
    });

    after(async () => {
      await User.delete(testUserKey);
    });

    const returnValues = 'ALL_NEW';

    it('places reassignments into a $set expression and updates', async () => {
      const user = await User.update(testUserKey, { 'object.one': 'new value' }, { returnValues });
      expect(user.object).to.deep.equal({ one: 'new value', two: 'testtwo' });
    });

    it('optionally skips validation', async () => {
      const user = await User.update(testUserKey, { bool: 55 }, { validate: false, returnValues });
      expect(user.bool).to.equal('55');
    });

    it('optionally skips setters', async () => {
      const user = await User.update(testUserKey, { 'object.two': '  haha  ' }, { setters: false, returnValues });
      expect(user.object).to.deep.equal({ one: 'testone', two: '  haha  ' });
    });

    it('optionally skips timestamps', async () => {
      const current = await User.get(testUserKey);
      const updated = await User.update(testUserKey, { bool: true }, { timestamps: false, returnValues });
      expect(updated.bool).to.equal('true');
      expect(updated.modified).to.equal(current.modified);
    });

    it('optionally skips getters', async () => {
      const user = await User.update(testUserKey, { bool: true }, { getters: false, returnValues });
      expect(user.bool).to.equal(true);
    });

    it('forwards update operators to ddb', async () => {
      const updates = { $set: { 'object.two': 55, bool: 'lol' }, $remove: ['object.one'] };
      const user = await User.update(testUserKey, updates, { returnValues });
      expect(user.object).to.deep.equal({ two: 55 });
      expect(user.bool).to.equal('lol');
    });
  });

  describe('.delete', () => {
    let user;
    beforeEach(async () => {
      user = await User.put(testUser);
    });

    after(async () => {
      await User.delete(testUserKey);
    });

    it('deletes an item with provided key', async () => {
      const fetch = await User.get(testUserKey);
      expect(fetch).to.deep.equal(user);
      await User.delete(testUserKey);
      try {
        await User.get(testUserKey);
      } catch (error) {
        expect(error.message).to.equal(`no item found with Key ${JSON.stringify(testUserKey)}`);
      }
    });

    it('passes conditions to ddb', async () => {
      const fetch = await User.get(testUserKey);
      expect(fetch).to.deep.equal(user);
      try {
        await User.delete(testUserKey, { conditions: { set: { $not: { $contains: 'one' } } } });
      } catch (error) {
        expect(error.message).to.equal('The conditional request failed');
      }
    });

    it('passes return values to ddb', async () => {
      const deleted = await User.delete(testUserKey, { returnValues: 'ALL_OLD' });
      expect(deleted).to.deep.equal(user);
      try {
        await User.get(testUserKey);
      } catch (error) {
        expect(error.message).to.equal(`no item found with Key ${JSON.stringify(testUserKey)}`);
      }
    });
  });
});

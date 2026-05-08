const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../src/config/db');
const service = require('../src/modules/community/community.service');

test('community service createPost trims content and returns inserted row', async (t) => {
  const originalQuery = pool.query;
  const calls = [];

  pool.query = async (sql, params) => {
    calls.push({ sql, params });

    if (calls.length === 1) {
      return [{ insertId: 88 }];
    }

    return [[{ id: 88, content: 'hello world', username: 'alice' }]];
  };

  t.after(() => {
    pool.query = originalQuery;
  });

  const row = await service.createPost(9, '  hello world  ');

  assert.equal(row.id, 88);
  assert.equal(row.content, 'hello world');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].params, [9, 'hello world']);
  assert.deepEqual(calls[1].params, [88]);
});

test('community service listPosts clamps invalid limits', async (t) => {
  const originalQuery = pool.query;
  const usedLimits = [];

  pool.query = async (_sql, params) => {
    usedLimits.push(params[0]);
    return [[{ id: 1, content: 'ok' }]];
  };

  t.after(() => {
    pool.query = originalQuery;
  });

  await service.listPosts(0);
  await service.listPosts(9999);
  await service.listPosts('abc');

  assert.deepEqual(usedLimits, [20, 100, 20]);
});

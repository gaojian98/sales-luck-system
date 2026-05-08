const test = require('node:test');
const assert = require('node:assert/strict');

const pool = require('../src/config/db');
const service = require('../src/modules/growth/growth.service');

test('growth service returns aggregated trajectory in fixed shape', async (t) => {
  const originalQuery = pool.query;
  const receivedUserIds = [];

  pool.query = async (sql, params = []) => {
    if (String(sql).includes('INFORMATION_SCHEMA.COLUMNS')) {
      return [[{ total: 0 }]];
    }
    receivedUserIds.push(params[0]);

    if (receivedUserIds.length === 1) {
      return [[{ id: 1, change_amount: 30 }]];
    }
    if (receivedUserIds.length === 2) {
      return [[{ id: 2, reward_type: 'points', reward_value: 10 }]];
    }
    return [[{ id: 3, package_name: '推荐包', energy_value: 80 }]];
  };

  t.after(() => {
    pool.query = originalQuery;
  });

  const result = await service.getTrajectory(77);

  assert.deepEqual(receivedUserIds, [77, 77, 77]);
  assert.ok(Array.isArray(result.energy));
  assert.ok(Array.isArray(result.tests));
  assert.ok(Array.isArray(result.recharges));
  assert.equal(result.energy[0].id, 1);
  assert.equal(result.tests[0].id, 2);
  assert.equal(result.recharges[0].id, 3);
});

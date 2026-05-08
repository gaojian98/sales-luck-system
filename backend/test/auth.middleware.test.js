const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const authMiddleware = require('../src/middlewares/auth.middleware');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

test('auth middleware rejects missing bearer token', () => {
  const req = { headers: {} };
  const res = createMockRes();
  let called = false;

  authMiddleware(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});

test('auth middleware accepts valid bearer token', () => {
  process.env.JWT_SECRET = 'unit-test-secret';
  const token = jwt.sign({ userId: 1, username: 'tester' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createMockRes();
  let called = false;

  authMiddleware(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.user.userId, 1);
});

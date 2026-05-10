const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../src/modules/mindset/mindset.routes');

function listRouteSignatures(expressRouter) {
  const stack = expressRouter.stack || [];
  return stack
    .filter((layer) => layer.route && layer.route.path)
    .map((layer) => {
      const methods = Object.keys(layer.route.methods)
        .filter((method) => layer.route.methods[method])
        .map((method) => method.toUpperCase())
        .join(',');
      return `${methods} ${layer.route.path}`;
    });
}

test('mindset routes expose daily practice operations', () => {
  const signatures = listRouteSignatures(router);
  assert.ok(signatures.includes('GET /today'));
  assert.ok(signatures.includes('POST /practice/complete'));
  assert.ok(signatures.includes('POST /self-eval'));
  assert.ok(signatures.includes('POST /weekly-assessment'));
  assert.ok(signatures.includes('GET /weekly-goal'));
  assert.ok(signatures.includes('POST /weekly-goal'));
  assert.ok(signatures.includes('POST /psych/fear-identify'));
  assert.ok(signatures.includes('POST /psych/inferiority-rewrite'));
  assert.ok(signatures.includes('POST /psych/first-aid'));
  assert.ok(signatures.includes('GET /psych/history'));
  assert.ok(signatures.includes('POST /identity/evidence'));
  assert.ok(signatures.includes('GET /identity/evidence'));
  assert.ok(signatures.includes('GET /identity/profile'));
  assert.ok(signatures.includes('GET /metrics'));
});

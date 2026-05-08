const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../src/modules/admin/admin.routes');

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

test('admin routes expose phase-1 operations', () => {
  const signatures = listRouteSignatures(router);
  assert.ok(signatures.includes('POST /auth/login'));
  assert.ok(signatures.includes('GET /customers'));
  assert.ok(signatures.includes('GET /customers/:id'));
  assert.ok(signatures.includes('GET /customers/:id/risk-profile'));
  assert.ok(signatures.includes('POST /recharge/assist/create'));
  assert.ok(signatures.includes('POST /recharge/assist/:id/approve'));
  assert.ok(signatures.includes('POST /recharge/assist/:id/reject'));
  assert.ok(signatures.includes('POST /recharge/assist/:id/cancel'));
  assert.ok(signatures.includes('POST /recharge/assist/timeout/sweep'));
  assert.ok(signatures.includes('GET /recharge/assist/reject-reasons'));
  assert.ok(signatures.includes('GET /intervention/templates'));
  assert.ok(signatures.includes('POST /intervention/fill'));
  assert.ok(signatures.includes('GET /recharge/assist/requests'));
  assert.ok(signatures.includes('GET /notifications'));
  assert.ok(signatures.includes('GET /customer-tags'));
  assert.ok(signatures.includes('POST /customer-tags'));
  assert.ok(signatures.includes('POST /customers/:id/tags'));
  assert.ok(signatures.includes('GET /tickets'));
  assert.ok(signatures.includes('POST /tickets'));
  assert.ok(signatures.includes('PUT /tickets/:id/status'));
  assert.ok(signatures.includes('GET /tickets/:id/comments'));
  assert.ok(signatures.includes('POST /tickets/:id/comments'));
  assert.ok(signatures.includes('POST /followups/create'));
  assert.ok(signatures.includes('GET /followups'));
  assert.ok(signatures.includes('PUT /followups/:id/status'));
  assert.ok(signatures.includes('GET /dashboard/conversion'));
  assert.ok(signatures.includes('POST /followups/overdue/remind'));
  assert.ok(signatures.includes('GET /dashboard/cs-performance'));
  assert.ok(signatures.includes('GET /configs'));
  assert.ok(signatures.includes('GET /recharge/channel-options'));
  assert.ok(signatures.includes('PUT /configs/:key'));
  assert.ok(signatures.includes('GET /configs/history'));
  assert.ok(signatures.includes('POST /configs/history/:id/rollback'));
  assert.ok(signatures.includes('GET /params'));
  assert.ok(signatures.includes('PUT /params/:key'));
  assert.ok(signatures.includes('GET /audit/logs'));
});

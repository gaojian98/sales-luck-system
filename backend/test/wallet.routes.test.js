const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../src/modules/wallets/wallet.routes');

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

test('wallet routes expose balance and energy actions', () => {
  const signatures = listRouteSignatures(router);
  assert.ok(signatures.includes('GET /'));
  assert.ok(signatures.includes('POST /energy/gift'));
  assert.ok(signatures.includes('POST /energy/redeem-cash'));
});

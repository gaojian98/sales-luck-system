const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../src/modules/lottery/lottery.routes');

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

test('lottery routes expose spin and records endpoints', () => {
  const signatures = listRouteSignatures(router);

  assert.ok(signatures.includes('POST /spin'));
  assert.ok(signatures.includes('GET /records'));
});

const test = require('node:test');
const assert = require('node:assert');
const { isOriginAllowed, isLocalOrPrivateIp, createCorsMiddleware } = require('../../src/infrastructure/security/origin-guard');

test('Origin Guard Deep Coverage', async (t) => {
  await t.test('isLocalOrPrivateIp handles invalid and boundary inputs', () => {
    assert.strictEqual(isLocalOrPrivateIp(null), false);
    assert.strictEqual(isLocalOrPrivateIp(''), false);
    assert.strictEqual(isLocalOrPrivateIp(undefined), false);
    assert.strictEqual(isLocalOrPrivateIp('172.15.0.1'), false);
    assert.strictEqual(isLocalOrPrivateIp('172.32.0.1'), false);
    assert.strictEqual(isLocalOrPrivateIp('172.16.0.1'), true);
    assert.strictEqual(isLocalOrPrivateIp('172.31.255.255'), true);
    assert.strictEqual(isLocalOrPrivateIp('10.255.0.1'), true);
    assert.strictEqual(isLocalOrPrivateIp('192.168.0.1'), true);
    assert.strictEqual(isLocalOrPrivateIp('::1'), true);
    assert.strictEqual(isLocalOrPrivateIp('google.com'), false);
  });

  await t.test('isOriginAllowed handles edge cases and tunnel origins', () => {
    assert.strictEqual(isOriginAllowed(''), true, 'falsy origin passes');
    assert.strictEqual(isOriginAllowed(null), true);
    assert.strictEqual(isOriginAllowed('not-a-valid-url'), false);

    const tunnelManagerWithoutUrl = {
      getStatus: () => ({ publicUrl: null })
    };
    assert.strictEqual(isOriginAllowed('https://evil.com', { tunnelManager: tunnelManagerWithoutUrl }), false);

    const tunnelManagerWithUrl = {
      getStatus: () => ({ publicUrl: 'https://test-tunnel.example.com' })
    };
    assert.strictEqual(isOriginAllowed('https://test-tunnel.example.com', { tunnelManager: tunnelManagerWithUrl }), true);
    assert.strictEqual(isOriginAllowed('https://evil.com', { tunnelManager: tunnelManagerWithUrl }), false);
  });

  await t.test('createCorsMiddleware passes requests with no origin', () => {
    const middleware = createCorsMiddleware();
    let nextCalled = false;
    const req = { headers: {} };
    const res = {};
    middleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
  });

  await t.test('createCorsMiddleware rejects malformed origin with 400', () => {
    const middleware = createCorsMiddleware();
    let statusCode = null;
    let jsonBody = null;
    const req = { headers: { origin: 'http://::invalid' } };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) { jsonBody = body; }
        };
      }
    };
    middleware(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonBody.success, false);
    assert.strictEqual(jsonBody.error, 'Malformed Origin Header');
  });

  await t.test('createCorsMiddleware blocks unauthorized origin with 403', () => {
    const middleware = createCorsMiddleware();
    let statusCode = null;
    let jsonBody = null;
    const req = { headers: { origin: 'https://evil-hacker.com' } };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(body) { jsonBody = body; }
        };
      }
    };
    middleware(req, res, () => {});
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonBody.success, false);
    assert.ok(jsonBody.error.includes('Forbidden'));
  });

  await t.test('createCorsMiddleware permits allowed origin and sets headers', () => {
    const middleware = createCorsMiddleware({ activePort: 3000 });
    const headers = {};
    let nextCalled = false;
    const req = { headers: { origin: 'http://localhost:3000' }, method: 'GET' };
    const res = {
      setHeader(name, val) { headers[name] = val; }
    };
    middleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(headers['Access-Control-Allow-Origin'], 'http://localhost:3000');
    assert.strictEqual(headers['Access-Control-Allow-Credentials'], 'true');
  });

  await t.test('createCorsMiddleware handles preflight OPTIONS with 204', () => {
    const middleware = createCorsMiddleware({ activePort: 3000 });
    const headers = {};
    let sendStatusVal = null;
    let nextCalled = false;
    const req = { headers: { origin: 'http://127.0.0.1:3000' }, method: 'OPTIONS' };
    const res = {
      setHeader(name, val) { headers[name] = val; },
      sendStatus(code) { sendStatusVal = code; }
    };
    middleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(sendStatusVal, 204);
    assert.strictEqual(headers['Access-Control-Allow-Origin'], 'http://127.0.0.1:3000');
  });
});

const test = require('node:test');
const assert = require('node:assert');
const { SystemDoctor, selectPrimaryEndpoint } = require('../../src/infrastructure/system/doctor');
const { loadConfig, saveConfig } = require('../../src/infrastructure/security/pin-auth');

test('SystemDoctor Diagnostics Suite', async (t) => {
  const doctor = new SystemDoctor();

  await t.test('returns diagnostics with valid node, git, and powershell checks', async () => {
    const diag = await doctor.getDiagnostics();
    assert.ok(diag.timestamp);
    assert.ok(diag.platform);
    assert.ok(diag.arch);
    assert.strictEqual(typeof diag.node.status, 'string');
    assert.strictEqual(typeof diag.git.status, 'string');
    assert.strictEqual(typeof diag.powershell.status, 'string');
    assert.strictEqual(typeof diag.antigravity.status, 'string');
    assert.strictEqual(typeof diag.keepAwake.active, 'boolean');
  });

  await t.test('resolves local network endpoints and identifies IPv4 interfaces', () => {
    const netInfo = doctor.getNetworkInfo(8080);
    assert.strictEqual(netInfo.port, 8080);
    assert.ok(netInfo.hostname);
    assert.ok(Array.isArray(netInfo.lanUrls));
    assert.ok(Array.isArray(netInfo.virtualUrls));
    assert.ok(netInfo.primaryUrl.startsWith('http://'));
    assert.ok(netInfo.primaryUrl.includes('8080'));
  });

  await t.test('selectPrimaryEndpoint selects lan, virtual, or localhost fallback', () => {
    const lan = [{ url: 'http://192.168.1.10:3000', ip: '192.168.1.10' }];
    const virtual = [{ url: 'http://10.255.0.1:3000', ip: '10.255.0.1' }];

    // 1. Lan preferred
    const p1 = selectPrimaryEndpoint(lan, virtual, 3000);
    assert.strictEqual(p1.ip, '192.168.1.10');

    // 2. Virtual fallback
    const p2 = selectPrimaryEndpoint([], virtual, 3000);
    assert.strictEqual(p2.ip, '10.255.0.1');

    // 3. Localhost fallback
    const p3 = selectPrimaryEndpoint([], [], 3000);
    assert.strictEqual(p3.ip, '127.0.0.1');
    assert.strictEqual(p3.url, 'http://localhost:3000');
  });
});

const { JsonConfigAdapter } = require('../../src/infrastructure/config/json-config.adapter');
const fs = require('fs');
const path = require('path');
const os = require('os');

test('JsonConfigAdapter Edge Cases', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-config-test-'));
  const configPath = path.join(tmpDir, 'test-config.json');

  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.POCKET_PIN;
  });

  await t.test('handles corrupted config file gracefully with default fallback', () => {
    fs.writeFileSync(configPath, 'NOT A VALID JSON FILE {[[[', 'utf8');
    const adapter = new JsonConfigAdapter(configPath);
    const loaded = adapter.loadConfig();
    assert.strictEqual(loaded.pin, '1234');
    assert.strictEqual(loaded.port, 3000);
  });

  await t.test('respects POCKET_PIN environment variable', () => {
    process.env.POCKET_PIN = '9876';
    const adapter = new JsonConfigAdapter(configPath);
    const loaded = adapter.loadConfig();
    assert.strictEqual(loaded.pin, '9876');
    delete process.env.POCKET_PIN;
  });

  await t.test('validates port number within 1-65535 range on saveConfig', () => {
    const adapter = new JsonConfigAdapter(configPath);
    const res = adapter.saveConfig({ port: '8080', pin: '5555' });
    assert.strictEqual(res.port, 8080);
    assert.strictEqual(res.pin, '5555');

    // Invalid port should be ignored
    const invalidPortRes = adapter.saveConfig({ port: '999999' });
    assert.strictEqual(invalidPortRes.port, 8080);
  });
});

const { TunnelManager } = require('../../src/infrastructure/system/tunnel-manager');

test('TunnelManager State and Listeners', async (t) => {
  const tm = new TunnelManager();

  await t.test('registers status change listener and notifies', () => {
    let notifiedStatus = null;
    const unsubscribe = tm.onStatusChange((status) => {
      notifiedStatus = status;
    });

    tm._notify();
    assert.ok(notifiedStatus);
    assert.strictEqual(notifiedStatus.status, 'stopped');

    unsubscribe();
    notifiedStatus = null;
    tm._notify();
    assert.strictEqual(notifiedStatus, null);
  });

  await t.test('start returns current status if already starting or active', async () => {
    tm._status = 'active';
    const status = await tm.start(3000);
    assert.strictEqual(status.active, true);
    tm._status = 'stopped';
  });
});

test('Configuration Persistence', async (t) => {
  await t.test('loads default or stored configuration safely', () => {
    const config = loadConfig();
    assert.ok(config);
    assert.ok(config.pin);
    assert.strictEqual(typeof config.port, 'number');
  });

  await t.test('updates and preserves configuration keys with saveConfig', () => {
    const original = loadConfig();
    const updated = saveConfig({ preventSleep: true });
    assert.strictEqual(updated.preventSleep, true);

    // Restore original
    saveConfig({ preventSleep: original.preventSleep || false });
  });
});

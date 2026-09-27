const test = require('node:test');
const assert = require('node:assert');
const { CircuitBreaker } = require('../../src/infrastructure/resilience/circuit-breaker');
const PromptQueue = require('../../src/infrastructure/automation/queue');
const { MemoryEvictionGuard } = require('../../src/infrastructure/resilience/memory-eviction');
const { isOriginAllowed, isLocalOrPrivateIp } = require('../../src/infrastructure/security/origin-guard');

test('CircuitBreaker Pattern & Failover', async (t) => {
  await t.test('executes primary action when circuit is CLOSED', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });
    const result = await breaker.execute(() => 'primary-ok', () => 'fallback');
    assert.strictEqual(result, 'primary-ok');
    assert.strictEqual(breaker.state, 'CLOSED');
  });

  await t.test('trips to OPEN after reaching failureThreshold and calls fallback silently', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 50 });
    
    // First failure
    await breaker.execute(() => { throw new Error('fail-1'); }, () => 'fallback-1');
    assert.strictEqual(breaker.state, 'CLOSED');
    assert.strictEqual(breaker.failureCount, 1);

    // Second failure: trips to OPEN
    const res2 = await breaker.execute(() => { throw new Error('fail-2'); }, () => 'fallback-2');
    assert.strictEqual(res2, 'fallback-2');
    assert.strictEqual(breaker.state, 'OPEN');

    // While OPEN: fast-fails immediately to fallback without calling primary
    let primaryCalled = false;
    const res3 = await breaker.execute(() => { primaryCalled = true; }, () => 'fallback-silent');
    assert.strictEqual(primaryCalled, false);
    assert.strictEqual(res3, 'fallback-silent');
  });

  await t.test('transitions to HALF_OPEN after resetTimeoutMs and resets on success', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 30 });
    await breaker.execute(() => { throw new Error('fail'); }, () => 'fallback');
    assert.strictEqual(breaker.state, 'OPEN');

    // Wait for reset timeout
    await new Promise(r => setTimeout(r, 40));
    assert.strictEqual(breaker.getState().state, 'HALF_OPEN');

    // Successful attempt resets circuit
    const res = await breaker.execute(() => 'recovered', () => 'fallback');
    assert.strictEqual(res, 'recovered');
    assert.strictEqual(breaker.state, 'CLOSED');
    assert.strictEqual(breaker.failureCount, 0);
  });
});

test('PromptQueue Backpressure & Socket-Level Abort', async (t) => {
  await t.test('enforces maxQueueSize and rejects excess requests immediately', async () => {
    const queue = new PromptQueue({ maxQueueSize: 2 });

    // Block queue with a slow task
    queue.isProcessing = true;

    // Enqueue 2 items (capacity reached)
    const p1 = queue.enqueue({ text: 'task-1' });
    const p2 = queue.enqueue({ text: 'task-2' });

    // 3rd item must be rejected immediately with capacityError
    const overflowResult = await queue.enqueue({ text: 'task-3' });
    assert.strictEqual(overflowResult.success, false);
    assert.strictEqual(overflowResult.capacityError, true);
    assert.ok(overflowResult.error.includes('Queue capacity limit reached'));

    queue.isProcessing = false;
  });

  await t.test('cancels pending task when AbortSignal fires before processing', async () => {
    const queue = new PromptQueue({ maxQueueSize: 5 });
    queue.isProcessing = true; // Hold execution

    const ac = new AbortController();
    const enqueuePromise = queue.enqueue({ text: 'will-abort' }, ac.signal);

    assert.strictEqual(queue.getPendingCount(), 1);

    // Abort socket connection
    ac.abort();

    const result = await enqueuePromise;
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.aborted, true);
    assert.strictEqual(queue.getPendingCount(), 0);

    queue.isProcessing = false;
  });
});

test('MemoryEvictionGuard FIFO/LRU Policy', async (t) => {
  await t.test('evicts oldest entries when collection size exceeds maxItems', () => {
    const guard = new MemoryEvictionGuard({ maxItems: 3 });
    const set = new Set(['id-1', 'id-2', 'id-3', 'id-4', 'id-5']);

    const evicted = guard.evictOldest(set, 3);
    assert.strictEqual(evicted, 2);
    assert.strictEqual(set.size, 3);
    assert.strictEqual(set.has('id-1'), false);
    assert.strictEqual(set.has('id-2'), false);
    assert.strictEqual(set.has('id-3'), true);
    assert.strictEqual(set.has('id-5'), true);
  });
});

test('Surgical Origin Guard (CORS & WebSockets)', async (t) => {
  await t.test('allows local and private IP addresses', () => {
    assert.strictEqual(isLocalOrPrivateIp('localhost'), true);
    assert.strictEqual(isLocalOrPrivateIp('127.0.0.1'), true);
    assert.strictEqual(isLocalOrPrivateIp('192.168.1.105'), true);
    assert.strictEqual(isLocalOrPrivateIp('10.0.0.5'), true);
    assert.strictEqual(isLocalOrPrivateIp('172.20.10.4'), true);
  });

  await t.test('rejects external unauthorized origins', () => {
    assert.strictEqual(isOriginAllowed('https://evil-site.com'), false);
    assert.strictEqual(isOriginAllowed('http://malicious-attacker.org:3000'), false);
    assert.strictEqual(isOriginAllowed('http://localhost:3000'), true);
    assert.strictEqual(isOriginAllowed('http://192.168.1.50:3000'), true);
  });

  await t.test('allows active public tunnel origin', () => {
    const mockTunnelManager = {
      getStatus: () => ({ publicUrl: 'https://my-cool-tunnel.trycloudflare.com' })
    };
    assert.strictEqual(isOriginAllowed('https://my-cool-tunnel.trycloudflare.com', { tunnelManager: mockTunnelManager }), true);
    assert.strictEqual(isOriginAllowed('https://different-tunnel.trycloudflare.com', { tunnelManager: mockTunnelManager }), false);
  });
});

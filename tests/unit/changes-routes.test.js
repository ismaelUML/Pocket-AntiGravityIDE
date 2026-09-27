const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const express = require('express');
const { createChangesRoutes } = require('../../src/interfaces/http/routes/changes.routes');
const { generateToken } = require('../../src/infrastructure/security/pin-auth');

test('Changes Routes: Staged Diff & Mobile Commit Endpoints', async (t) => {
  const app = express();
  app.use(express.json());

  let broadcastCalled = false;
  const mockReviewChanges = {
    getChanges: async () => ({ files: [], hasChanges: false }),
    acceptFile: async (root, f) => ({ success: true, file: f }),
    acceptAll: async () => ({ success: true }),
    rejectFile: async (root, f) => ({ success: true, file: f }),
    rejectAll: async () => ({ success: true }),
    getStagedChanges: async () => ({
      files: [{ file: 'public/index.html', additions: 5, deletions: 1 }],
      hasChanges: true,
      summary: { files: 1, additions: 5, deletions: 1 }
    }),
    getBranchInfo: async () => ({
      branch: 'feature/creative-mobile-ux',
      remote: 'origin',
      hasRemote: true
    }),
    getCommitSuggestion: async () => 'feat(ui): update index.html',
    commitChanges: async (root, { message, push }) => {
      if (!message) return { success: false, error: 'Commit message is required.' };
      return {
        success: true,
        commitHash: 'deadbeef',
        message,
        branch: 'feature/creative-mobile-ux',
        pushed: Boolean(push)
      };
    }
  };

  app.use('/api/changes', createChangesRoutes({
    reviewChangesUseCase: mockReviewChanges,
    onChangesBroadcast: () => { broadcastCalled = true; }
  }));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const validToken = generateToken('1234');

  t.after(() => server.close());

  await t.test('GET /api/changes/staged returns staged files, branch, and suggested commit message', async () => {
    const res = await fetch(`${baseUrl}/api/changes/staged`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.staged.hasChanges, true);
    assert.strictEqual(data.branch.branch, 'feature/creative-mobile-ux');
    assert.strictEqual(data.suggestedMessage, 'feat(ui): update index.html');
  });

  await t.test('POST /api/changes/commit rejects empty message with 400', async () => {
    const res = await fetch(`${baseUrl}/api/changes/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ message: '' })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes('required'));
  });

  await t.test('POST /api/changes/commit commits changes and triggers broadcast', async () => {
    broadcastCalled = false;
    const res = await fetch(`${baseUrl}/api/changes/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ message: 'feat: add commit sheet', push: true })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.commitHash, 'deadbeef');
    assert.strictEqual(data.pushed, true);
    assert.strictEqual(broadcastCalled, true);
  });

  await t.test('GET /api/changes returns workspace changes', async () => {
    const res = await fetch(`${baseUrl}/api/changes`, {
      headers: { 'Authorization': `Bearer ${validToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.hasChanges, false);
  });

  await t.test('POST /api/changes/accept validates file param and accepts all or file', async () => {
    // Malformed file (starts with dash)
    const malformedRes = await fetch(`${baseUrl}/api/changes/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ file: '-invalid-arg' })
    });
    assert.strictEqual(malformedRes.status, 400);

    // Accept single file
    const fileRes = await fetch(`${baseUrl}/api/changes/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ file: 'src/app.js' })
    });
    assert.strictEqual(fileRes.status, 200);
    const fileData = await fileRes.json();
    assert.strictEqual(fileData.file, 'src/app.js');

    // Accept all
    const allRes = await fetch(`${baseUrl}/api/changes/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(allRes.status, 200);
  });

  await t.test('POST /api/changes/reject validates file param and rejects all or file', async () => {
    // Malformed file
    const malformedRes = await fetch(`${baseUrl}/api/changes/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ file: 'bad file name with spaces and *' })
    });
    assert.strictEqual(malformedRes.status, 400);

    // Reject single file
    const fileRes = await fetch(`${baseUrl}/api/changes/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ file: 'src/app.js' })
    });
    assert.strictEqual(fileRes.status, 200);

    // Reject all
    const allRes = await fetch(`${baseUrl}/api/changes/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({})
    });
    assert.strictEqual(allRes.status, 200);
  });
});

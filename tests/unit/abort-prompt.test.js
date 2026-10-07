const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const express = require('express');
const { createPromptRoutes } = require('../../src/interfaces/http/routes/prompt.routes');
const { IdeAutomationPort } = require('../../src/core/ports/ide-automation.port');
const { Win32AutomationAdapter } = require('../../src/infrastructure/automation/win32-automation.adapter');
const { generateToken } = require('../../src/infrastructure/security/pin-auth');

test('Remote Abort & Prompt Routes Suite', async (t) => {
  await t.test('IdeAutomationPort defines abortCurrentTurn interface', async () => {
    const port = new IdeAutomationPort();
    await assert.rejects(
      async () => await port.abortCurrentTurn(),
      { message: 'Method not implemented.' }
    );
  });

  await t.test('Win32AutomationAdapter exposes abortCurrentTurn method', async () => {
    const adapter = new Win32AutomationAdapter();
    assert.strictEqual(typeof adapter.abortCurrentTurn, 'function');
  });

  await t.test('POST /api/prompt/abort successfully invokes ideAutomationPort.abortCurrentTurn', async () => {
    let abortCalled = false;
    const mockIdeAutomation = {
      getChatState: async () => ({ isChatOpen: true, isChatFocused: true }),
      abortCurrentTurn: async () => {
        abortCalled = true;
        return { success: true, message: 'SUCCESS: Ctrl+D injected to Antigravity IDE' };
      }
    };

    const mockUpload = {
      single: () => (_req, _res, next) => next()
    };

    const app = express();
    app.use(express.json());
    app.use('/api/prompt', createPromptRoutes({
      sendPromptUseCase: { execute: async () => ({ success: true }) },
      ideAutomationPort: mockIdeAutomation,
      upload: mockUpload
    }));

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    const token = generateToken('1234');

    try {
      // Intento sin token debe ser rechazado
      const unauthRes = await fetch(`${baseUrl}/api/prompt/abort`, {
        method: 'POST'
      });
      assert.strictEqual(unauthRes.status, 401);

      // Intento con token válido ejecuta el abort
      const authRes = await fetch(`${baseUrl}/api/prompt/abort`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.strictEqual(authRes.status, 200);
      const data = await authRes.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(abortCalled, true);
    } finally {
      server.close();
    }
  });

  await t.test('POST /api/prompt/abort handles execution failure gracefully', async () => {
    const mockIdeAutomation = {
      getChatState: async () => ({ isChatOpen: true, isChatFocused: true }),
      abortCurrentTurn: async () => {
        throw new Error('PowerShell execution failed');
      }
    };

    const mockUpload = {
      single: () => (_req, _res, next) => next()
    };

    const app = express();
    app.use(express.json());
    app.use('/api/prompt', createPromptRoutes({
      sendPromptUseCase: { execute: async () => ({ success: true }) },
      ideAutomationPort: mockIdeAutomation,
      upload: mockUpload
    }));

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    const token = generateToken('1234');

    try {
      const res = await fetch(`${baseUrl}/api/prompt/abort`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assert.strictEqual(res.status, 500);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'PowerShell execution failed');
    } finally {
      server.close();
    }
  });
});

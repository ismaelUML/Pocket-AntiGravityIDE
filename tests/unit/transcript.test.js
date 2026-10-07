const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { listSessions, readTranscript } = require('../../src/infrastructure/transcript/reader');
const TranscriptWatcher = require('../../src/infrastructure/transcript/watcher');

test('Transcript Reader & Watcher Isolation', async (t) => {
  const tmpBrain = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-test-'));

  t.after(() => {
    fs.rmSync(tmpBrain, { recursive: true, force: true });
  });

  const session1 = path.join(tmpBrain, 'session-abc');
  const logsDir = path.join(session1, '.system_generated', 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const transcriptFile = path.join(logsDir, 'transcript.jsonl');
  const step1 = JSON.stringify({ step_index: 0, type: 'USER_INPUT', content: 'Hello Antigravity!' });
  const step2 = JSON.stringify({ step_index: 1, type: 'PLANNER_RESPONSE', content: 'I am here to help.' });
  const step3 = JSON.stringify({
    step_index: 2,
    type: 'PLANNER_RESPONSE',
    content: '',
    tool_calls: [{ name: 'run_command', args: { CommandLine: 'npm test' }, toolSummary: 'Run tests' }],
    status: 'DONE'
  });
  fs.writeFileSync(transcriptFile, `${step1}\n${step2}\n${step3}\n`);

  await t.test('listSessions finds and parses session metadata', () => {
    const sessions = listSessions(tmpBrain);
    assert.strictEqual(sessions.length, 1);
    assert.strictEqual(sessions[0].id, 'session-abc');
    assert.strictEqual(sessions[0].promptSnippet, 'Hello Antigravity!');

    const empty = listSessions(path.join(tmpBrain, 'non-existent-dir'));
    assert.deepStrictEqual(empty, []);
  });

  await t.test('readTranscript loads structured messages from jsonl', async () => {
    const messages = await readTranscript('session-abc', tmpBrain);
    assert.strictEqual(messages.length, 3);
    assert.strictEqual(messages[0].role, 'user');
    assert.strictEqual(messages[0].content, 'Hello Antigravity!');
    assert.strictEqual(messages[1].role, 'assistant');
    assert.strictEqual(messages[1].content, 'I am here to help.');
    assert.strictEqual(messages[2].role, 'assistant');
    assert.strictEqual(messages[2].toolCalls.length, 1);
    assert.strictEqual(messages[2].toolCalls[0].name, 'run_command');

    const notFound = await readTranscript('invalid-session', tmpBrain);
    assert.deepStrictEqual(notFound, []);

    const pathTraversal = await readTranscript('../../../evil', tmpBrain);
    assert.deepStrictEqual(pathTraversal, []);
  });

  await t.test('TranscriptWatcher initializes and starts safely', () => {
    let stepReceived = null;
    const watcher = new TranscriptWatcher({
      brainDir: tmpBrain,
      onNewStep: (id, step) => { stepReceived = { id, step }; }
    });

    watcher.start('session-abc');
    assert.strictEqual(watcher.activeConversationId, 'session-abc');
    assert.strictEqual(typeof watcher.readNewLines, 'function');
    watcher.stop();

    // Auto-detect branch
    const autoWatcher = new TranscriptWatcher({ brainDir: tmpBrain });
    autoWatcher.start();
    assert.strictEqual(autoWatcher.activeConversationId, 'session-abc');
    autoWatcher.stop();

    // Malformed session ID branch
    const badWatcher = new TranscriptWatcher({ brainDir: tmpBrain });
    badWatcher.start('invalid session id with spaces');
    assert.strictEqual(badWatcher.watcher, null);

    // readNewLines edge cases
    autoWatcher.readNewLines(path.join(tmpBrain, 'non-existent-file.jsonl'));
  });
});

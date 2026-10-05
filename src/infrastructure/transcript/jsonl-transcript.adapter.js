const { TranscriptPort } = require('../../core/ports/transcript.port');
const { Session } = require('../../core/domain/session');
const { listSessions, readTranscript, DEFAULT_BRAIN_DIR } = require('./reader');
const { resolveArtifact } = require('./artifact-resolver');
const { TranscriptWatcher } = require('./watcher');
const { TranscriptSessionPort } = require('./transcript-session.port');

function toDomainSession(s) {
  return new Session({ id: s.id, mtime: s.mtime });
}

class JsonlTranscriptAdapter extends TranscriptPort {
  constructor(brainDir = DEFAULT_BRAIN_DIR) {
    super();
    this.brainDir = brainDir;
    this.watcher = null;
    this.onStepCallback = null;
  }

  listSessions() {
    return listSessions(this.brainDir).map(toDomainSession);
  }

  async readTranscript(conversationId) {
    return await readTranscript(conversationId, this.brainDir);
  }

  _emitStep(convId, stepData) {
    if (this.onStepCallback) {
      this.onStepCallback(convId, stepData);
    }
  }

  watchSession(conversationId, onStep) {
    this.onStepCallback = onStep;
    if (!this.watcher) {
      this.watcher = new TranscriptWatcher({
        brainDir: this.brainDir,
        onNewStep: this._emitStep.bind(this)
      });
    }
    this.watcher.start(conversationId);
  }

  readArtifact(conversationId, rawPath, workspaceRoot) {
    return resolveArtifact(conversationId, rawPath, workspaceRoot);
  }
}

module.exports = {
  JsonlTranscriptAdapter,
  DEFAULT_BRAIN_DIR,
  TranscriptSessionPort
};

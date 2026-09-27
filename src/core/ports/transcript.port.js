/**
 * Port (Interface) for Brain transcript logging, session persistence, and artifact reading.
 */
class TranscriptPort {
  listSessions() {
    throw new Error('Method not implemented.');
  }

  async readTranscript(conversationId) {
    throw new Error('Method not implemented.');
  }

  watchSession(conversationId, onStep) {
    throw new Error('Method not implemented.');
  }

  readArtifact(conversationId, rawPath, workspaceRoot) {
    throw new Error('Method not implemented.');
  }
}

module.exports = { TranscriptPort };

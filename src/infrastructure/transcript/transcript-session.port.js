// Contrato para obtención de metadatos y filtrado de sesiones de transcripción.
// Define la abstracción necesaria para desacoplar el listado de sesiones del backend de disco.

class TranscriptSessionPort {
  getSessionMetadata(brainDir, sessionId) {
    throw new Error('Method not implemented');
  }

  filterSessions(sessions, query) {
    throw new Error('Method not implemented');
  }

  getActiveSessionId() {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  TranscriptSessionPort
};

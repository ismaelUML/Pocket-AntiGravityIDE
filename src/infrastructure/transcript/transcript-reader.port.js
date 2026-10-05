// Contrato para lectura y sanitización de sesiones de transcripción.
// Mantiene desacoplado el lector de transcripciones de la infraestructura concreta.

class TranscriptReaderPort {
  listSessions(brainDir) {
    throw new Error('Method not implemented');
  }

  readTranscript(conversationId, brainDir) {
    throw new Error('Method not implemented');
  }

  sanitizeSessionId(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  TranscriptReaderPort
};

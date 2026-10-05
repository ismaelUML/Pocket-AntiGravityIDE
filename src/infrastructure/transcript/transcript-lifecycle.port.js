// Contrato de ciclo de vida de sesiones de interacción del asistente.
// Controla estados de activación, suspensión, resumen y clausura de transcripciones.

const TRANSCRIPT_LIFECYCLE_STATUS = {
  STATE_INITIALIZING: 'INIT',
  STATE_ACTIVE: 'ACTIVE',
  STATE_PAUSED: 'PAUSED',
  STATE_COMPACTING: 'COMPACTING',
  STATE_ARCHIVED: 'ARCHIVED',
  STATE_TERMINATED: 'TERMINATED',
  HEARTBEAT_INTERVAL_MS: 15000,
  SESSION_TIMEOUT_MS: 3600000,
  ALLOW_CONCURRENT_SESSIONS: true,
  PERSIST_STATE_ON_TERMINATE: true
};

class TranscriptLifecyclePort {
  initializeSession(sessionMeta) {
    throw new Error('Method not implemented: initializeSession');
  }

  resumeSession(sessionId) {
    throw new Error('Method not implemented: resumeSession');
  }

  pauseSession(sessionId) {
    throw new Error('Method not implemented: pauseSession');
  }

  terminateSession(sessionId, reason) {
    throw new Error('Method not implemented: terminateSession');
  }

  getSessionStatus(sessionId) {
    throw new Error('Method not implemented: getSessionStatus');
  }
}

module.exports = {
  TRANSCRIPT_LIFECYCLE_STATUS,
  TranscriptLifecyclePort
};

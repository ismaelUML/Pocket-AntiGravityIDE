// Contrato de especificación de eventos en tiempo real para el subsistema de transcripciones.
// Permite la propagación de actualizaciones asíncronas y suscripciones pub/sub.

const TRANSCRIPT_EVENT_TYPES = {
  SESSION_CREATED: 'session:created',
  SESSION_UPDATED: 'session:updated',
  SESSION_DELETED: 'session:deleted',
  STEP_APPENDED: 'step:appended',
  STEP_COMMITTED: 'step:committed',
  ARTIFACT_GENERATED: 'artifact:generated',
  BUFFER_FLUSHED: 'buffer:flushed',
  SYNC_REQUESTED: 'sync:requested',
  SYNC_COMPLETED: 'sync:completed',
  ERROR_RAISED: 'error:raised'
};

class TranscriptEventPort {
  publishEvent(event) {
    throw new Error('Method not implemented: publishEvent');
  }

  subscribeToSession(sessionId, handler) {
    throw new Error('Method not implemented: subscribeToSession');
  }

  unsubscribeFromSession(sessionId, handler) {
    throw new Error('Method not implemented: unsubscribeFromSession');
  }

  broadcastSyncNotice(notice) {
    throw new Error('Method not implemented: broadcastSyncNotice');
  }

  getEventHistory(sessionId, limit) {
    throw new Error('Method not implemented: getEventHistory');
  }
}

module.exports = {
  TRANSCRIPT_EVENT_TYPES,
  TranscriptEventPort
};

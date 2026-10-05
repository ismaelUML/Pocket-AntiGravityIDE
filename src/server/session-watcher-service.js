// Servicio de observación reactiva de sesiones para el servidor.
const { watchSessionTranscript } = require('./session-step-listener');
const { initKnownSessionIds } = require('./session-memory-pruner');

class SessionWatcherService {
  constructor({ manageSessionsUseCase, memoryGuard, getWsHandler }) {
    this.manageSessionsUseCase = manageSessionsUseCase;
    this.memoryGuard = memoryGuard;
    this.getWsHandler = getWsHandler;

    const initialSessions = this.manageSessionsUseCase.listSessions();
    this.knownSessionIds = initKnownSessionIds(initialSessions);
    const firstSession = initialSessions[0];
    this.activeConversationId = firstSession ? firstSession.id : null;
  }

  getActiveConversationId() {
    return this.activeConversationId;
  }

  setActiveConversationId(newId) {
    this.activeConversationId = newId;
    if (newId && newId !== 'NEW_PENDING_SESSION') {
      this.knownSessionIds.add(newId);
    }
    this.startSessionWatcher(newId);
  }

  startSessionWatcher(sessionId) {
    watchSessionTranscript(this.manageSessionsUseCase, sessionId, this.getWsHandler);
  }

  notifyAutoSwitched(newId) {
    this.setActiveConversationId(newId);
    const wsHandler = this.getWsHandler();
    if (wsHandler) {
      wsHandler.broadcast({
        type: 'SESSION_AUTO_SWITCHED',
        conversationId: this.activeConversationId
      });
    }
  }
}

module.exports = {
  SessionWatcherService
};

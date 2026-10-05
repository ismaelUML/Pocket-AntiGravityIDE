// Detección periódica en segundo plano de sesiones nuevas en disco.
const { pruneAndEvict } = require('./session-memory-pruner');

function detectBrandNewSession(sessions, knownSessionIds) {
  for (const s of sessions) {
    if (!knownSessionIds.has(s.id)) {
      return s;
    }
  }
  return null;
}

function checkDiskSessions(service) {
  const sessions = service.manageSessionsUseCase.listSessions();
  const currentIds = new Set(sessions.map((s) => s.id));
  pruneAndEvict(service.knownSessionIds, currentIds, service.memoryGuard);

  const brandNew = detectBrandNewSession(sessions, service.knownSessionIds);
  if (!brandNew) return;

  service.knownSessionIds.add(brandNew.id);
  service.notifyAutoSwitched(brandNew.id);
}

function startAutoDetection(service, intervalMs = 1000) {
  if (service.activeConversationId) {
    service.startSessionWatcher(service.activeConversationId);
  }
  return setInterval(() => {
    checkDiskSessions(service);
  }, intervalMs);
}

module.exports = {
  startAutoDetection,
  checkDiskSessions,
  detectBrandNewSession
};

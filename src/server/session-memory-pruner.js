// Poda y desalojo de identificadores de sesión en memoria.

function pruneAndEvict(knownSessionIds, currentIds, memoryGuard) {
  for (const id of knownSessionIds) {
    if (!currentIds.has(id)) {
      knownSessionIds.delete(id);
    }
  }
  memoryGuard.evictOldest(knownSessionIds, 100);
}

function initKnownSessionIds(sessions) {
  const ids = new Set();
  for (const s of sessions) {
    ids.add(s.id);
  }
  return ids;
}

module.exports = {
  pruneAndEvict,
  initKnownSessionIds
};

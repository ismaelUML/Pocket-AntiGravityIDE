// Controlador de telemetría, estadísticas de memoria y conteo de clientes activos.

function resolveActiveId(getActiveSessionId) {
  if (getActiveSessionId) return getActiveSessionId();
  return null;
}

function resolveClientCount(getClientCount) {
  if (getClientCount) return getClientCount();
  return 0;
}

function handleStats(getActiveSessionId, getClientCount, res) {
  const heap = process.memoryUsage().heapUsed;
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    activeConversationId: resolveActiveId(getActiveSessionId),
    clientCount: resolveClientCount(getClientCount),
    memoryUsageMb: Math.round(heap / 1024 / 1024)
  });
}

module.exports = {
  handleStats,
  resolveActiveId,
  resolveClientCount
};

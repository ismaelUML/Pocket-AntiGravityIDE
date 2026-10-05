// Validador y saneador de configuración de Pocket.
// Aísla la verificación de rangos numéricos y normalización de credenciales.

function sanitizePort(portInput, fallbackPort) {
  const p = Number.parseInt(portInput, 10);
  if (p >= 1 && p <= 65535) {
    return p;
  }
  return fallbackPort;
}

function mergeConfigUpdates(current, updates = {}) {
  const next = { ...current, ...updates };

  if (updates.pin !== undefined) {
    next.pin = String(updates.pin).trim();
  }
  if (updates.port !== undefined) {
    next.port = sanitizePort(updates.port, current.port);
  }

  return next;
}

module.exports = {
  sanitizePort,
  mergeConfigUpdates
};

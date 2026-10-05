// Constructor de objetos de actualización de configuración del sistema.

function handleSleepUpdate(preventSleep, updates, systemDoctor) {
  if (preventSleep === undefined) return;
  const active = Boolean(preventSleep);
  updates.preventSleep = active;
  systemDoctor.setKeepAwake(active);
}

function assignBasicFields(body, updates) {
  if (body.pin !== undefined) updates.pin = body.pin;
  if (body.port !== undefined) updates.port = body.port;
}

function assignPersonaField(body, updates) {
  if (body.defaultPersona !== undefined) {
    updates.defaultPersona = body.defaultPersona;
  }
}

function buildConfigUpdates(body, systemDoctor) {
  const updates = {};
  if (!body) return updates;
  assignBasicFields(body, updates);
  assignPersonaField(body, updates);
  handleSleepUpdate(body.preventSleep, updates, systemDoctor);
  return updates;
}

module.exports = {
  buildConfigUpdates,
  assignBasicFields,
  assignPersonaField,
  handleSleepUpdate
};

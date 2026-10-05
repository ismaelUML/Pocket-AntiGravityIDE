// Servicio auxiliar de persistencia y deserialización para el catálogo de personas.
// Aísla la interacción con el ConfigPort para mantener el caso de uso por debajo del techo de complejidad.

const { Persona } = require('../domain/persona');

function sanitizePersonaData(data = {}) {
  const name = data.name?.trim?.();
  if (!name) return null;

  return new Persona({
    id: `custom_${Date.now()}`,
    name,
    icon: data.icon?.trim?.() || '🤖',
    description: data.description?.trim?.() || '',
    systemPromptPrefix: data.systemPromptPrefix?.trim?.() || '',
    slashCommand: data.slashCommand?.trim?.() || null
  });
}

function persistPersonas(configPort, personas) {
  if (typeof configPort?.saveConfig !== 'function') {
    return { persisted: false };
  }
  try {
    configPort.saveConfig({ personas });
    return { persisted: true };
  } catch (err) {
    return { error: err.message };
  }
}

function loadStoredPersonas(configPort) {
  try {
    const config = configPort?.loadConfig?.();
    if (Array.isArray(config?.personas)) {
      return config.personas.map(p => new Persona(p));
    }
  } catch (_) {}
  return [];
}

module.exports = {
  sanitizePersonaData,
  persistPersonas,
  loadStoredPersonas
};

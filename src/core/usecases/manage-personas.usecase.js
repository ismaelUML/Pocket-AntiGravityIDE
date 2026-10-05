// Caso de uso: Gestión de Personas y Roles de IA.
// Cero fs, cero path, cero llamadas directas al disco acá:
// todo se hace pasando por el puerto de configuración inyectado (ConfigPort).
const { BUILT_IN_PERSONAS } = require('../domain/persona');
const { ManagePersonasPort } = require('./usecase.port');
const {
  sanitizePersonaData,
  persistPersonas,
  loadStoredPersonas
} = require('./persona-storage.service');

class ManagePersonasUseCase extends ManagePersonasPort {
  constructor(configPort = null) {
    super();
    this.configPort = configPort;
    this.customPersonas = this.loadCustomPersonas();
  }

  loadCustomPersonas() {
    return loadStoredPersonas(this.configPort);
  }

  getPersonas() {
    return [...BUILT_IN_PERSONAS, ...this.customPersonas];
  }

  getPersonaById(id) {
    const all = this.getPersonas();
    return all.find(p => p.id === id) || BUILT_IN_PERSONAS[0];
  }

  saveCustomPersona(data = {}) {
    const newPersona = sanitizePersonaData(data);
    if (!newPersona) {
      return { success: false, error: 'Persona name is required.' };
    }

    this.customPersonas.push(newPersona);
    const saveResult = persistPersonas(this.configPort, this.customPersonas);
    if (saveResult.error) {
      return { success: false, error: saveResult.error };
    }

    return { success: true, persona: newPersona, persisted: saveResult.persisted };
  }
}

module.exports = { ManagePersonasUseCase };

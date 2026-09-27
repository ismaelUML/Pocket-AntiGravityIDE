// Caso de uso: Gestión de Personas y Roles de IA.
// Cero fs, cero path, cero llamadas directas al disco acá:
// todo se hace pasando por el puerto de configuración inyectado (ConfigPort).
// Así el caso de uso es 100% testeable en memoria sin tocar un solo archivo real.
const { Persona, BUILT_IN_PERSONAS } = require('../domain/persona');

class ManagePersonasUseCase {
  constructor(configPort = null) {
    this.configPort = configPort;
    this.customPersonas = this.loadCustomPersonas();
  }

  loadCustomPersonas() {
    if (!this.configPort || typeof this.configPort.loadConfig !== 'function') {
      return [];
    }

    try {
      const config = this.configPort.loadConfig();
      if (Array.isArray(config && config.personas)) {
        return config.personas.map(p => new Persona(p));
      }
    } catch (_) {
      // Si la carga falla por cualquier rareza en el puerto, no volteamos la app;
      // arrancamos limpios con las personas built-in de fábrica.
    }
    return [];
  }

  getPersonas() {
    return [...BUILT_IN_PERSONAS, ...this.customPersonas];
  }

  getPersonaById(id) {
    const all = this.getPersonas();
    return all.find(p => p.id === id) || BUILT_IN_PERSONAS[0];
  }

  saveCustomPersona({ name, icon = '🤖', description = '', systemPromptPrefix = '', slashCommand = null }) {
    if (!name || !name.trim()) {
      return { success: false, error: 'Persona name is required.' };
    }

    const id = `custom_${Date.now()}`;
    const newPersona = new Persona({
      id,
      name: name.trim(),
      icon: (icon && icon.trim()) || '🤖',
      description: (description && description.trim()) || '',
      systemPromptPrefix: (systemPromptPrefix && systemPromptPrefix.trim()) || '',
      slashCommand: slashCommand ? slashCommand.trim() : null
    });

    this.customPersonas.push(newPersona);

    if (!this.configPort || typeof this.configPort.saveConfig !== 'function') {
      return { success: true, persona: newPersona, persisted: false };
    }

    try {
      this.configPort.saveConfig({ personas: this.customPersonas });
      return { success: true, persona: newPersona, persisted: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { ManagePersonasUseCase };

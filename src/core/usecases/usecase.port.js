// Contratos base y puertos para los Casos de Uso del núcleo del dominio.
// Garantiza la segregación de responsabilidades y la abstracción arquitectónica de Robert C. Martin.

class UseCasePort {
  execute(...args) {
    throw new Error('Method not implemented');
  }
}

class ManagePersonasPort {
  getPersonas() {
    throw new Error('Method not implemented');
  }

  getPersonaById(id) {
    throw new Error('Method not implemented');
  }

  saveCustomPersona(data) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  UseCasePort,
  ManagePersonasPort
};

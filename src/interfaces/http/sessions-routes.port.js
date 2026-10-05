// Contratos para endpoints HTTP de sesiones, prompts y catálogo de personas.

class SessionsRoutesPort {
  handleList(_req, _res) {
    throw new Error('SessionsRoutesPort.handleList must be implemented');
  }

  handleGet(_req, _res) {
    throw new Error('SessionsRoutesPort.handleGet must be implemented');
  }

  handleSwitch(_req, _res) {
    throw new Error('SessionsRoutesPort.handleSwitch must be implemented');
  }

  handleNew(_req, _res) {
    throw new Error('SessionsRoutesPort.handleNew must be implemented');
  }
}

class PromptRoutesPort {
  handlePostPrompt(_req, _res) {
    throw new Error('PromptRoutesPort.handlePostPrompt must be implemented');
  }

  handleGetStatus(_req, _res) {
    throw new Error('PromptRoutesPort.handleGetStatus must be implemented');
  }
}

class PersonasRoutesPort {
  handleListPersonas(_req, _res) {
    throw new Error('PersonasRoutesPort.handleListPersonas must be implemented');
  }

  handleGetActivePersona(_req, _res) {
    throw new Error('PersonasRoutesPort.handleGetActivePersona must be implemented');
  }
}

module.exports = {
  SessionsRoutesPort,
  PromptRoutesPort,
  PersonasRoutesPort
};

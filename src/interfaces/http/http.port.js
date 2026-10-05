// Fachada unificada de contratos de interfaces HTTP y middlewares.
// Re-exporta los puertos especializados preservando compatibilidad completa.

const { SystemRoutesPort } = require('./system-routes.port');
const { ChangesRoutesPort, WorkspaceRoutesPort } = require('./changes-routes.port');
const { SessionsRoutesPort, PromptRoutesPort, PersonasRoutesPort } = require('./sessions-routes.port');
const {
  HttpRoutesFactoryPort,
  AuthRoutesPort,
  AuthMiddlewarePort,
  HttpErrorHandlingPort
} = require('./http-middleware.port');

module.exports = {
  HttpRoutesFactoryPort,
  AuthRoutesPort,
  ChangesRoutesPort,
  SystemRoutesPort,
  WorkspaceRoutesPort,
  SessionsRoutesPort,
  PromptRoutesPort,
  PersonasRoutesPort,
  AuthMiddlewarePort,
  HttpErrorHandlingPort
};

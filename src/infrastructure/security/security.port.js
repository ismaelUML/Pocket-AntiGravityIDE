// Contratos abstractos para seguridad, autenticación y restricción de orígenes.
// Re-exporta los contratos segregados para mantener compatibilidad total de interfaces.
const { OriginGuardPort } = require('./origin-guard.port');
const { TokenAuthenticatorPort, LockoutTrackerPort } = require('./token-auth.port');

module.exports = {
  TokenAuthenticatorPort,
  LockoutTrackerPort,
  OriginGuardPort
};

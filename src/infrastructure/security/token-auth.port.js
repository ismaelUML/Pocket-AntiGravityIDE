// Contratos abstractos para autenticación y control de intentos fallidos.

class TokenAuthenticatorPort {
  loadConfig() {
    throw new Error('TokenAuthenticatorPort.loadConfig: Method not implemented');
  }

  saveConfig(updates) {
    throw new Error('TokenAuthenticatorPort.saveConfig: Method not implemented');
  }

  generateToken(pin) {
    throw new Error('TokenAuthenticatorPort.generateToken: Method not implemented');
  }

  validateToken(token) {
    throw new Error('TokenAuthenticatorPort.validateToken: Method not implemented');
  }

  verifyHmac(pin, timestamp, actualHmac) {
    throw new Error('TokenAuthenticatorPort.verifyHmac: Method not implemented');
  }
}

class LockoutTrackerPort {
  recordFailedAttempt() {
    throw new Error('LockoutTrackerPort.recordFailedAttempt: Method not implemented');
  }

  resetFailedAttempts() {
    throw new Error('LockoutTrackerPort.resetFailedAttempts: Method not implemented');
  }

  isRateLimited() {
    throw new Error('LockoutTrackerPort.isRateLimited: Method not implemented');
  }

  getRemainingLockoutSeconds() {
    throw new Error('LockoutTrackerPort.getRemainingLockoutSeconds: Method not implemented');
  }
}

module.exports = {
  TokenAuthenticatorPort,
  LockoutTrackerPort
};

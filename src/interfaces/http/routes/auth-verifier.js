// Lógica de verificación de PIN y control de respuestas de tasa limitada.
const {
  loadConfig,
  isRateLimited
} = require('../../../infrastructure/security/pin-auth');
const {
  handleRateLimit,
  handleSuccessfulVerify,
  handleFailedVerify
} = require('./auth-response-builder');

function isPinMatching(configPin, inputPin) {
  if (!configPin) return true;
  return inputPin === String(configPin);
}

function extractInputPin(body) {
  const raw = body?.pin;
  if (!raw) return '';
  return String(raw).trim();
}

function verifyPinAttempt(body, res) {
  if (isRateLimited()) {
    return handleRateLimit(res);
  }

  const config = loadConfig();
  const inputPin = extractInputPin(body);

  if (isPinMatching(config.pin, inputPin)) {
    return handleSuccessfulVerify(config.pin, res);
  }

  return handleFailedVerify(res);
}

module.exports = {
  verifyPinAttempt,
  isPinMatching,
  extractInputPin
};

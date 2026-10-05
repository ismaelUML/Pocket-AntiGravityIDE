// Seguridad liviana para acceso remoto desde el celular.
// Aísla la gestión de PIN y orquesta la validación de tokens y políticas de bloqueo.
const { JsonConfigAdapter, DEFAULT_CONFIG_PATH } = require('../config/json-config.adapter');
const { SERVER_SECRET, generateToken } = require('./token-generator');
const { MAX_TOKEN_AGE_MS, parseToken, isTokenFresh, verifyHmac } = require('./token-verifier');
const {
  MAX_FAILED_ATTEMPTS,
  isRateLimited,
  getRemainingLockoutSeconds,
  recordFailedAttempt,
  resetFailedAttempts
} = require('./lockout-tracker');

const configAdapter = new JsonConfigAdapter(DEFAULT_CONFIG_PATH);

function loadConfig() {
  const config = configAdapter.loadConfig();
  if (config.pin === '1234') {
    console.warn('⚠️  [Security Warning] Using default PIN "1234". Set a custom PIN in pocket.config.json for secure remote access.');
  }
  return config;
}

function saveConfig(updates) {
  return configAdapter.saveConfig(updates);
}

function validateToken(token) {
  const config = loadConfig();
  if (!config.pin) return true;
  if (!token) return false;

  const parsed = parseToken(token);
  if (!parsed) return false;
  if (parsed.pin !== String(config.pin)) return false;
  if (!isTokenFresh(parsed.timestamp)) return false;

  return verifyHmac(parsed.pin, parsed.timestamp, parsed.hmac);
}

module.exports = {
  loadConfig,
  saveConfig,
  generateToken,
  validateToken,
  recordFailedAttempt,
  resetFailedAttempts,
  isRateLimited,
  getRemainingLockoutSeconds,
  MAX_TOKEN_AGE_MS,
  MAX_FAILED_ATTEMPTS,
  SERVER_SECRET
};

// Seguridad liviana para acceso remoto desde el celular.
// Cero bases de datos ni servicios en la nube para autenticar una herramienta personal de escritorio:
// usamos un token HMAC firmado con un secreto aleatorio generado en memoria (SERVER_SECRET).
// Ventajas: ultra rápido, cero archivos residuales y si reinicias el servidor, todas las sesiones
// activas mueren al instante.
// Además: 5 intentos fallidos activan un bloqueo de 5 minutos para que nadie en una red Wi-Fi
// compartida intente adivinar el PIN de 4 dígitos por fuerza bruta.
const crypto = require('crypto');
const { JsonConfigAdapter, DEFAULT_CONFIG_PATH } = require('../config/json-config.adapter');

const configAdapter = new JsonConfigAdapter(DEFAULT_CONFIG_PATH);
const SERVER_SECRET = crypto.randomBytes(32).toString('hex');

// Token Validity: 24 Hours
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;

// Rate-limiting configuration for brute-force protection
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let failedAttempts = 0;
let lockoutUntil = 0;

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

function isRateLimited() {
  if (Date.now() < lockoutUntil) return true;
  if (lockoutUntil && Date.now() >= lockoutUntil) {
    failedAttempts = 0;
    lockoutUntil = 0;
  }
  return false;
}

function getRemainingLockoutSeconds() {
  if (!isRateLimited()) return 0;
  return Math.ceil((lockoutUntil - Date.now()) / 1000);
}

function recordFailedAttempt() {
  failedAttempts++;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  return {
    failedAttempts,
    isLocked: failedAttempts >= MAX_FAILED_ATTEMPTS,
    remainingSeconds: getRemainingLockoutSeconds()
  };
}

function resetFailedAttempts() {
  failedAttempts = 0;
  lockoutUntil = 0;
}

function generateToken(pin) {
  const payload = `${pin}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

// Desarmamos el payload del token base64 en sus 3 partes.
// Si alguien manda basura o caracteres no imprimibles, cortamos aca nomas.
function parseToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    return {
      pin: parts[0],
      timestamp: Number(parts[1]),
      hmac: parts.slice(2).join(':')
    };
  } catch (_) {
    return null;
  }
}

// Validamos edad del token.
// Dejamos 1 minuto de changüí por si el reloj del celular esta ligeramente desfasado con la PC.
function isTokenFresh(timestamp) {
  if (isNaN(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age <= MAX_TOKEN_AGE_MS && age >= -60000;
}

// Comprobación criptográfica de tiempo constante.
// Previene ataques de timing donde miden microsegundos para adivinar el HMAC caracter por caracter.
function verifyHmac(pin, timestamp, actualHmac) {
  try {
    const expected = crypto.createHmac('sha256', SERVER_SECRET).update(`${pin}:${timestamp}`).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(actualHmac, 'utf8');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (_) {
    return false;
  }
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

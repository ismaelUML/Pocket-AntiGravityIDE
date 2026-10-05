// Verificación criptográfica en tiempo constante y validación temporal de tokens.
const crypto = require('crypto');
const { SERVER_SECRET } = require('./token-generator');

const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000;

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

function isTokenFresh(timestamp) {
  if (Number.isNaN(timestamp)) return false;
  const age = Date.now() - timestamp;
  if (age < -60000) return false;
  return age <= MAX_TOKEN_AGE_MS;
}

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

module.exports = {
  MAX_TOKEN_AGE_MS,
  parseToken,
  isTokenFresh,
  verifyHmac
};

// Generación criptográfica de tokens firmados HMAC para Pocket.
const crypto = require('crypto');

const SERVER_SECRET = crypto.randomBytes(32).toString('hex');

function generateToken(pin) {
  const payload = `${pin}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', SERVER_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

module.exports = {
  SERVER_SECRET,
  generateToken
};

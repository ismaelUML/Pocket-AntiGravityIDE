// Middleware Express para autenticación por PIN en rutas HTTP protegidas.
const { loadConfig, validateToken } = require('../../../infrastructure/security/pin-auth');

function _extractRawAuth(req) {
  const hAuth = req.headers?.authorization;
  if (hAuth) return hAuth;

  const hPocket = req.headers?.['x-pocket-token'];
  if (hPocket) return hPocket;

  return req.query?.token;
}

function _parseToken(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  if (str.startsWith('Bearer ')) {
    return str.substring(7).trim();
  }
  return str;
}

function requireAuth(req, res, next) {
  const config = loadConfig();
  if (!config.pin) return next();

  const raw = _extractRawAuth(req);
  const token = _parseToken(raw);
  if (validateToken(token)) return next();

  return res.status(401).json({
    success: false,
    authRequired: true,
    error: 'Unauthorized: Invalid or expired security PIN session.'
  });
}

module.exports = {
  requireAuth,
  _extractRawAuth,
  _parseToken
};

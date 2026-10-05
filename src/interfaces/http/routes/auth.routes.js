// Rutas de autenticación y verificación de PIN de acceso.
const express = require('express');
const {
  loadConfig,
  isRateLimited,
  getRemainingLockoutSeconds
} = require('../../../infrastructure/security/pin-auth');
const { verifyPinAttempt } = require('./auth-verifier');

function handleAuthStatus(req, res) {
  const config = loadConfig();
  res.json({
    authRequired: Boolean(config.pin),
    isRateLimited: isRateLimited(),
    remainingLockoutSeconds: getRemainingLockoutSeconds()
  });
}

function handleVerifyPin(req, res) {
  return verifyPinAttempt(req.body, res);
}

function createAuthRoutes() {
  const router = express.Router();
  router.get('/status', handleAuthStatus);
  router.post('/verify', handleVerifyPin);
  return router;
}

module.exports = {
  createAuthRoutes,
  handleAuthStatus,
  handleVerifyPin
};

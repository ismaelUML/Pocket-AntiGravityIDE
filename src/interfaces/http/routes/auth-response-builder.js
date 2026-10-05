// Generador de respuestas HTTP para autenticación exitosa, fallida o bloqueada por tasa.
const {
  generateToken,
  recordFailedAttempt,
  resetFailedAttempts,
  getRemainingLockoutSeconds,
  MAX_FAILED_ATTEMPTS
} = require('../../../infrastructure/security/pin-auth');

function handleRateLimit(res) {
  const remaining = getRemainingLockoutSeconds();
  return res.status(429).json({
    success: false,
    isLocked: true,
    error: `Too many failed attempts. Try again in ${remaining} seconds.`
  });
}

function handleSuccessfulVerify(configPin, res) {
  resetFailedAttempts();
  const tokenPayload = configPin || 'OPEN';
  const token = generateToken(tokenPayload);
  return res.json({
    success: true,
    token
  });
}

function handleFailedVerify(res) {
  const attempt = recordFailedAttempt();
  if (attempt.isLocked) {
    return res.status(429).json({
      success: false,
      isLocked: true,
      error: `Too many failed attempts. Locked for ${attempt.remainingSeconds} seconds.`
    });
  }

  const remaining = MAX_FAILED_ATTEMPTS - attempt.failedAttempts;
  return res.status(401).json({
    success: false,
    isLocked: false,
    remainingAttempts: remaining,
    error: `Incorrect PIN. Access denied (${remaining} attempts left).`
  });
}

module.exports = {
  handleRateLimit,
  handleSuccessfulVerify,
  handleFailedVerify
};

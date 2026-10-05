// Control de intentos fallidos y bloqueo temporal por fuerza bruta.

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

let failedAttempts = 0;
let lockoutUntil = 0;

function resetFailedAttempts() {
  failedAttempts = 0;
  lockoutUntil = 0;
}

function isRateLimited() {
  if (Date.now() < lockoutUntil) return true;
  if (lockoutUntil > 0) {
    resetFailedAttempts();
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

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  isRateLimited,
  getRemainingLockoutSeconds,
  recordFailedAttempt,
  resetFailedAttempts
};

// Validaciones de parámetros de archivos y mensajes para rutas de cambios VCS.

const SAFE_PATH_PATTERN = /^[a-zA-Z0-9_\-./\\]+$/;
const STATUS_CODE_MAP = { true: 200, false: 500 };
const COMMIT_STATUS_MAP = { true: 200, false: 400 };

function isInvalidFileParam(file) {
  if (typeof file !== 'string') return true;
  if (file.startsWith('-')) return true;
  return !SAFE_PATH_PATTERN.test(file);
}

function validateFileParam(file) {
  if (!file) return true;
  return !isInvalidFileParam(file);
}

function validateCommitMessage(message) {
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  if (!trimmed) return null;
  return trimmed;
}

module.exports = {
  isInvalidFileParam,
  validateFileParam,
  validateCommitMessage,
  STATUS_CODE_MAP,
  COMMIT_STATUS_MAP
};

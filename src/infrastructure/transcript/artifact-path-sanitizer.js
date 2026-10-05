// Sanitización de rutas y validación de contención en sandbox para artefactos.
// Previene ataques de escape de directorio (Directory Traversal).

const path = require('path');

function sanitizePath(rawPath) {
  const input = rawPath ? String(rawPath) : '';
  const decoded = decodeURIComponent(input).trim();
  const withoutProtocol = decoded.replace(/^file:\/\/\/?/, '');
  const cleanDrive = withoutProtocol.replace(/^\/([a-zA-Z]:)/, '$1');
  return path.normalize(cleanDrive);
}

function isInsideAllowedDirectory(targetPath, allowedDir) {
  if (!targetPath || !allowedDir) return false;
  const rel = path.relative(path.resolve(allowedDir), path.resolve(targetPath));
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

module.exports = {
  sanitizePath,
  isInsideAllowedDirectory
};

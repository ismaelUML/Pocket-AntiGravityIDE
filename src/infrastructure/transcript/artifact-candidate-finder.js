// Localización defensiva de archivos candidatos dentro del sandbox permitido.
// Resuelve rutas de sesión y de workspace sin escapar del sandbox.

const fs = require('fs');
const { DEFAULT_BRAIN_DIR } = require('./session-lister');
const { isInsideAllowedDirectory } = require('./artifact-path-sanitizer');
const { buildCandidatePaths } = require('./artifact-path-candidates');

function isCandidateRegularFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile();
  } catch (_) {
    return false;
  }
}

function isCandidateSandboxed(filePath, workspaceRoot) {
  if (isInsideAllowedDirectory(filePath, DEFAULT_BRAIN_DIR)) return true;
  return Boolean(workspaceRoot && isInsideAllowedDirectory(filePath, workspaceRoot));
}

function findExistingSandboxFile(candidates, workspaceRoot) {
  for (const cand of candidates) {
    if (isCandidateRegularFile(cand) && isCandidateSandboxed(cand, workspaceRoot)) {
      return cand;
    }
  }
  return null;
}

module.exports = {
  buildCandidatePaths,
  findExistingSandboxFile
};

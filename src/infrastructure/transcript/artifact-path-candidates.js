// Generador de rutas candidatas para resolución de artefactos de sesión y workspace.

const path = require('path');
const { DEFAULT_BRAIN_DIR } = require('./session-lister');

function appendBrainCandidates(candidates, cleanPath, convId) {
  if (convId && convId !== 'NEW_PENDING_SESSION') {
    candidates.push(path.join(DEFAULT_BRAIN_DIR, convId, path.basename(cleanPath)));
    candidates.push(path.join(DEFAULT_BRAIN_DIR, convId, cleanPath));
  }
}

function appendWorkspaceCandidates(candidates, cleanPath, workspaceRoot) {
  if (workspaceRoot) {
    candidates.push(path.join(workspaceRoot, cleanPath));
    candidates.push(path.join(workspaceRoot, path.basename(cleanPath)));
  }
}

function buildCandidatePaths(cleanPath, convId, workspaceRoot) {
  const candidates = [];
  appendBrainCandidates(candidates, cleanPath, convId);
  appendWorkspaceCandidates(candidates, cleanPath, workspaceRoot);

  if (path.isAbsolute(cleanPath)) {
    candidates.push(cleanPath);
  }

  return candidates;
}

module.exports = {
  buildCandidatePaths
};

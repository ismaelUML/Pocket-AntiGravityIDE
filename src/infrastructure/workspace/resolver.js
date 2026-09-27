// Resolución automática del proyecto activo con CC <= 5 por función.
// A ningún desarrollador le gusta escribir rutas absolutas kilométricas de Windows a mano.
// Este módulo rastrea las entrañas de Antigravity para adivinar qué carpeta tienes abierta en el editor.
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../security/pin-auth');

const DEFAULT_WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

// Chromium en Windows guarda las rutas como "file:///c%3A/Users/...".
// Limpiamos los slashes y reemplazamos el %3A por dos puntos reales o fs.existsSync revienta.
function decodeChromiumWorkspaceFolder(rawFolder) {
  if (!rawFolder || !rawFolder.startsWith('file:')) return null;

  try {
    let decoded = decodeURIComponent(rawFolder.replace(/^file:\/\/\/?/, ''));
    decoded = decoded.replace(/^([a-zA-Z])%3A/i, '$1:');
    return path.resolve(decoded);
  } catch (_) {
    return null;
  }
}

function parseWorkspaceStorageFile(wsFile) {
  try {
    if (!fs.existsSync(wsFile)) return null;
    const stat = fs.statSync(wsFile);
    const data = JSON.parse(fs.readFileSync(wsFile, 'utf8'));
    const folder = decodeChromiumWorkspaceFolder(data.folder);

    if (folder && fs.existsSync(folder)) {
      return {
        folder,
        mtime: stat.mtimeMs,
        isGit: fs.existsSync(path.join(folder, '.git'))
      };
    }
  } catch (_) {}
  return null;
}

function discoverAutoWorkspaceCandidates(storageDir) {
  if (!storageDir || !fs.existsSync(storageDir)) return [];

  const candidates = [];
  try {
    const folders = fs.readdirSync(storageDir);
    for (const f of folders) {
      const candidate = parseWorkspaceStorageFile(path.join(storageDir, f, 'workspace.json'));
      if (candidate) candidates.push(candidate);
    }
    candidates.sort((a, b) => b.mtime - a.mtime);
  } catch (_) {}

  return candidates;
}

function getActiveWorkspaceRoot() {
  const config = loadConfig();
  if (config.workspaceRoot && config.workspaceRoot !== 'auto' && fs.existsSync(config.workspaceRoot)) {
    return path.resolve(config.workspaceRoot);
  }

  if (config.workspaceRoot === 'auto') {
    const storageDir = path.join(process.env.APPDATA || '', 'Antigravity IDE', 'User', 'workspaceStorage');
    const candidates = discoverAutoWorkspaceCandidates(storageDir);
    const gitCandidate = candidates.find(c => c.isGit);
    if (gitCandidate) return gitCandidate.folder;
    if (candidates.length > 0) return candidates[0].folder;
  }

  return DEFAULT_WORKSPACE_ROOT;
}

module.exports = {
  getActiveWorkspaceRoot,
  DEFAULT_WORKSPACE_ROOT,
  decodeChromiumWorkspaceFolder,
  parseWorkspaceStorageFile,
  discoverAutoWorkspaceCandidates
};

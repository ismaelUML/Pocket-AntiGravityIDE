// Decodificación de carpetas de Chromium y lectura del almacenamiento de Antigravity.
const fs = require('fs');
const path = require('path');

function decodeChromiumWorkspaceFolder(rawFolder) {
  if (!rawFolder?.startsWith?.('file:')) return null;

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
    const stat = fs.statSync(wsFile);
    const data = JSON.parse(fs.readFileSync(wsFile, 'utf8'));
    const folder = decodeChromiumWorkspaceFolder(data.folder);
    fs.statSync(folder);

    return {
      folder,
      mtime: stat.mtimeMs,
      isGit: fs.existsSync(path.join(folder, '.git'))
    };
  } catch (_) {
    return null;
  }
}

function parseCandidateEntry(storageDir, folderName) {
  return parseWorkspaceStorageFile(path.join(storageDir, folderName, 'workspace.json'));
}

function discoverAutoWorkspaceCandidates(storageDir) {
  try {
    const folders = fs.readdirSync(storageDir);
    return folders
      .map(f => parseCandidateEntry(storageDir, f))
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime);
  } catch (_) {
    return [];
  }
}

module.exports = {
  decodeChromiumWorkspaceFolder,
  parseWorkspaceStorageFile,
  discoverAutoWorkspaceCandidates
};

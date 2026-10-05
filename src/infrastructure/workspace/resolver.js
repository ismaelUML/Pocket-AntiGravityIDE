// Resolución automática del proyecto activo con CC <= 5 por función.
const path = require('path');
const { loadConfig } = require('../security/pin-auth');
const {
  decodeChromiumWorkspaceFolder,
  parseWorkspaceStorageFile,
  discoverAutoWorkspaceCandidates
} = require('./chromium-storage-parser');
const {
  resolveCustomRoot,
  resolveAutoRoot
} = require('./workspace-root-selector');
const { WorkspaceResolverPort } = require('./workspace.port');

const DEFAULT_WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

function getActiveWorkspaceRoot() {
  const config = loadConfig();
  const custom = resolveCustomRoot(config.workspaceRoot);
  if (custom) return custom;

  const storageDir = path.join(process.env.APPDATA, 'Antigravity IDE', 'User', 'workspaceStorage');
  const auto = resolveAutoRoot(config.workspaceRoot, discoverAutoWorkspaceCandidates(storageDir));
  if (auto) return auto;

  return DEFAULT_WORKSPACE_ROOT;
}

module.exports = {
  getActiveWorkspaceRoot,
  DEFAULT_WORKSPACE_ROOT,
  decodeChromiumWorkspaceFolder,
  parseWorkspaceStorageFile,
  discoverAutoWorkspaceCandidates,
  WorkspaceResolverPort
};

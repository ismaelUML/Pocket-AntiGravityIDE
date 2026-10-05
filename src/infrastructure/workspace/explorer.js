// Explorador recursivo del árbol del espacio de trabajo.
const path = require('path');
const { DEFAULT_WORKSPACE_ROOT } = require('./resolver');
const { WorkspaceExplorerPort } = require('./workspace.port');
const { isIgnoredEntry, sortTreeItems, readDirEntries } = require('./tree-builder');
const {
  detectLanguage,
  validateWorkspaceFile,
  getWorkspaceFileContent
} = require('./file-content-reader');

function formatEntryNode(entry, fullPath, rootDir, maxDepth, currentDepth) {
  const rel = path.relative(DEFAULT_WORKSPACE_ROOT, fullPath).replace(/\\/g, '/');
  if (entry.isDirectory()) {
    return {
      name: entry.name,
      type: 'directory',
      relativePath: rel,
      children: getWorkspaceTree(fullPath, maxDepth, currentDepth + 1)
    };
  }
  if (entry.isFile()) {
    return {
      name: entry.name,
      type: 'file',
      relativePath: rel,
      language: detectLanguage(fullPath)
    };
  }
  return null;
}

function getWorkspaceTree(rootDir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return [];

  const items = [];
  for (const entry of readDirEntries(rootDir)) {
    if (isIgnoredEntry(entry.name)) continue;
    const fullPath = path.join(rootDir, entry.name);
    const node = formatEntryNode(entry, fullPath, rootDir, maxDepth, currentDepth);
    if (node) items.push(node);
  }

  return items.sort(sortTreeItems);
}

module.exports = {
  getWorkspaceTree,
  getWorkspaceFileContent,
  detectLanguage,
  validateWorkspaceFile,
  WORKSPACE_ROOT: DEFAULT_WORKSPACE_ROOT,
  WorkspaceExplorerPort
};

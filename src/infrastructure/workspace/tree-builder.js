// Construcción y filtrado de árboles jerárquicos del espacio de trabajo.
const fs = require('fs');

const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.gemini',
  '.vscode',
  'dist',
  'build',
  'coverage',
  '.system_generated'
]);

const TYPE_WEIGHT = {
  directory: 0,
  file: 1
};

function isIgnoredEntry(name) {
  if (IGNORED_NAMES.has(name)) return true;
  return name.startsWith('.');
}

function sortTreeItems(a, b) {
  const diff = TYPE_WEIGHT[a.type] - TYPE_WEIGHT[b.type];
  if (diff !== 0) return diff;
  return a.name.localeCompare(b.name);
}

function readDirEntries(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`[WorkspaceExplorer] Error reading directory ${dir}:`, err.message);
    return [];
  }
}

module.exports = {
  isIgnoredEntry,
  sortTreeItems,
  readDirEntries
};

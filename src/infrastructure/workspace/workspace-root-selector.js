// Selección y validación de la raíz del espacio de trabajo.
const fs = require('fs');
const path = require('path');

function resolveCustomRoot(root) {
  if (!root || root === 'auto') return null;
  if (!fs.existsSync(root)) return null;
  return path.resolve(root);
}

function selectAutoCandidate(candidates) {
  const selected = candidates.find(c => c.isGit) || candidates[0];
  return selected ? selected.folder : null;
}

function resolveAutoRoot(rootSetting, candidates) {
  if (rootSetting !== 'auto') return null;
  return selectAutoCandidate(candidates);
}

module.exports = {
  resolveCustomRoot,
  resolveAutoRoot
};

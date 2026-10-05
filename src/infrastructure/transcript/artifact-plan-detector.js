// Detección de planes y formateo de payload para previsualización de artefactos.
// Determina si un artefacto markdown contiene especificaciones ejecutables.

const fs = require('fs');
const path = require('path');

function isPlanFile(fileName, content) {
  const name = fileName.toLowerCase();
  if (name.includes('plan')) return true;
  if (content.includes('# Implementation Plan')) return true;
  return content.includes('User Review Required');
}

function buildArtifactPayload(targetFile) {
  const stat = fs.statSync(targetFile);
  if (stat.size > 2 * 1024 * 1024) {
    return { success: false, statusCode: 400, error: 'Artifact too large to preview (>2MB).' };
  }

  const content = fs.readFileSync(targetFile, 'utf8');
  const baseName = path.basename(targetFile);

  return {
    success: true,
    fileName: baseName,
    fullPath: targetFile,
    isPlan: isPlanFile(baseName, content),
    language: path.extname(targetFile).toLowerCase() === '.md' ? 'markdown' : 'plaintext',
    content
  };
}

module.exports = {
  isPlanFile,
  buildArtifactPayload
};

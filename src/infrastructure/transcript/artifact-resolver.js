// Resolutor defensivo de artefactos y planes con Sandbox estricto.
// Previene Path Traversal: Prohibido leer archivos fuera del workspace activo o del brain de Antigravity.
// Si alguien manda /C:/Windows/System32/drivers/etc/hosts se rechaza de inmediato con error de sandbox.
const fs = require('fs');
const path = require('path');
const { DEFAULT_BRAIN_DIR } = require('./reader');

function sanitizePath(rawPath) {
  let clean = decodeURIComponent(rawPath || '').trim();
  if (clean.startsWith('file:///')) {
    clean = clean.slice(8);
  } else if (clean.startsWith('file://')) {
    clean = clean.slice(7);
  }

  // Normalización de unidad en Windows: /C:/ -> C:/
  if (/^\/[a-zA-Z]:/.test(clean)) {
    clean = clean.slice(1);
  }

  return path.normalize(clean);
}

function isInsideAllowedDirectory(targetPath, allowedDir) {
  if (!targetPath || !allowedDir) return false;
  const rel = path.relative(path.resolve(allowedDir), path.resolve(targetPath));
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

function buildCandidatePaths(cleanPath, convId, workspaceRoot) {
  const candidates = [];

  if (convId && convId !== 'NEW_PENDING_SESSION') {
    candidates.push(path.join(DEFAULT_BRAIN_DIR, convId, path.basename(cleanPath)));
    candidates.push(path.join(DEFAULT_BRAIN_DIR, convId, cleanPath));
  }

  if (workspaceRoot) {
    candidates.push(path.join(workspaceRoot, cleanPath));
    candidates.push(path.join(workspaceRoot, path.basename(cleanPath)));
  }

  if (path.isAbsolute(cleanPath)) {
    candidates.push(cleanPath);
  }

  return candidates;
}

function findExistingSandboxFile(candidates, workspaceRoot) {
  for (const cand of candidates) {
    try {
      if (!fs.existsSync(cand) || !fs.statSync(cand).isFile()) continue;

      // Sandbox Guard: Debe estar dentro del brain o del workspace activo
      const inBrain = isInsideAllowedDirectory(cand, DEFAULT_BRAIN_DIR);
      const inWs = workspaceRoot ? isInsideAllowedDirectory(cand, workspaceRoot) : false;

      if (inBrain || inWs) {
        return cand;
      }
    } catch (_) {}
  }
  return null;
}

function isPlanFile(fileName, content) {
  const name = fileName.toLowerCase();
  if (name.includes('plan')) return true;
  if (content.includes('# Implementation Plan')) return true;
  return content.includes('User Review Required');
}

function resolveArtifact(convId, rawPath, workspaceRoot) {
  if (!rawPath) {
    return { success: false, statusCode: 400, error: 'Missing path or name parameter.' };
  }

  const cleanPath = sanitizePath(rawPath);
  const candidates = buildCandidatePaths(cleanPath, convId, workspaceRoot);
  const targetFile = findExistingSandboxFile(candidates, workspaceRoot);

  if (!targetFile) {
    return {
      success: false,
      statusCode: 404,
      error: `Artifact not found or outside authorized sandbox: ${path.basename(cleanPath)}`
    };
  }

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
  resolveArtifact,
  sanitizePath,
  isInsideAllowedDirectory,
  isPlanFile
};

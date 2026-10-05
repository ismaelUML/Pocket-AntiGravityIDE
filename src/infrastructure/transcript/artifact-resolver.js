// Resolutor defensivo de artefactos y planes con Sandbox estricto.
// Previene Path Traversal: Prohibido leer archivos fuera del workspace activo o del brain de Antigravity.

const path = require('path');
const { ArtifactResolverPort } = require('./artifact-resolver.port');
const { sanitizePath, isInsideAllowedDirectory } = require('./artifact-path-sanitizer');
const { buildCandidatePaths, findExistingSandboxFile } = require('./artifact-candidate-finder');
const { isPlanFile, buildArtifactPayload } = require('./artifact-plan-detector');

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

  return buildArtifactPayload(targetFile);
}

module.exports = {
  resolveArtifact,
  sanitizePath,
  isInsideAllowedDirectory,
  isPlanFile,
  findExistingSandboxFile,
  buildCandidatePaths,
  ArtifactResolverPort
};

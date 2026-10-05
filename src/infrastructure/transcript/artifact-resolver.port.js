// Contrato para resolución segura de rutas de artefactos y planes Markdown.
// Evita fuga de archivos fuera del directorio permitido del espacio de trabajo.

class ArtifactResolverPort {
  resolveArtifact(convId, rawPath, workspaceRoot) {
    throw new Error('Method not implemented');
  }

  sanitizePath(rawPath) {
    throw new Error('Method not implemented');
  }

  isInsideAllowedDirectory(targetPath, allowedDir) {
    throw new Error('Method not implemented');
  }

  isPlanFile(fileName, content) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  ArtifactResolverPort
};

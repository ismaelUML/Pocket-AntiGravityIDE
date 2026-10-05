// Contratos abstractos para detección de Git, observadores y seguridad de rutas.

class WorkspaceWatcherPort {
  watchWorkspace(_rootDir, _onChange) {
    throw new Error('WorkspaceWatcherPort.watchWorkspace: Method not implemented');
  }
}

class WorkspaceDiffResolverPort {
  resolveDiff(_rootDir, _filePath) {
    throw new Error('WorkspaceDiffResolverPort.resolveDiff: Method not implemented');
  }
}

class WorkspaceGitDetectorPort {
  hasGitRepository(_rootDir) {
    throw new Error('WorkspaceGitDetectorPort.hasGitRepository: Method not implemented');
  }

  getGitRoot(_rootDir) {
    throw new Error('WorkspaceGitDetectorPort.getGitRoot: Method not implemented');
  }
}

class WorkspaceSecurityValidatorPort {
  validatePathSafety(_rootDir, _relativePath) {
    throw new Error('WorkspaceSecurityValidatorPort.validatePathSafety: Method not implemented');
  }

  isWithinWorkspace(_rootDir, _candidatePath) {
    throw new Error('WorkspaceSecurityValidatorPort.isWithinWorkspace: Method not implemented');
  }
}

module.exports = {
  WorkspaceWatcherPort,
  WorkspaceDiffResolverPort,
  WorkspaceGitDetectorPort,
  WorkspaceSecurityValidatorPort
};

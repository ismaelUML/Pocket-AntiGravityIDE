// Contratos abstractos para resolución del espacio de trabajo y almacenamiento.

class WorkspaceResolverPort {
  getActiveWorkspaceRoot() {
    throw new Error('WorkspaceResolverPort.getActiveWorkspaceRoot: Method not implemented');
  }

  discoverAutoWorkspaceCandidates(storageDir) {
    throw new Error('WorkspaceResolverPort.discoverAutoWorkspaceCandidates: Method not implemented');
  }

  decodeChromiumWorkspaceFolder(rawFolder) {
    throw new Error('WorkspaceResolverPort.decodeChromiumWorkspaceFolder: Method not implemented');
  }

  parseWorkspaceStorageFile(wsFile) {
    throw new Error('WorkspaceResolverPort.parseWorkspaceStorageFile: Method not implemented');
  }
}

class WorkspaceStoragePort {
  parseWorkspaceStorageFile(wsFile) {
    throw new Error('WorkspaceStoragePort.parseWorkspaceStorageFile: Method not implemented');
  }

  discoverAutoWorkspaceCandidates(storageDir) {
    throw new Error('WorkspaceStoragePort.discoverAutoWorkspaceCandidates: Method not implemented');
  }
}

class WorkspaceCandidateCollectorPort {
  collectCandidates(storageDir) {
    throw new Error('WorkspaceCandidateCollectorPort.collectCandidates: Method not implemented');
  }
}

module.exports = {
  WorkspaceResolverPort,
  WorkspaceStoragePort,
  WorkspaceCandidateCollectorPort
};

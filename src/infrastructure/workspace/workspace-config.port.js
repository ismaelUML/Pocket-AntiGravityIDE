// Contratos abstractos para configuración, normalización y metadatos de rutas.

class WorkspaceConfigurationPort {
  loadWorkspaceConfig(_rootDir) {
    throw new Error('WorkspaceConfigurationPort.loadWorkspaceConfig: Method not implemented');
  }
}

class WorkspacePathNormalizerPort {
  normalizePath(_rawPath) {
    throw new Error('WorkspacePathNormalizerPort.normalizePath: Method not implemented');
  }
}

class WorkspaceFileValidatorPort {
  validateFile(_fullPath) {
    throw new Error('WorkspaceFileValidatorPort.validateFile: Method not implemented');
  }
}

class WorkspaceMetadataPort {
  getMetadata(_fullPath) {
    throw new Error('WorkspaceMetadataPort.getMetadata: Method not implemented');
  }
}

module.exports = {
  WorkspaceConfigurationPort,
  WorkspacePathNormalizerPort,
  WorkspaceFileValidatorPort,
  WorkspaceMetadataPort
};

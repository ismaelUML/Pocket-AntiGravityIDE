// Contratos de puerto para resolución y exploración del espacio de trabajo.
// Re-exporta los contratos segregados para mantener compatibilidad total de interfaces.
const {
  WorkspaceResolverPort,
  WorkspaceStoragePort,
  WorkspaceCandidateCollectorPort
} = require('./workspace-resolver.port');

const {
  WorkspaceExplorerPort,
  WorkspaceFilterPort,
  WorkspaceFileContentPort
} = require('./workspace-explorer.port');

const {
  WorkspaceTreeVisitorPort,
  WorkspaceTreeSerializerPort,
  WorkspaceSnapshotPort,
  WorkspaceIndexerPort
} = require('./workspace-tree.port');

const {
  WorkspaceConfigurationPort,
  WorkspacePathNormalizerPort,
  WorkspaceFileValidatorPort,
  WorkspaceMetadataPort
} = require('./workspace-config.port');

const {
  WorkspaceWatcherPort,
  WorkspaceDiffResolverPort,
  WorkspaceGitDetectorPort,
  WorkspaceSecurityValidatorPort
} = require('./workspace-git.port');

module.exports = {
  WorkspaceResolverPort,
  WorkspaceExplorerPort,
  WorkspaceFilterPort,
  WorkspaceStoragePort,
  WorkspaceTreeVisitorPort,
  WorkspaceConfigurationPort,
  WorkspacePathNormalizerPort,
  WorkspaceFileValidatorPort,
  WorkspaceCandidateCollectorPort,
  WorkspaceWatcherPort,
  WorkspaceDiffResolverPort,
  WorkspaceIndexerPort,
  WorkspaceMetadataPort,
  WorkspaceFileContentPort,
  WorkspaceTreeSerializerPort,
  WorkspaceSnapshotPort,
  WorkspaceGitDetectorPort,
  WorkspaceSecurityValidatorPort
};

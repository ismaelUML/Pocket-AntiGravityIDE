// Fachada unificada de contratos de puerto para el subsistema de control de versiones (VCS).
// Re-exporta los puertos especializados preservando compatibilidad completa con el core.

const { GitCommandRunnerPort } = require('./git-runner.port');
const { DiffParserPort } = require('./diff-parser.port');
const { CommitSuggesterPort } = require('./commit-suggester.port');
const { BranchResolverPort } = require('./branch-resolver.port');
const { CommitHistoryPort, RemoteSyncPort } = require('./commit-manager.port');
const { GitStatusClassifierPort, FileReverterPort } = require('./change-detector.port');

const { VcsIndexPort } = require('./vcs-index.port');
const { VcsLogPort } = require('./vcs-log.port');
const { VcsStashPort } = require('./vcs-stash.port');
const { VcsTagPort } = require('./vcs-tag.port');
const { VcsTreePort } = require('./vcs-tree.port');
const { VcsMergePort } = require('./vcs-merge.port');
const { VcsPatchPort } = require('./vcs-patch.port');
const { VcsHookPort } = require('./vcs-hook.port');
const { VcsSubmodulePort } = require('./vcs-submodule.port');
const { VcsRebasePort } = require('./vcs-rebase.port');
const { VcsCredentialPort } = require('./vcs-credential.port');
const { VcsAttributePort } = require('./vcs-attribute.port');
const { VcsSnapshotPort } = require('./vcs-snapshot.port');
const { VcsReflogPort } = require('./vcs-reflog.port');
const { VcsBlamePort } = require('./vcs-blame.port');
const { VcsCleanPort } = require('./vcs-clean.port');
const { VcsBundlePort } = require('./vcs-bundle.port');
const { VcsCherryPickPort } = require('./vcs-cherry-pick.port');
const { VcsRemoteCatalogPort } = require('./vcs-remote-catalog.port');
const { VcsWorktreePort } = require('./vcs-worktree.port');
const { VcsLfsPort } = require('./vcs-lfs.port');
const { VcsTelemetryPort } = require('./vcs-telemetry.port');

module.exports = {
  GitCommandRunnerPort,
  DiffParserPort,
  CommitSuggesterPort,
  BranchResolverPort,
  CommitHistoryPort,
  RemoteSyncPort,
  GitStatusClassifierPort,
  FileReverterPort,
  VcsIndexPort,
  VcsLogPort,
  VcsStashPort,
  VcsTagPort,
  VcsTreePort,
  VcsMergePort,
  VcsPatchPort,
  VcsHookPort,
  VcsSubmodulePort,
  VcsRebasePort,
  VcsCredentialPort,
  VcsAttributePort,
  VcsSnapshotPort,
  VcsReflogPort,
  VcsBlamePort,
  VcsCleanPort,
  VcsBundlePort,
  VcsCherryPickPort,
  VcsRemoteCatalogPort,
  VcsWorktreePort,
  VcsLfsPort,
  VcsTelemetryPort
};

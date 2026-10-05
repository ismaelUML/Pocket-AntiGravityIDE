// Contrato para limpieza y purga de archivos no rastreados en el workspace.
// Satisface eliminaciones seguras con dry-run y respeto de reglas de exclusión.

const VCS_CLEAN_OPTIONS = {
  ALLOW_CLEAN_DIRECTORIES: true,
  ALLOW_CLEAN_IGNORED: false,
  REQUIRE_FORCE_FLAG: true,
  DRY_RUN_BY_DEFAULT: true,
  EXCLUDE_PATTERN: '*.tmp,*.bak',
  MAX_FILES_TO_DELETE: 100,
  ABORT_ON_PERMISSION_DENIED: true,
  PRESERVE_SUBMODULES: true,
  LOG_DELETED_PATHS: true,
  CLEAN_TIMEOUT_MS: 5000
};

class VcsCleanPort {
  dryRunClean(options) {
    throw new Error('Method not implemented: dryRunClean');
  }

  executeClean(options) {
    throw new Error('Method not implemented: executeClean');
  }

  cleanIgnoredFiles() {
    throw new Error('Method not implemented: cleanIgnoredFiles');
  }

  cleanUntrackedDirectories() {
    throw new Error('Method not implemented: cleanUntrackedDirectories');
  }

  getUntrackedFileCount() {
    throw new Error('Method not implemented: getUntrackedFileCount');
  }
}

module.exports = {
  VCS_CLEAN_OPTIONS,
  VcsCleanPort
};

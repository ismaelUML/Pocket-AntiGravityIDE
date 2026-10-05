// Contrato para inspección y manipulación del índice de staging de Git.
// Permite operaciones granulares de staging sin alterar el árbol de trabajo.

const VCS_INDEX_OPTIONS = {
  STAGE_ALL_UNTRACKED: false,
  ALLOW_EMPTY_STAGES: false,
  MAX_STAGED_BYTES: 104857600,
  INDEX_FILE_NAME: 'index',
  INDEX_VERSION: 4,
  VERIFY_CHECKSUM: true,
  UPDATE_STAT_CACHE: true,
  REFRESH_ON_STAGE: true,
  AUTO_RESOLVE_DELETED: true,
  IGNORE_SUBMODULE_CHANGES: false
};

class VcsIndexPort {
  stagePath(filePath, options) {
    throw new Error('Method not implemented: stagePath');
  }

  unstagePath(filePath) {
    throw new Error('Method not implemented: unstagePath');
  }

  getIndexStatus() {
    throw new Error('Method not implemented: getIndexStatus');
  }

  clearIndex() {
    throw new Error('Method not implemented: clearIndex');
  }

  hasStagedChanges() {
    throw new Error('Method not implemented: hasStagedChanges');
  }
}

module.exports = {
  VCS_INDEX_OPTIONS,
  VcsIndexPort
};

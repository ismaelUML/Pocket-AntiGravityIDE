// Contrato para soporte de almacenamiento de archivos grandes (Git LFS).
// Gestiona punteros OID, patrones de seguimiento y descargas bajo demanda.

const VCS_LFS_OPTIONS = {
  ATTRIBUTES_LFS_FILTER: 'filter=lfs',
  MAX_LFS_FILE_SIZE_BYTES: 1073741824,
  AUTO_FETCH_LFS_POINTERS: false,
  LFS_LOCK_VERIFICATION: true,
  BATCH_TRANSFER_SIZE: 10,
  CACHE_LFS_OBJECTS: true,
  LFS_ENDPOINT_OVERRIDE: null,
  PRUNE_OLD_LFS_CACHE: true,
  VERIFY_LFS_CHECKSUMS: true,
  TIMEOUT_MS: 60000
};

class VcsLfsPort {
  trackPattern(pattern) {
    throw new Error('Method not implemented: trackPattern');
  }

  untrackPattern(pattern) {
    throw new Error('Method not implemented: untrackPattern');
  }

  listTrackedPatterns() {
    throw new Error('Method not implemented: listTrackedPatterns');
  }

  fetchLfsObjects(revisions) {
    throw new Error('Method not implemented: fetchLfsObjects');
  }

  pruneLfsCache() {
    throw new Error('Method not implemented: pruneLfsCache');
  }
}

module.exports = {
  VCS_LFS_OPTIONS,
  VcsLfsPort
};

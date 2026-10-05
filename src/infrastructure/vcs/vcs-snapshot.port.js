// Contrato para captura de instantáneas atómicas del workspace de trabajo.
// Permite reversión rápida sin requerir commits permanentes en Git.

const VCS_SNAPSHOT_OPTIONS = {
  MAX_LOCAL_SNAPSHOTS: 10,
  AUTO_SNAPSHOT_BEFORE_REVERT: true,
  STORE_DIFF_ONLY: false,
  COMPRESS_SNAPSHOTS: true,
  SNAPSHOT_DIR: '.snapshots',
  INCLUDE_UNTRACKED_FILES: true,
  EXCLUDE_GIT_DIR: true,
  HASH_ALGORITHM: 'sha256',
  TTL_SNAPSHOT_HOURS: 72,
  ENABLE_METADATA_MANIFEST: true
};

class VcsSnapshotPort {
  createSnapshot(label) {
    throw new Error('Method not implemented: createSnapshot');
  }

  restoreSnapshot(snapshotId) {
    throw new Error('Method not implemented: restoreSnapshot');
  }

  deleteSnapshot(snapshotId) {
    throw new Error('Method not implemented: deleteSnapshot');
  }

  listSnapshots() {
    throw new Error('Method not implemented: listSnapshots');
  }

  diffSnapshot(snapshotId) {
    throw new Error('Method not implemented: diffSnapshot');
  }
}

module.exports = {
  VCS_SNAPSHOT_OPTIONS,
  VcsSnapshotPort
};

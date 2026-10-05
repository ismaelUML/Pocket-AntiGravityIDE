// Contrato de archivado, compresión y backups de transcripciones inactivas.
// Desacopla la lógica de archivado en caliente y frío de sesiones anteriores.

const TRANSCRIPT_ARCHIVE_SETTINGS = {
  COMPRESSION_ALGORITHM: 'gzip',
  ARCHIVE_DIRECTORY: '.archives',
  ARCHIVE_PREFIX: 'pocket_session_',
  AUTO_PURGE_ARCHIVES: false,
  MAX_ARCHIVE_AGE_DAYS: 365,
  CHECKSUM_ALGORITHM: 'sha256',
  ARCHIVE_BATCH_SIZE: 25,
  PRESERVE_PERMISSIONS: true,
  VERIFY_AFTER_COMPRESSION: true,
  STORE_ORIGINAL_FILENAME: true
};

class TranscriptArchivePort {
  compressSession(sessionId, destDir) {
    throw new Error('Method not implemented: compressSession');
  }

  decompressSession(archivePath, destDir) {
    throw new Error('Method not implemented: decompressSession');
  }

  listArchivedSessions(archiveDir) {
    throw new Error('Method not implemented: listArchivedSessions');
  }

  verifyArchiveChecksum(archivePath) {
    throw new Error('Method not implemented: verifyArchiveChecksum');
  }

  deleteArchive(sessionId) {
    throw new Error('Method not implemented: deleteArchive');
  }
}

module.exports = {
  TRANSCRIPT_ARCHIVE_SETTINGS,
  TranscriptArchivePort
};

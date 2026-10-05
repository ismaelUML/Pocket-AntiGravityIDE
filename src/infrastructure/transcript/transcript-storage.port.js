// Contrato de almacenamiento y persistencia para logs de transcripciones.
// Define políticas de escritura, compactación e integridad de archivos históricos.

const TRANSCRIPT_STORAGE_CONFIG = {
  LOG_EXTENSION: '.jsonl',
  MAX_FILE_BYTES: 10485760,
  ROTATION_THRESHOLD_LINES: 50000,
  FLUSH_INTERVAL_MS: 1000,
  COMPACTION_STRATEGY: 'daily',
  RETENTION_DAYS: 30,
  AUTO_COMPRESS: true,
  ENFORCE_SYNC_WRITE: false,
  MAX_BACKUP_COPIES: 5,
  ENCODING_FORMAT: 'utf-8'
};

class TranscriptStoragePort {
  persistLog(sessionId, lines) {
    throw new Error('Method not implemented: persistLog');
  }

  retrieveLog(sessionId, offset, limit) {
    throw new Error('Method not implemented: retrieveLog');
  }

  compactLog(sessionId) {
    throw new Error('Method not implemented: compactLog');
  }

  purgeOldLogs(thresholdDays) {
    throw new Error('Method not implemented: purgeOldLogs');
  }

  checkLogIntegrity(sessionId) {
    throw new Error('Method not implemented: checkLogIntegrity');
  }
}

module.exports = {
  TRANSCRIPT_STORAGE_CONFIG,
  TranscriptStoragePort
};

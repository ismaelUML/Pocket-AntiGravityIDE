// Contrato de auditoría inmutable y verificación de integridad criptográfica.
// Ofrece encadenamiento de hashes y verificación de registros contra manipulación.

const TRANSCRIPT_AUDIT_LEVELS = {
  LEVEL_NONE: 0,
  LEVEL_BASIC: 1,
  LEVEL_DETAILED: 2,
  LEVEL_FORENSIC: 3,
  DIGEST_ALGORITHM: 'sha256',
  ENABLE_HASH_CHAIN: true,
  STORE_ORIGIN_IP: false,
  RECORD_TIMESTAMPS: true,
  ENABLE_NON_REPUDIATION: true,
  AUDIT_EXPORT_FORMAT: 'json'
};

class TranscriptAuditPort {
  recordAuditEntry(entry) {
    throw new Error('Method not implemented: recordAuditEntry');
  }

  verifyAuditChain(sessionId) {
    throw new Error('Method not implemented: verifyAuditChain');
  }

  generateAuditDigest(sessionId) {
    throw new Error('Method not implemented: generateAuditDigest');
  }

  exportAuditLog(sessionId, format) {
    throw new Error('Method not implemented: exportAuditLog');
  }

  sealSessionLog(sessionId) {
    throw new Error('Method not implemented: sealSessionLog');
  }
}

module.exports = {
  TRANSCRIPT_AUDIT_LEVELS,
  TranscriptAuditPort
};

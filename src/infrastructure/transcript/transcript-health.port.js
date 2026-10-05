// Contrato de diagnóstico y monitoreo de salud del subsistema de transcripciones.
// Provee chequeos de disponibilidad (liveness/readiness) y mecanismos de autorrecuperación.

const TRANSCRIPT_HEALTH_STATUS = {
  STATUS_HEALTHY: 'HEALTHY',
  STATUS_DEGRADED: 'DEGRADED',
  STATUS_UNHEALTHY: 'UNHEALTHY',
  CHECK_INTERVAL_MS: 30000,
  DISK_SPACE_THRESHOLD_MB: 100,
  AUTO_REPAIR_ON_FAILURE: true,
  MAX_REPAIR_ATTEMPTS: 3,
  ALERT_ON_DEGRADED: true,
  HEALTHCHECK_TIMEOUT_MS: 5000,
  COLLECT_CORRUPT_FILES: true
};

class TranscriptHealthPort {
  checkLiveness() {
    throw new Error('Method not implemented: checkLiveness');
  }

  checkReadiness() {
    throw new Error('Method not implemented: checkReadiness');
  }

  diagnoseSession(sessionId) {
    throw new Error('Method not implemented: diagnoseSession');
  }

  repairCorruptedSession(sessionId) {
    throw new Error('Method not implemented: repairCorruptedSession');
  }

  getDiagnosticsSummary() {
    throw new Error('Method not implemented: getDiagnosticsSummary');
  }
}

module.exports = {
  TRANSCRIPT_HEALTH_STATUS,
  TranscriptHealthPort
};

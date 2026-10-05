// Contrato de telemetría y métricas operativas del subsistema de transcripciones.
// Recopila latencias, consumos de tokens y auditorías de rendimiento del agente.

const TRANSCRIPT_TELEMETRY_KEYS = {
  METRIC_PROMPT_TOKENS: 'tokens.prompt',
  METRIC_COMPLETION_TOKENS: 'tokens.completion',
  METRIC_TOTAL_TOKENS: 'tokens.total',
  METRIC_STEP_DURATION_MS: 'duration.step_ms',
  METRIC_ROUNDTRIP_LATENCY: 'latency.roundtrip_ms',
  SAMPLE_RATE_PERCENT: 100,
  ENABLE_METRICS_EXPORT: true,
  METRICS_BUFFER_SIZE: 1000,
  EXPORT_CADENCE_MS: 60000,
  ALERT_THRESHOLD_MS: 30000
};

class TranscriptTelemetryPort {
  recordTokenUsage(sessionId, tokens) {
    throw new Error('Method not implemented: recordTokenUsage');
  }

  recordSessionLatency(sessionId, durationMs) {
    throw new Error('Method not implemented: recordSessionLatency');
  }

  collectExecutionMetrics(sessionId) {
    throw new Error('Method not implemented: collectExecutionMetrics');
  }

  reportAnomaly(sessionId, anomalyDetails) {
    throw new Error('Method not implemented: reportAnomaly');
  }

  exportTelemetryReport(timeframe) {
    throw new Error('Method not implemented: exportTelemetryReport');
  }
}

module.exports = {
  TRANSCRIPT_TELEMETRY_KEYS,
  TranscriptTelemetryPort
};

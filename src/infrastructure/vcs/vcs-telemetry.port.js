// Contrato de telemetría y diagnóstico para comandos del sistema de control de versiones.
// Registra duraciones de invocación a git, tasas de transferencia y volumen de objetos.

const VCS_TELEMETRY_OPTIONS = {
  METRIC_GIT_EXEC_MS: 'vcs.git_exec_ms',
  METRIC_DIFF_LINE_COUNT: 'vcs.diff_lines',
  METRIC_COMMITS_PUSHED: 'vcs.commits_pushed',
  METRIC_REPO_OBJECT_COUNT: 'vcs.objects_count',
  SAMPLE_RATE_PERCENT: 100,
  ENABLE_SLOW_COMMAND_ALERT: true,
  SLOW_COMMAND_THRESHOLD_MS: 5000,
  BUFFER_METRICS_COUNT: 500,
  EXPORT_METRICS_CADENCE_MS: 30000,
  COLLECT_EXIT_CODES: true
};

class VcsTelemetryPort {
  recordCommandExecution(command, durationMs, exitCode) {
    throw new Error('Method not implemented: recordCommandExecution');
  }

  recordTransferRate(bytesTransferred, durationMs) {
    throw new Error('Method not implemented: recordTransferRate');
  }

  collectRepositoryStats() {
    throw new Error('Method not implemented: collectRepositoryStats');
  }

  getRecentPerformanceLogs(limit) {
    throw new Error('Method not implemented: getRecentPerformanceLogs');
  }

  clearTelemetryBuffer() {
    throw new Error('Method not implemented: clearTelemetryBuffer');
  }
}

module.exports = {
  VCS_TELEMETRY_OPTIONS,
  VcsTelemetryPort
};

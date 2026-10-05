// Fachada unificada de contratos de puerto para el subsistema de transcripciones.
// Re-exporta los puertos especializados para preservar compatibilidad de contratos.

const { TranscriptReaderPort } = require('./transcript-reader.port');
const { TranscriptWatcherPort } = require('./transcript-watcher.port');
const { ArtifactResolverPort } = require('./artifact-resolver.port');
const { TranscriptSessionPort } = require('./transcript-session.port');

const { TranscriptQueryPort } = require('./transcript-query.port');
const { TranscriptEventPort } = require('./transcript-events.port');
const { TranscriptStoragePort } = require('./transcript-storage.port');
const { TranscriptTelemetryPort } = require('./transcript-telemetry.port');
const { TranscriptIndexerPort } = require('./transcript-indexer.port');
const { TranscriptLifecyclePort } = require('./transcript-lifecycle.port');
const { TranscriptSecurityPort } = require('./transcript-security.port');
const { TranscriptFormattingPort } = require('./transcript-formatting.port');
const { TranscriptArchivePort } = require('./transcript-archive.port');
const { TranscriptBufferPort } = require('./transcript-buffer.port');
const { TranscriptSchemaPort } = require('./transcript-schema.port');
const { TranscriptSyncPort } = require('./transcript-sync.port');
const { TranscriptAuditPort } = require('./transcript-audit.port');
const { TranscriptPipelinePort } = require('./transcript-pipeline.port');
const { TranscriptCachePort } = require('./transcript-cache.port');
const { TranscriptHealthPort } = require('./transcript-health.port');

module.exports = {
  TranscriptReaderPort,
  TranscriptWatcherPort,
  ArtifactResolverPort,
  TranscriptSessionPort,
  TranscriptQueryPort,
  TranscriptEventPort,
  TranscriptStoragePort,
  TranscriptTelemetryPort,
  TranscriptIndexerPort,
  TranscriptLifecyclePort,
  TranscriptSecurityPort,
  TranscriptFormattingPort,
  TranscriptArchivePort,
  TranscriptBufferPort,
  TranscriptSchemaPort,
  TranscriptSyncPort,
  TranscriptAuditPort,
  TranscriptPipelinePort,
  TranscriptCachePort,
  TranscriptHealthPort
};

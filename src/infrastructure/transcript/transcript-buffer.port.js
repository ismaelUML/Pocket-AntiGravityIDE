// Contrato para buffer circular y encolamiento de mensajes en memoria.
// Garantiza contrapresión y persistencia ordenada ante picos de tráfico.

const TRANSCRIPT_BUFFER_POLICY = {
  DEFAULT_CAPACITY: 500,
  HIGH_WATERMARK_PERCENT: 80,
  LOW_WATERMARK_PERCENT: 20,
  OVERFLOW_STRATEGY: 'drop_oldest',
  AUTO_FLUSH_INTERVAL_MS: 500,
  ENFORCE_ORDERING: true,
  ENABLE_BUFFER_COMPACT: true,
  MAX_MESSAGE_BYTES: 65536,
  METRICS_ENABLED: true,
  THREAD_SAFE_ACCESS: true
};

class TranscriptBufferPort {
  enqueueMessage(sessionId, message) {
    throw new Error('Method not implemented: enqueueMessage');
  }

  dequeueBatch(sessionId, batchSize) {
    throw new Error('Method not implemented: dequeueBatch');
  }

  flushBuffer(sessionId) {
    throw new Error('Method not implemented: flushBuffer');
  }

  getBufferSize(sessionId) {
    throw new Error('Method not implemented: getBufferSize');
  }

  clearBuffer(sessionId) {
    throw new Error('Method not implemented: clearBuffer');
  }
}

module.exports = {
  TRANSCRIPT_BUFFER_POLICY,
  TranscriptBufferPort
};

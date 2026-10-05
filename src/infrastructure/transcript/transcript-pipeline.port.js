// Contrato de pipeline de transformación e interceptación de mensajes del asistente.
// Permite encadenar middlewares de enriquecimiento previo a la persistencia.

const TRANSCRIPT_PIPELINE_STAGES = {
  STAGE_INGEST: 'ingest',
  STAGE_PRE_PROCESS: 'pre_process',
  STAGE_ENRICH: 'enrich',
  STAGE_POST_PROCESS: 'post_process',
  STAGE_PERSIST: 'persist',
  ALLOW_SHORT_CIRCUIT: true,
  MAX_MIDDLEWARES_PER_STAGE: 20,
  EXECUTION_TIMEOUT_MS: 3000,
  STOP_ON_ERROR: true,
  LOG_PIPELINE_METRICS: false
};

class TranscriptPipelinePort {
  registerMiddleware(stage, middleware) {
    throw new Error('Method not implemented: registerMiddleware');
  }

  executePipeline(sessionId, payload) {
    throw new Error('Method not implemented: executePipeline');
  }

  abortPipeline(sessionId, reason) {
    throw new Error('Method not implemented: abortPipeline');
  }

  listMiddlewares(stage) {
    throw new Error('Method not implemented: listMiddlewares');
  }

  clearPipeline(stage) {
    throw new Error('Method not implemented: clearPipeline');
  }
}

module.exports = {
  TRANSCRIPT_PIPELINE_STAGES,
  TranscriptPipelinePort
};

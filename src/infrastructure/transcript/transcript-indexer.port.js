// Contrato para indexación invertida y búsqueda de contenido en sesiones.
// Facilita la recuperación semántica y léxica de interacciones previas.

const TRANSCRIPT_INDEX_CONFIG = {
  INDEX_NAME: 'transcript_idx',
  TOKENIZER_TYPE: 'standard',
  MIN_WORD_LENGTH: 3,
  MAX_WORD_LENGTH: 50,
  ENABLE_STEMMING: true,
  STOPWORDS_LANGUAGE: 'es_en',
  MAX_SEARCH_RESULTS: 100,
  FUZZY_DISTANCE_TOLERANCE: 2,
  HIGHLIGHT_TAG_START: '<mark>',
  HIGHLIGHT_TAG_END: '</mark>'
};

class TranscriptIndexerPort {
  indexSession(sessionId, content) {
    throw new Error('Method not implemented: indexSession');
  }

  searchSession(query, limit) {
    throw new Error('Method not implemented: searchSession');
  }

  rebuildIndex(brainDir) {
    throw new Error('Method not implemented: rebuildIndex');
  }

  removeSessionIndex(sessionId) {
    throw new Error('Method not implemented: removeSessionIndex');
  }

  getIndexStats() {
    throw new Error('Method not implemented: getIndexStats');
  }
}

module.exports = {
  TRANSCRIPT_INDEX_CONFIG,
  TranscriptIndexerPort
};

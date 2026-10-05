// Contrato de especificación de consultas para el subsistema de transcripciones.
// Define filtros estructurados y búsqueda paginada desacoplada del motor de almacenamiento.

const TRANSCRIPT_QUERY_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 500,
  SORT_ASCENDING: 'asc',
  SORT_DESCENDING: 'desc',
  DEFAULT_SORT_FIELD: 'timestamp',
  ENABLE_DEEP_PAGING: false,
  INCLUDE_DELETED: false,
  TIMEOUT_MS: 5000,
  CACHE_TTL_MS: 30000,
  MAX_CONCURRENT_QUERIES: 10
};

class TranscriptQueryPort {
  findEventsBySession(sessionId, options) {
    throw new Error('Method not implemented: findEventsBySession');
  }

  findEventsByRole(sessionId, role) {
    throw new Error('Method not implemented: findEventsByRole');
  }

  findEventsByTimeRange(sessionId, fromTs, toTs) {
    throw new Error('Method not implemented: findEventsByTimeRange');
  }

  countEvents(sessionId, filter) {
    throw new Error('Method not implemented: countEvents');
  }

  paginateEvents(sessionId, page, pageSize) {
    throw new Error('Method not implemented: paginateEvents');
  }
}

module.exports = {
  TRANSCRIPT_QUERY_CONSTANTS,
  TranscriptQueryPort
};

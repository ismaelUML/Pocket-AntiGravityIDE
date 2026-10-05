// Contrato de políticas de caché y optimización de lecturas repetidas de transcripción.
// Desacopla implementaciones basadas en LRU, Redis o memoria local transitoria.

const TRANSCRIPT_CACHE_STRATEGY = {
  STRATEGY_LRU: 'lru',
  STRATEGY_FIFO: 'fifo',
  MAX_CACHED_SESSIONS: 50,
  DEFAULT_TTL_MS: 60000,
  EVICT_ON_MEMORY_PRESSURE: true,
  PERSIST_CACHE_INDEX: false,
  ENABLE_WARMING: false,
  MAX_ITEM_BYTES: 1048576,
  COLLECT_HIT_STATS: true,
  STALE_WHILE_REVALIDATE: true
};

class TranscriptCachePort {
  getCache(sessionId, key) {
    throw new Error('Method not implemented: getCache');
  }

  setCache(sessionId, key, value, ttl) {
    throw new Error('Method not implemented: setCache');
  }

  invalidateCache(sessionId, key) {
    throw new Error('Method not implemented: invalidateCache');
  }

  purgeSessionCache(sessionId) {
    throw new Error('Method not implemented: purgeSessionCache');
  }

  getCacheMetrics() {
    throw new Error('Method not implemented: getCacheMetrics');
  }
}

module.exports = {
  TRANSCRIPT_CACHE_STRATEGY,
  TranscriptCachePort
};

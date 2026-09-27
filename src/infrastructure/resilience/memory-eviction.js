// Política defensiva de desalojo de memoria (Eviction) y límites de retención.
// Servicios que corren días enteros en background van acumulando historiales, sets de sesiones
// y buffers que silent-leakean memoria.
// Este módulo monitorea el Heap de Node.js y purga registros antiguos en base a límites FIFO/LRU
// o cuando la memoria supera el umbral de advertencia configurado.

const DEFAULT_MAX_ITEMS = 100;
const DEFAULT_HEAP_THRESHOLD_MB = 250;

class MemoryEvictionGuard {
  constructor({ maxItems = DEFAULT_MAX_ITEMS, heapThresholdMb = DEFAULT_HEAP_THRESHOLD_MB } = {}) {
    this.maxItems = maxItems;
    this.heapThresholdBytes = heapThresholdMb * 1024 * 1024;
  }

  /**
   * Obtiene métricas actuales del heap de Node.js
   */
  getMemoryStats() {
    const mem = process.memoryUsage();
    return {
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      isPressureHigh: mem.heapUsed > this.heapThresholdBytes
    };
  }

  /**
   * Aplica la política de desalojo sobre una colección de tipo Set o Map.
   * Si supera el límite o hay presión de memoria, elimina los elementos más antiguos (FIFO).
   * @param {Set|Map|Array} collection
   * @param {number} [targetLimit]
   * @returns {number} Cantidad de elementos desalojados
   */
  evictOldest(collection, targetLimit = this.maxItems) {
    let evictedCount = 0;
    const isHigh = process.memoryUsage().heapUsed > this.heapThresholdBytes;
    const effectiveLimit = isHigh ? Math.floor(targetLimit * 0.7) : targetLimit;

    if (collection instanceof Set) {
      while (collection.size > effectiveLimit) {
        const oldest = collection.values().next().value;
        if (oldest === undefined) break;
        collection.delete(oldest);
        evictedCount++;
      }
    } else if (collection instanceof Map) {
      while (collection.size > effectiveLimit) {
        const oldestKey = collection.keys().next().value;
        if (oldestKey === undefined) break;
        collection.delete(oldestKey);
        evictedCount++;
      }
    } else if (Array.isArray(collection)) {
      while (collection.length > effectiveLimit) {
        collection.shift();
        evictedCount++;
      }
    }

    if (evictedCount > 0) {
      console.log(`[MemoryEvictionGuard] Evicted ${evictedCount} stale entries (Heap pressure: ${isHigh ? 'HIGH' : 'NORMAL'}).`);
    }

    return evictedCount;
  }
}

module.exports = {
  MemoryEvictionGuard,
  DEFAULT_MAX_ITEMS,
  DEFAULT_HEAP_THRESHOLD_MB
};

// Política defensiva de desalojo de memoria (Eviction) y límites de retención.
// Monitorea el Heap de Node.js y purga registros antiguos en base a límites FIFO
// o cuando la memoria supera el umbral de advertencia configurado.
const { EvictionPolicyPort } = require('./resilience.port');
const { readMemoryStats, evictCollection } = require('./eviction-strategy');

const DEFAULT_MAX_ITEMS = 100;
const DEFAULT_HEAP_THRESHOLD_MB = 250;
const PRESSURE_TAG = { true: 'HIGH', false: 'NORMAL' };

class MemoryEvictionGuard extends EvictionPolicyPort {
  constructor({ maxItems = DEFAULT_MAX_ITEMS, heapThresholdMb = DEFAULT_HEAP_THRESHOLD_MB } = {}) {
    super();
    this.maxItems = maxItems;
    this.heapThresholdBytes = heapThresholdMb * 1024 * 1024;
  }

  getMemoryStats() {
    return readMemoryStats(this.heapThresholdBytes);
  }

  evictOldest(collection, targetLimit = this.maxItems) {
    const isHigh = process.memoryUsage().heapUsed > this.heapThresholdBytes;
    const limit = isHigh ? Math.floor(targetLimit * 0.7) : targetLimit;
    const count = evictCollection(collection, limit);

    if (count > 0) {
      console.log(`[MemoryEvictionGuard] Evicted ${count} stale entries (Heap pressure: ${PRESSURE_TAG[Boolean(isHigh)]}).`);
    }

    return count;
  }
}

module.exports = {
  MemoryEvictionGuard,
  DEFAULT_MAX_ITEMS,
  DEFAULT_HEAP_THRESHOLD_MB
};

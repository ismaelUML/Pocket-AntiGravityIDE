// Estrategia de desalojo de memoria y lectura de métricas del heap.
// Aísla los algoritmos de poda FIFO sobre colecciones (Map, Set, Array).

function readMemoryStats(heapThresholdBytes) {
  const mem = process.memoryUsage();
  return {
    heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
    heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
    rssMb: Math.round(mem.rss / (1024 * 1024)),
    isPressureHigh: mem.heapUsed > heapThresholdBytes
  };
}

function evictCollection(collection, limit) {
  let count = 0;
  if (Array.isArray(collection)) {
    while (collection.length > limit) {
      collection.shift();
      count++;
    }
    return count;
  }

  while (collection.size > limit) {
    const key = collection.keys().next().value;
    if (key === undefined) break;
    collection.delete(key);
    count++;
  }
  return count;
}

module.exports = {
  readMemoryStats,
  evictCollection
};

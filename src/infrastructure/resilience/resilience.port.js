// Contratos abstractos de infraestructura para políticas de resiliencia, retención de memoria y contrapresión.
// Permiten desacoplar consumidores de implementaciones concretas como CircuitBreaker, MemoryEvictionGuard o PromptQueue.

class ResiliencePolicyPort {
  async execute(action, fallback = null) {
    throw new Error('Method not implemented');
  }
}

class EvictionPolicyPort {
  evictOldest(collection, targetLimit) {
    throw new Error('Method not implemented');
  }
}

class BackpressurePolicyPort {
  enqueue(item, signal = null) {
    throw new Error('Method not implemented');
  }
}

class CircuitBreakerPort extends ResiliencePolicyPort {
  getState() {
    throw new Error('Method not implemented');
  }

  reset() {
    throw new Error('Method not implemented');
  }
}

class MemorySensorPort {
  getMemoryStats() {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  ResiliencePolicyPort,
  EvictionPolicyPort,
  BackpressurePolicyPort,
  CircuitBreakerPort,
  MemorySensorPort
};

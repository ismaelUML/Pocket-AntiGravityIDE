// Circuit Breaker defensivo para servicios y proveedores externos.
// En producción, si un servicio externo (como Cloudflare Tunnel o un endpoint de red)
// empieza a fallar o te bloquea, desvía al fallback silencioso y prueba rescate.
const { CircuitState } = require('./circuit-state');

function callFallback(fallbackAction, err) {
  if (typeof fallbackAction === 'function') {
    return fallbackAction(err);
  }
  throw err;
}

class CircuitBreaker extends CircuitState {
  constructor({ failureThreshold = 3, resetTimeoutMs = 30000, name = 'Service' } = {}) {
    super({ failureThreshold, resetTimeoutMs });
    this.name = name;
  }

  async execute(primaryAction, fallbackAction = null) {
    this.checkHalfOpen();

    if (this.state === 'OPEN') {
      const openErr = new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Fast failing to backup.`);
      return await callFallback(fallbackAction, openErr);
    }

    try {
      const result = await primaryAction();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      return await callFallback(fallbackAction, err);
    }
  }

  getState() {
    this.checkHalfOpen();
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

module.exports = { CircuitBreaker };

// Circuit Breaker defensivo para servicios y proveedores externos.
// En producción, si un servicio externo (como Cloudflare Tunnel o un endpoint de red)
// empieza a fallar o te bloquea, seguir bombardeándolo cada 2 segundos es una locura:
// congela sockets, satura hilos y deja la app colgada.
// Este breaker corta el circuito tras N fallas (OPEN), desvía automáticamente al fallback
// silencioso y después de un tiempo prudencial prueba un único intento de rescate (HALF_OPEN).

class CircuitBreaker {
  constructor({ failureThreshold = 3, resetTimeoutMs = 30000, name = 'Service' } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  // Verifica si el circuito puede transicionar de OPEN a HALF_OPEN por tiempo cumplido
  _checkHalfOpen() {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      }
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  _onFailure(err) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  /**
   * Ejecuta la acción primaria protegida. Si el circuito está abierto o falla,
   * se conmuta automáticamente al fallback silencioso sin tirar la casa por la ventana.
   */
  async execute(primaryAction, fallbackAction = null) {
    this._checkHalfOpen();

    if (this.state === 'OPEN') {
      if (typeof fallbackAction === 'function') {
        return await fallbackAction(new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Fast failing to backup.`));
      }
      throw new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN. Primary service blocked.`);
    }

    try {
      const result = await primaryAction();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err);
      if (typeof fallbackAction === 'function') {
        return await fallbackAction(err);
      }
      throw err;
    }
  }

  getState() {
    this._checkHalfOpen();
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

module.exports = { CircuitBreaker };

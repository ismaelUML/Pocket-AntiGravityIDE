// Manejador de estado y transición de tiempos para CircuitBreaker.
// Aísla el cálculo de lapsos y umbrales de fallo en infraestructura.

class CircuitState {
  constructor({ failureThreshold = 3, resetTimeoutMs = 30000 } = {}) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  checkHalfOpen() {
    const elapsed = Date.now() - this.lastFailureTime;
    if (this.state === 'OPEN' && elapsed >= this.resetTimeoutMs) {
      this.state = 'HALF_OPEN';
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

module.exports = { CircuitState };

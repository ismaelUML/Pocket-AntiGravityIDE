// Estado reactivo y despacho de observadores para el gestor de túneles.
const { CircuitBreaker } = require('../resilience/circuit-breaker');
const { ObservableState } = require('./observable-state');

class TunnelState extends ObservableState {
  constructor() {
    super();
    this.status = 'stopped';
    this.publicUrl = null;
    this.provider = null;
    this.error = null;
    this.cfBreaker = new CircuitBreaker({
      name: 'CloudflareTunnel',
      failureThreshold: 2,
      resetTimeoutMs: 60000
    });
  }

  getSnapshot() {
    return {
      active: this.status === 'active',
      status: this.status,
      publicUrl: this.publicUrl,
      provider: this.provider,
      error: this.error,
      circuitBreaker: this.cfBreaker.getState()
    };
  }

  notify() {
    this.notifySnapshot(this.getSnapshot());
  }

  isAlreadyRunning() {
    return this.status === 'active' || this.status === 'starting';
  }

  isPendingUrl() {
    return !this.publicUrl;
  }

  resetForStart() {
    this.status = 'starting';
    this.publicUrl = null;
    this.error = null;
    this.notify();
  }

  markSuccess(url, provider) {
    this.publicUrl = url;
    this.status = 'active';
    this.provider = provider;
    this.cfBreaker.onSuccess();
    this.notify();
  }

  markStopped() {
    this.status = 'stopped';
    this.publicUrl = null;
    this.provider = null;
    this.error = null;
    this.notify();
  }
}

module.exports = { TunnelState };

// Gestor de túneles públicos con Circuit Breaker y Conmutación por Fallo (Failover).
const { TunnelManagerPort } = require('./system.port');
const { killProcessTree } = require('./tunnel-runner');
const { TunnelState } = require('./tunnel-state');
const { coordinateTunnelStart } = require('./tunnel-coordinator');

class TunnelManager extends TunnelManagerPort {
  constructor(state = new TunnelState()) {
    super();
    this._state = state;
    this._process = null;
    Object.defineProperty(this, '_status', {
      get: () => this._state.status,
      set: (v) => { this._state.status = v; },
      configurable: true
    });
  }

  getStatus() {
    return this._state.getSnapshot();
  }

  onStatusChange(callback) {
    return this._state.addListener(callback);
  }

  _notify() {
    this._state.notify();
  }

  start(port = 3000) {
    if (this._state.isAlreadyRunning()) {
      return Promise.resolve(this.getStatus());
    }

    return coordinateTunnelStart(this._state, port, (proc) => {
      this._process = proc;
    });
  }

  stop() {
    if (this._process) {
      killProcessTree(this._process);
      this._process = null;
    }
    this._state.markStopped();
    return this.getStatus();
  }
}

module.exports = { TunnelManager };

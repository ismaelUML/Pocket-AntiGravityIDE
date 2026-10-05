// Base observable con registro seguro y notificación de observadores.

class ObservableState {
  constructor() {
    this.listeners = new Set();
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _safeCallListener(listener, snapshot) {
    try {
      listener(snapshot);
    } catch (_) {}
  }

  notifySnapshot(snapshot) {
    for (const listener of this.listeners) {
      this._safeCallListener(listener, snapshot);
    }
  }
}

module.exports = { ObservableState };

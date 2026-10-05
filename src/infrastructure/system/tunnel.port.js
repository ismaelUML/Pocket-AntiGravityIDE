// Contratos abstractos para gestión de túneles y observación de estado reactivo.

class TunnelManagerPort {
  getStatus() {
    throw new Error('TunnelManagerPort.getStatus must be implemented by adapter');
  }

  onStatusChange(_callback) {
    throw new Error('TunnelManagerPort.onStatusChange must be implemented by adapter');
  }

  start(_port = 3000) {
    throw new Error('TunnelManagerPort.start must be implemented by adapter');
  }

  stop() {
    throw new Error('TunnelManagerPort.stop must be implemented by adapter');
  }
}

class TunnelStatePort {
  getSnapshot() {
    throw new Error('TunnelStatePort.getSnapshot must be implemented by adapter');
  }

  addListener(_callback) {
    throw new Error('TunnelStatePort.addListener must be implemented by adapter');
  }

  notify() {
    throw new Error('TunnelStatePort.notify must be implemented by adapter');
  }
}

module.exports = {
  TunnelManagerPort,
  TunnelStatePort
};

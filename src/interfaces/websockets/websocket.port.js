// Contrato de interfaz para el servidor de WebSockets en tiempo real.
// Desacopla la orquestación HTTP y el server de la implementación concreta de ws.

class WebSocketServerPort {
  init() {
    throw new Error('Method not implemented');
  }

  broadcast(payload) {
    throw new Error('Method not implemented');
  }

  broadcastChanges() {
    throw new Error('Method not implemented');
  }

  getClientCount() {
    throw new Error('Method not implemented');
  }
}

class WebSocketClientPort {
  send(payload) {
    throw new Error('Method not implemented');
  }

  close(code, reason) {
    throw new Error('Method not implemented');
  }

  get readyState() {
    throw new Error('Method not implemented');
  }

  get isAuthenticated() {
    throw new Error('Method not implemented');
  }
}

module.exports = { WebSocketServerPort, WebSocketClientPort };


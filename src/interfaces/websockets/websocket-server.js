// Manejador del Servidor WebSocket para streaming reactivo en vivo.
const WebSocket = require('ws');
const { getActiveWorkspaceRoot } = require('../../infrastructure/workspace/resolver');
const { WebSocketServerPort } = require('./websocket.port');
const { broadcastToClients } = require('./websocket-broadcaster');
const { handleConnection, sendInitPayload } = require('./websocket-connection-manager');

class WebSocketServerHandler extends WebSocketServerPort {
  constructor({ server, reviewChangesUseCase, ideAutomationPort, getActiveSessionId, tunnelManager }) {
    super();
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.reviewChanges = reviewChangesUseCase;
    this.ideAutomation = ideAutomationPort;
    this.getActiveSessionId = getActiveSessionId;
    this.tunnelManager = tunnelManager;

    this.currentChatState = { stateString: 'READY', isChatOpen: true, isChatFocused: false };

    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      handleConnection(this, ws, req);
    });
    setInterval(() => {
      this._periodicRefresh();
    }, 30000);
  }

  _periodicRefresh() {
    if (this.wss.clients.size > 0) {
      this.broadcastChanges();
    }
  }

  async sendInitPayload(ws) {
    return sendInitPayload(this, ws);
  }

  broadcast(payload) {
    broadcastToClients(this.wss.clients, payload);
  }

  async broadcastChanges() {
    try {
      const changes = await this.reviewChanges.getChanges(getActiveWorkspaceRoot());
      this.broadcast({
        type: 'CHANGES_UPDATED',
        changes
      });
    } catch (_) {}
  }

  getClientCount() {
    return this.wss.clients.size;
  }
}

module.exports = { WebSocketServerHandler };

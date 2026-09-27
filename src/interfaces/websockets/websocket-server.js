// Manejador del Servidor WebSocket para streaming reactivo en vivo.
// Protegido con Surgical Origin Guard: rechaza intentos de conexión desde páginas
// web maliciosas de terceros.
const WebSocket = require('ws');
const { loadConfig, validateToken } = require('../../infrastructure/security/pin-auth');
const { isOriginAllowed } = require('../../infrastructure/security/origin-guard');
const { getActiveWorkspaceRoot } = require('../../infrastructure/workspace/resolver');

class WebSocketServerHandler {
  constructor({ server, reviewChangesUseCase, ideAutomationPort, getActiveSessionId, tunnelManager }) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.reviewChanges = reviewChangesUseCase;
    this.ideAutomation = ideAutomationPort;
    this.getActiveSessionId = getActiveSessionId;
    this.tunnelManager = tunnelManager;

    this.currentChatState = { stateString: 'READY', isChatOpen: true, isChatFocused: false };

    this.init();
  }

  init() {
    this.wss.on('connection', async (ws, req) => {
      // Bloqueo quirúrgico de orígenes cruzados en WebSocket
      const origin = req.headers.origin;
      if (!isOriginAllowed(origin, { tunnelManager: this.tunnelManager })) {
        console.warn(`[WebSocket] Blocked unauthorized connection from origin: ${origin}`);
        ws.close(1008, 'Origin unauthorized');
        return;
      }

      const config = loadConfig();
      const urlParams = new URLSearchParams((req.url.split('?')[1]) || '');
      const token = urlParams.get('token');

      if (!config.pin || validateToken(token)) {
        ws.isAuthenticated = true;
        await this._sendInitPayload(ws);
      } else {
        ws.isAuthenticated = false;
        ws.send(JSON.stringify({
          type: 'AUTH_REQUIRED',
          error: 'Authentication required. Please enter your PIN.'
        }));
      }

      ws.on('message', async (message) => {
        await this._handleClientMessage(ws, message);
      });

      ws.on('close', () => {});
    });

    // Fallback suave periódico cada 30s solo si hay clientes conectados
    setInterval(async () => {
      if (this.wss.clients.size > 0) {
        this.broadcastChanges();
      }
    }, 30000);
  }

  async _sendInitPayload(ws) {
    const changes = await this.reviewChanges.getChanges(getActiveWorkspaceRoot());
    ws.send(JSON.stringify({
      type: 'INIT',
      activeConversationId: this.getActiveSessionId(),
      chatState: this.currentChatState,
      changes
    }));
  }

  async _handleClientMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      if (data.type === 'AUTH') {
        await this._handleAuthMessage(ws, data.token);
      } else if (data.type === 'REFRESH_CHANGES' && ws.isAuthenticated) {
        const changes = await this.reviewChanges.getChanges(getActiveWorkspaceRoot());
        ws.send(JSON.stringify({ type: 'CHANGES_UPDATED', changes }));
      } else if (data.type === 'CHECK_CHAT_STATE' && ws.isAuthenticated) {
        const state = await this.ideAutomation.getChatState();
        this.currentChatState = state;
        ws.send(JSON.stringify({ type: 'CHAT_STATE_UPDATE', state }));
      }
    } catch (_) {}
  }

  async _handleAuthMessage(ws, token) {
    if (validateToken(token)) {
      ws.isAuthenticated = true;
      await this._sendInitPayload(ws);
    } else {
      ws.send(JSON.stringify({
        type: 'AUTH_FAILED',
        error: 'Invalid or expired token.'
      }));
    }
  }

  broadcast(payload) {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
        client.send(raw);
      }
    });
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
    return this.wss && this.wss.clients ? this.wss.clients.size : 0;
  }
}

module.exports = { WebSocketServerHandler };

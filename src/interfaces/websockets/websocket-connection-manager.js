// Gestor de conexión, autenticación inicial y handshake WebSocket.
const { loadConfig, validateToken } = require('../../infrastructure/security/pin-auth');
const { isOriginAllowed } = require('../../infrastructure/security/origin-guard');
const { getActiveWorkspaceRoot } = require('../../infrastructure/workspace/resolver');
const { AUTH_REQUIRED_MSG, dispatchClientMessage } = require('./websocket-message-dispatcher');

async function sendInitPayload(handler, ws) {
  const changes = await handler.reviewChanges.getChanges(getActiveWorkspaceRoot());
  ws.send(JSON.stringify({
    type: 'INIT',
    activeConversationId: handler.getActiveSessionId(),
    chatState: handler.currentChatState,
    changes
  }));
}

async function authenticateConnection(handler, ws, req) {
  const config = loadConfig();
  const token = new URLSearchParams(req.url.split('?')[1]).get('token');
  const isAllowed = !config.pin || validateToken(token);

  if (isAllowed) {
    ws.isAuthenticated = true;
    return await sendInitPayload(handler, ws);
  }
  ws.isAuthenticated = false;
  ws.send(AUTH_REQUIRED_MSG);
}

async function handleConnection(handler, ws, req) {
  const origin = req.headers.origin;
  if (!isOriginAllowed(origin, { tunnelManager: handler.tunnelManager })) {
    console.warn(`[WebSocket] Blocked unauthorized connection from origin: ${origin}`);
    ws.close(1008, 'Origin unauthorized');
    return;
  }

  await authenticateConnection(handler, ws, req);
  ws.on('message', (msg) => {
    dispatchClientMessage(handler, ws, msg);
  });
}

module.exports = {
  handleConnection,
  sendInitPayload,
  authenticateConnection
};

// Despachador de mensajes y comandos recibidos desde clientes WebSocket.
const { validateToken } = require('../../infrastructure/security/pin-auth');
const { handleRefreshChanges, handleCheckChatState } = require('./websocket-command-handlers');

const AUTH_REQUIRED_MSG = JSON.stringify({
  type: 'AUTH_REQUIRED',
  error: 'Authentication required. Please enter your PIN.'
});

const AUTH_FAILED_MSG = JSON.stringify({
  type: 'AUTH_FAILED',
  error: 'Invalid or expired token.'
});

async function handleAuthMessage(handler, ws, token) {
  if (validateToken(token)) {
    ws.isAuthenticated = true;
    return await handler.sendInitPayload(ws);
  }
  ws.send(AUTH_FAILED_MSG);
}

async function dispatchClientMessage(handler, ws, message) {
  try {
    const data = JSON.parse(message);
    if (data.type === 'AUTH') {
      return await handleAuthMessage(handler, ws, data.token);
    }
    if (data.type === 'REFRESH_CHANGES') {
      return await handleRefreshChanges(handler, ws);
    }
    if (data.type === 'CHECK_CHAT_STATE') {
      return await handleCheckChatState(handler, ws);
    }
  } catch (_) {}
}

module.exports = {
  dispatchClientMessage,
  handleAuthMessage,
  AUTH_REQUIRED_MSG,
  AUTH_FAILED_MSG
};

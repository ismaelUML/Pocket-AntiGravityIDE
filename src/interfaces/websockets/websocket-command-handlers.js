// Manejadores de comandos de actualización de cambios y estado de chat para WebSocket.
const { getActiveWorkspaceRoot } = require('../../infrastructure/workspace/resolver');

async function handleRefreshChanges(handler, ws) {
  if (!ws.isAuthenticated) return;
  const changes = await handler.reviewChanges.getChanges(getActiveWorkspaceRoot());
  ws.send(JSON.stringify({ type: 'CHANGES_UPDATED', changes }));
}

async function handleCheckChatState(handler, ws) {
  if (!ws.isAuthenticated) return;
  const state = await handler.ideAutomation.getChatState();
  handler.currentChatState = state;
  ws.send(JSON.stringify({ type: 'CHAT_STATE_UPDATE', state }));
}

module.exports = {
  handleRefreshChanges,
  handleCheckChatState
};

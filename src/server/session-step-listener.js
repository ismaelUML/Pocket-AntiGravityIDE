// Retransmisión de pasos de transcripción hacia clientes WebSocket.

function handleTranscriptStep(convId, stepData, wsHandler) {
  if (!wsHandler) return;
  wsHandler.broadcast({
    type: 'TRANSCRIPT_STEP',
    conversationId: convId,
    step: stepData
  });
  const isDone = stepData.type === 'PLANNER_RESPONSE' || stepData.status === 'DONE';
  if (isDone) {
    setTimeout(() => {
      wsHandler.broadcastChanges();
    }, 500);
  }
}

function watchSessionTranscript(manageSessionsUseCase, sessionId, getWsHandler) {
  if (!sessionId || sessionId === 'NEW_PENDING_SESSION') return;
  manageSessionsUseCase.watchSession(sessionId, (convId, stepData) => {
    handleTranscriptStep(convId, stepData, getWsHandler());
  });
}

module.exports = {
  handleTranscriptStep,
  watchSessionTranscript
};

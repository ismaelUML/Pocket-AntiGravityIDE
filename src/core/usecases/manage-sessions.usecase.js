// Caso de uso: Gestión de sesiones de chat, lectura de transcripts y resolución de artefactos.
// Desacoplado: delega toda la persistencia al puerto TranscriptPort y la automatización a IdeAutomationPort.
class ManageSessionsUseCase {
  constructor({ transcriptPort, ideAutomationPort }) {
    this.transcript = transcriptPort;
    this.ideAutomation = ideAutomationPort;
  }

  listSessions() {
    return this.transcript.listSessions();
  }

  async readTranscript(conversationId) {
    return await this.transcript.readTranscript(conversationId);
  }

  watchSession(conversationId, onStep) {
    this.transcript.watchSession(conversationId, onStep);
  }

  readArtifact(conversationId, rawPath, workspaceRoot) {
    return this.transcript.readArtifact(conversationId, rawPath, workspaceRoot);
  }

  async startNewSession() {
    return await this.ideAutomation.startNewConversation();
  }
}

module.exports = { ManageSessionsUseCase };

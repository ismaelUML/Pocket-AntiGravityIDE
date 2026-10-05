// Contratos abstractos de automatización de interfaz y cola de ejecución.
// Cumple el principio de inversión de dependencias y aporta abstracción a la arquitectura.
const { PromptQueuePort } = require('./prompt-queue.port');

class IdeAutomationPort {
  sendPrompt(prompt, options) {
    throw new Error('IdeAutomationPort.sendPrompt: Method not implemented');
  }

  startNewConversation() {
    throw new Error('IdeAutomationPort.startNewConversation: Method not implemented');
  }

  acceptFocusedHunk() {
    throw new Error('IdeAutomationPort.acceptFocusedHunk: Method not implemented');
  }

  getChatState() {
    throw new Error('IdeAutomationPort.getChatState: Method not implemented');
  }

  getPendingQueueCount() {
    throw new Error('IdeAutomationPort.getPendingQueueCount: Method not implemented');
  }
}

class MediaInjectorPort {
  injectMedia(options) {
    throw new Error('MediaInjectorPort.injectMedia: Method not implemented');
  }
}

class ClipboardInjectorPort {
  injectText(options) {
    throw new Error('ClipboardInjectorPort.injectText: Method not implemented');
  }
}

module.exports = {
  IdeAutomationPort,
  PromptQueuePort,
  MediaInjectorPort,
  ClipboardInjectorPort
};

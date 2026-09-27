const { IdeAutomationPort } = require('../../core/ports/ide-automation.port');
const PromptQueue = require('./queue');
const { getChatState } = require('./check-chat-state');
const { triggerIdeAccept } = require('./diff-acceptor');

/**
 * Windows Win32 OS automation adapter implementing IdeAutomationPort.
 */
class Win32AutomationAdapter extends IdeAutomationPort {
  constructor(options = {}) {
    super();
    this.queue = new PromptQueue(options);
  }

  async sendPrompt(prompt, options = {}) {
    return await this.queue.enqueue({
      text: prompt.text,
      filePath: prompt.filePath,
      uploadedImage: prompt.uploadedImage,
      focusShortcut: prompt.focusShortcut,
      method: prompt.method,
      newChat: false
    }, options.signal);
  }

  async startNewConversation(options = {}) {
    return await this.queue.enqueue({
      newChat: true
    }, options.signal);
  }

  async acceptFocusedHunk() {
    return await triggerIdeAccept();
  }

  async getChatState() {
    return await getChatState();
  }

  getPendingQueueCount() {
    return this.queue.getPendingCount();
  }
}

module.exports = { Win32AutomationAdapter };

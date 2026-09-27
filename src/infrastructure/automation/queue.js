// Cola serializada de inyección con Backpressure y Cancelación en Cascada (Socket-Level Abort).
// Regla de supervivencia: NO permitir encolamiento infinito. Si dejamos que alguien spamee 50 prompts,
// el portapapeles de Windows se vuelve un campo de batalla y la memoria se satura.
// Limitamos a MAX_QUEUE_SIZE y si el cliente cierra el navegador/socket, abortamos el proceso
// de inmediato para no quemar ciclos de CPU en la nada.
const fs = require('fs');
const { injectText } = require('./clipboard-injector');
const { injectMedia } = require('./media-injector');

const DEFAULT_MAX_QUEUE_SIZE = 10;

class PromptQueue {
  constructor(options = {}) {
    this.maxQueueSize = options.maxQueueSize || DEFAULT_MAX_QUEUE_SIZE;
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(item, signal = null) {
    if (signal && signal.aborted) {
      this._cleanupTempUpload(item.uploadedImage);
      return Promise.resolve({ success: false, aborted: true, error: 'Request already aborted by client.' });
    }

    // Contrapresión / Backpressure: Rechazo inmediato si la cola está hasta el cuello
    if (this.queue.length >= this.maxQueueSize) {
      this._cleanupTempUpload(item.uploadedImage);
      return Promise.resolve({
        success: false,
        capacityError: true,
        error: `Queue capacity limit reached (${this.maxQueueSize} items). Server is busy; please retry shortly.`
      });
    }

    return new Promise((resolve) => {
      const entry = { item, resolve, signal };

      if (signal) {
        signal.addEventListener('abort', () => this._handleEarlyAbort(entry), { once: true });
      }

      this.queue.push(entry);
      this.checkAndProcess();
    });
  }

  _handleEarlyAbort(entry) {
    const idx = this.queue.indexOf(entry);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
      this._cleanupTempUpload(entry.item.uploadedImage);
      entry.resolve({ success: false, aborted: true, error: 'Request aborted while waiting in queue.' });
    }
  }

  _cleanupTempUpload(filePath) {
    if (!filePath) return;
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (_) {
      // Si el archivo está tomado momentáneamente, no bloqueamos la cola; el OS lo barrerá luego
    }
  }

  setAgentBusy() {
    // Compatibilidad legacy
  }

  async _executeItem(item, signal) {
    if (item.uploadedImage || item.filePath) {
      return await injectMedia({
        imagePath: item.uploadedImage,
        filePath: item.filePath,
        text: item.text,
        targetTitle: 'Antigravity IDE',
        processName: 'Antigravity IDE',
        focusDelayMs: 600,
        pasteDelayMs: 300,
        submitEnter: true,
        signal
      });
    }

    return await injectText({
      text: item.text,
      targetTitle: 'Antigravity IDE',
      processName: 'Antigravity IDE',
      focusDelayMs: 600,
      pasteDelayMs: 300,
      submitEnter: true,
      focusShortcut: item.focusShortcut || 'Auto',
      method: item.method || 'keybd_event',
      newChat: Boolean(item.newChat),
      signal
    });
  }

  async checkAndProcess() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { item, resolve, signal } = this.queue.shift();

    try {
      if (signal && signal.aborted) {
        this._cleanupTempUpload(item.uploadedImage);
        resolve({ success: false, aborted: true, error: 'Request aborted before start.' });
        return;
      }

      const result = await this._executeItem(item, signal);
      resolve(result);
    } catch (err) {
      console.error('[PromptQueue] Unexpected error executing item:', err.message);
      resolve({ success: false, error: err.message });
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.checkAndProcess(), 300);
      }
    }
  }

  getPendingCount() {
    return this.queue.length;
  }
}

module.exports = PromptQueue;

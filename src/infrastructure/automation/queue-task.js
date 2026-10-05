// Encapsula una tarea individual en la cola de inyección de prompts.
const { cleanupTempUpload, dispatchInjection } = require('./queue-injector');

class QueueTask {
  constructor(item, resolve, signal = null, onAbort = null) {
    this.item = item;
    this.resolve = resolve;
    this.signal = signal;
    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  }

  abort(reason) {
    cleanupTempUpload(this.item.uploadedImage);
    this.resolve({ success: false, aborted: true, error: reason });
  }

  async execute() {
    try {
      this.resolve(await dispatchInjection(this.item, this.signal));
    } catch (err) {
      this.resolve({ success: false, error: err.message });
    }
  }

  static validate(queueLength, maxSize, item, signal) {
    if (signal?.aborted) {
      cleanupTempUpload(item.uploadedImage);
      return { success: false, aborted: true, error: 'Request already aborted by client.' };
    }
    if (queueLength >= maxSize) {
      cleanupTempUpload(item.uploadedImage);
      return {
        success: false,
        capacityError: true,
        error: `Queue capacity limit reached (${maxSize} items). Server is busy; please retry shortly.`
      };
    }
    return null;
  }
}

module.exports = { QueueTask };

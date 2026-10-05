// Cola serializada de inyección con Backpressure y Cancelación en Cascada (Socket-Level Abort).
const { PromptQueuePort } = require('./automation.port');
const { QueueTask } = require('./queue-task');

const DEFAULT_MAX_QUEUE_SIZE = 10;

class PromptQueue extends PromptQueuePort {
  constructor({ maxQueueSize = DEFAULT_MAX_QUEUE_SIZE } = {}) {
    super();
    this.maxQueueSize = maxQueueSize;
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(item, signal = null) {
    const rejection = QueueTask.validate(this.queue.length, this.maxQueueSize, item, signal);
    if (rejection) return Promise.resolve(rejection);

    return new Promise((resolve) => {
      const task = new QueueTask(item, resolve, signal, () => this._handleEarlyAbort(task));
      this.queue.push(task);
      this.checkAndProcess();
    });
  }

  _handleEarlyAbort(task) {
    const idx = this.queue.indexOf(task);
    if (idx >= 0) {
      this.queue.splice(idx, 1);
      task.abort('Request aborted while waiting in queue.');
    }
  }

  async checkAndProcess() {
    if (this.isProcessing) return;
    const task = this.queue.shift();
    if (!task) return;

    this.isProcessing = true;
    try {
      await task.execute();
    } finally {
      this.isProcessing = false;
      setTimeout(this.checkAndProcess.bind(this), 300);
    }
  }

  getPendingCount() {
    return this.queue.length;
  }
}

module.exports = PromptQueue;

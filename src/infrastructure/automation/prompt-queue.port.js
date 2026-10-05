// Contrato abstracto para la cola de despacho y control de contrapresión.

class PromptQueuePort {
  enqueue(item, signal) {
    throw new Error('PromptQueuePort.enqueue: Method not implemented');
  }

  checkAndProcess() {
    throw new Error('PromptQueuePort.checkAndProcess: Method not implemented');
  }

  getPendingCount() {
    throw new Error('PromptQueuePort.getPendingCount: Method not implemented');
  }
}

module.exports = { PromptQueuePort };

// Contrato para observación reactiva de transcripciones en tiempo real.
// Desacopla el watcher del sistema de archivos fs.watch.

class TranscriptWatcherPort {
  start(conversationId) {
    throw new Error('Method not implemented');
  }

  readNewLines(filePath) {
    throw new Error('Method not implemented');
  }

  stop() {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  TranscriptWatcherPort
};

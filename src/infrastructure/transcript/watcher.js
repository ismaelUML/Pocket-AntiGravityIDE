// Lector de streaming para los logs de Antigravity.
// Cero scraping de pantalla: lee reactivamente transcript.jsonl para retransmitir pasos en vivo.
const chokidar = require('chokidar');
const { DEFAULT_BRAIN_DIR, sanitizeSessionId } = require('./reader');
const { TranscriptWatcherPort } = require('./transcript-watcher.port');
const { resolveTargetId, resolveTranscriptPath } = require('./watcher-path-resolver');
const {
  resolveInitialPosition,
  streamNewLines
} = require('./watcher-line-reader');

class TranscriptWatcher {
  constructor({ brainDir = DEFAULT_BRAIN_DIR, onNewStep = null } = {}) {
    this.brainDir = brainDir;
    this.onNewStep = onNewStep || function() {};
    this.activeConversationId = null;
    this.watcher = null;
    this.filePosition = 0;
  }

  start(conversationId = null) {
    this.activeConversationId = resolveTargetId(conversationId, this.brainDir);
    const safeId = sanitizeSessionId(this.activeConversationId);
    if (!safeId) {
      console.log('[Watcher] No active conversation found to watch.');
      return;
    }

    const transcriptPath = resolveTranscriptPath(safeId, this.brainDir);
    if (!transcriptPath) {
      console.error('[Watcher] Path traversal attempt blocked.');
      return;
    }

    const safeLogPath = transcriptPath.replace(/[\r\n]/g, '');
    console.log(`[Watcher] Watching transcript log: ${safeLogPath}`);

    this.filePosition = resolveInitialPosition(transcriptPath);
    this.stop();

    this.watcher = chokidar.watch(transcriptPath, {
      persistent: true,
      usePolling: true,
      interval: 300
    });

    this.watcher.on('change', () => {
      this.readNewLines(transcriptPath);
    });
  }

  readNewLines(filePath) {
    streamNewLines(
      filePath,
      this.filePosition,
      this.onNewStep,
      this.activeConversationId,
      (newPos) => {
        this.filePosition = newPos;
      }
    );
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

TranscriptWatcher.TranscriptWatcher = TranscriptWatcher;
TranscriptWatcher.TranscriptWatcherPort = TranscriptWatcherPort;

module.exports = TranscriptWatcher;

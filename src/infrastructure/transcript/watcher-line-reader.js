// Lector de streaming y parsing de líneas para el observador de transcripciones.
const fs = require('fs');
const { processStreamChunks, streamNewLines: processStream } = require('./watcher-stream-processor');

function resolveInitialPosition(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  } catch (_) {
    return 0;
  }
}

function parseTranscriptLine(line, onNewStep, conversationId) {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    onNewStep(conversationId, JSON.parse(trimmed));
  } catch (_) {}
}

function streamNewLines(filePath, currentPos, onStep, convId, onPositionUpdated) {
  processStream(
    filePath,
    currentPos,
    onStep,
    convId,
    onPositionUpdated,
    resolveInitialPosition,
    parseTranscriptLine
  );
}

module.exports = {
  resolveInitialPosition,
  parseTranscriptLine,
  processStreamChunks,
  streamNewLines
};

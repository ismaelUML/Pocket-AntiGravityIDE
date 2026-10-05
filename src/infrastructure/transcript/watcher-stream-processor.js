// Procesador de streams para lectura continua de transcripts en chunks.
const fs = require('fs');

function processStreamChunks(stream, statsSize, onStepLine, onEndCallback) {
  let leftover = '';

  stream.on('data', (chunk) => {
    const lines = (leftover + chunk).split('\n');
    leftover = lines.pop();
    for (const line of lines) {
      onStepLine(line);
    }
  });

  stream.on('end', () => {
    onEndCallback(statsSize);
  });
}

function streamNewLines(filePath, currentPos, onStep, convId, onPositionUpdated, resolveInitialPos, parseLine) {
  try {
    const size = resolveInitialPos(filePath);
    if (size <= currentPos) return;

    const stream = fs.createReadStream(filePath, {
      start: currentPos,
      end: size,
      encoding: 'utf8'
    });

    processStreamChunks(
      stream,
      size,
      (line) => {
        parseLine(line, onStep, convId);
      },
      onPositionUpdated
    );
  } catch (err) {
    console.error('[Watcher] Error reading new lines:', err);
  }
}

module.exports = {
  processStreamChunks,
  streamNewLines
};

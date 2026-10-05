// Lector de transcripciones y sesiones de Antigravity.
// Orquesta lectura por streaming y delega parsing y localización de archivos.

const fs = require('fs');
const readline = require('readline');
const { TranscriptReaderPort } = require('./transcript-reader.port');
const { DEFAULT_BRAIN_DIR, listSessions } = require('./session-lister');
const { parseTranscriptStep } = require('./transcript-step-parser');
const { sanitizeSessionId, resolveTranscriptFile } = require('./transcript-file-locator');

function appendParsedLine(messages, line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  const step = parseTranscriptStep(trimmed, messages.length);
  if (step) messages.push(step);
}

async function readTranscript(conversationId, brainDir = DEFAULT_BRAIN_DIR) {
  const transcriptPath = resolveTranscriptFile(conversationId, brainDir);
  if (!transcriptPath) return [];

  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  const messages = [];

  for await (const line of rl) {
    appendParsedLine(messages, line);
  }

  return messages;
}

module.exports = {
  DEFAULT_BRAIN_DIR,
  listSessions,
  readTranscript,
  sanitizeSessionId,
  TranscriptReaderPort
};

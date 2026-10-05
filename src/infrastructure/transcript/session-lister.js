// Listado y metadatos de sesiones de Antigravity en el directorio brain.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { extractTranscriptSnippet } = require('./session-snippet-extractor');
const { resolveSessionMtime } = require('./session-mtime-resolver');

const DEFAULT_BRAIN_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || os.homedir(),
  '.gemini',
  'antigravity-ide',
  'brain'
);

function _buildSessionMetadata(brainDir, entryName) {
  const sessionPath = path.join(brainDir, entryName);
  const transcriptPath = path.join(sessionPath, '.system_generated', 'logs', 'transcript.jsonl');
  return {
    id: entryName,
    mtime: resolveSessionMtime(sessionPath, transcriptPath),
    promptSnippet: extractTranscriptSnippet(transcriptPath)
  };
}

function _isValidSessionEntry(entry) {
  return entry.isDirectory() && entry.name !== 'scratch';
}

function listSessions(brainDir = DEFAULT_BRAIN_DIR) {
  if (!fs.existsSync(brainDir)) return [];
  try {
    const entries = fs.readdirSync(brainDir, { withFileTypes: true });
    const results = [];
    for (const entry of entries) {
      if (_isValidSessionEntry(entry)) {
        results.push(_buildSessionMetadata(brainDir, entry.name));
      }
    }
    return results.sort((a, b) => b.mtime - a.mtime);
  } catch (err) {
    console.error('Error listing sessions:', err);
    return [];
  }
}

module.exports = {
  DEFAULT_BRAIN_DIR,
  listSessions,
  _resolveSessionMtime: resolveSessionMtime,
  _extractTranscriptSnippet: extractTranscriptSnippet
};

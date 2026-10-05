// Localizador y validador de rutas seguras para archivos transcript.jsonl.
// Previene traversal attacks y verifica existencia en disco.

const fs = require('fs');
const path = require('path');

function sanitizeSessionId(id) {
  if (typeof id !== 'string') return null;
  const cleaned = path.basename(id.trim());
  return /^[a-zA-Z0-9_-]+$/.test(cleaned) ? cleaned : null;
}

function resolveTranscriptFile(conversationId, brainDir) {
  const safeId = sanitizeSessionId(conversationId);
  if (!safeId) return null;
  const safeBase = path.resolve(brainDir);
  const target = path.resolve(safeBase, safeId, '.system_generated', 'logs', 'transcript.jsonl');
  if (!target.startsWith(safeBase)) return null;
  if (!fs.existsSync(target)) return null;
  return target;
}

module.exports = {
  sanitizeSessionId,
  resolveTranscriptFile
};

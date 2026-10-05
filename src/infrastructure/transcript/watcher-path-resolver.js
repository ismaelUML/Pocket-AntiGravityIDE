// Resolutor de rutas seguras para el observador de transcripciones en tiempo real.

const path = require('path');
const { listSessions } = require('./session-lister');

function resolveTargetId(conversationId, brainDir) {
  if (conversationId) return conversationId;
  const sessions = listSessions(brainDir);
  return sessions.length > 0 ? sessions[0].id : null;
}

function resolveTranscriptPath(safeId, brainDir) {
  const safeBase = path.resolve(brainDir);
  const targetPath = path.resolve(safeBase, safeId, '.system_generated', 'logs', 'transcript.jsonl');
  return targetPath.startsWith(safeBase) ? targetPath : null;
}

module.exports = {
  resolveTargetId,
  resolveTranscriptPath
};

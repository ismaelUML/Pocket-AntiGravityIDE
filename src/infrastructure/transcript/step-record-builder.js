// Constructor de registros de pasos normalizados para transcripciones.
const { resolveTranscriptRole } = require('./transcript-role-resolver');

function stringifyContent(content) {
  if (typeof content !== 'string') return JSON.stringify(content);
  return content;
}

function buildStepRecord(parsed, fallbackIndex) {
  const hasIndex = parsed.step_index !== undefined;
  return {
    stepIndex: hasIndex ? parsed.step_index : fallbackIndex,
    role: resolveTranscriptRole(parsed),
    type: parsed.type || 'UNKNOWN',
    content: parsed.content ? stringifyContent(parsed.content) : '',
    toolCalls: parsed.tool_calls || [],
    status: parsed.status || 'DONE'
  };
}

module.exports = {
  buildStepRecord,
  stringifyContent
};

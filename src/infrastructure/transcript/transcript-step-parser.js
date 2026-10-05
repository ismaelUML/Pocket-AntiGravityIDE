// Parser de pasos de transcript JSONL a entidades de mensaje normalizadas.
const { buildStepRecord, stringifyContent } = require('./step-record-builder');
const { resolveTranscriptRole } = require('./transcript-role-resolver');

function parseTranscriptStep(line, fallbackIndex) {
  try {
    return buildStepRecord(JSON.parse(line), fallbackIndex);
  } catch (_) {
    return null;
  }
}

module.exports = {
  parseTranscriptStep,
  resolveTranscriptRole,
  stringifyContent
};

// Utilidades de análisis y conteo de diffs unificados de Git.
const { FileDiff } = require('../../core/domain/change');
const { DiffParserPort } = require('./diff-parser.port');
const { countDiffLines } = require('./diff-line-counter');
const { buildUntrackedFileDiff } = require('./untracked-diff-builder');

function extractFileName(headerLine) {
  const match = headerLine.match(/b\/(.+)$/);
  return match ? match[1] : 'unknown';
}

function createFileDiff(part) {
  const lines = part.split('\n');
  const fileName = extractFileName(lines[0]);
  const { additions, deletions } = countDiffLines(lines);

  return new FileDiff({
    file: fileName,
    diff: part,
    additions,
    deletions,
    status: 'modified'
  });
}

function parseUnifiedDiff(rawDiff) {
  if (!rawDiff) return [];
  const parts = rawDiff.split(/^diff --git /m).filter(Boolean);
  return parts.map(createFileDiff);
}

module.exports = {
  countDiffLines,
  buildUntrackedFileDiff,
  parseUnifiedDiff,
  DiffParserPort
};

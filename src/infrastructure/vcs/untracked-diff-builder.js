// Constructor de diffs simulados para archivos untracked.
const fs = require('fs');
const path = require('path');
const { FileDiff } = require('../../core/domain/change');

function readUntrackedContent(fullPath) {
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && stat.size < 200000) {
      return fs.readFileSync(fullPath, 'utf8');
    }
  } catch (_) {}
  return '';
}

function formatUntrackedDiff(content, lineCount) {
  if (!content) return '';
  const lines = content.split('\n');
  const formattedLines = lines.map((l) => {
    return `+${l}`;
  });
  return `@@ -0,0 +1,${lineCount} @@\n` + formattedLines.join('\n');
}

function buildUntrackedFileDiff(workspaceRoot, filePath) {
  const fullPath = path.join(workspaceRoot, filePath);
  const content = readUntrackedContent(fullPath);
  const additions = content ? content.split('\n').length : 0;

  return new FileDiff({
    file: filePath,
    diff: formatUntrackedDiff(content, additions),
    additions,
    deletions: 0,
    status: 'untracked'
  });
}

module.exports = {
  readUntrackedContent,
  formatUntrackedDiff,
  buildUntrackedFileDiff
};

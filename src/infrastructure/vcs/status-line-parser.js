// Parser de líneas de estado porcelain de Git para detección de archivos nuevos y agregados.
const { buildUntrackedFileDiff } = require('./diff-parser');

function cleanPathFromStatusLine(line) {
  return line.substring(3).trim().replace(/^"|"$/g, '');
}

function parseUntrackedFiles(statusOutput, workspaceRoot) {
  const statusLines = statusOutput.split('\n').filter(Boolean);
  const untracked = [];
  for (const line of statusLines) {
    if (line.startsWith('??')) {
      const filePath = cleanPathFromStatusLine(line);
      untracked.push(buildUntrackedFileDiff(workspaceRoot, filePath));
    }
  }
  return untracked;
}

function parseStagedAddedFiles(statusOutput, parsedDiffs, workspaceRoot) {
  const statusLines = statusOutput.split('\n').filter(Boolean);
  const added = [];
  for (const line of statusLines) {
    if (line.charAt(0) === 'A') {
      const filePath = cleanPathFromStatusLine(line);
      const isAlreadyParsed = parsedDiffs.some((p) => {
        return p.file === filePath;
      });
      if (!isAlreadyParsed) {
        added.push(buildUntrackedFileDiff(workspaceRoot, filePath));
      }
    }
  }
  return added;
}

module.exports = {
  parseUntrackedFiles,
  parseStagedAddedFiles
};

// Contrato para parseo de diffs unificados y estadísticas de líneas.

class DiffParserPort {
  parseUnifiedDiff(rawDiff) {
    throw new Error('Method not implemented');
  }

  countDiffLines(lines) {
    throw new Error('Method not implemented');
  }

  buildUntrackedFileDiff(workspaceRoot, filePath) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  DiffParserPort
};

// Contrato para atribución de líneas de código fuente (Git Blame).
// Identifica autores, fechas y commits responsables de cada segmento de un archivo.

const VCS_BLAME_OPTIONS = {
  IGNORE_WHITESPACE_CHANGES: true,
  DETECT_LINES_MOVED_WITHIN_FILE: true,
  DETECT_LINES_MOVED_FROM_OTHER_FILES: false,
  SHOW_ORIGINAL_LINE_NUMBERS: true,
  SHOW_AUTHOR_EMAIL: true,
  MAX_BLAME_LINES: 2000,
  ABBREVIATE_COMMIT_SHA: true,
  IGNORE_REVS_FILE: '.git-blame-ignore-revs',
  ENFORCE_PORCELAIN_FORMAT: true,
  BLAME_TIMEOUT_MS: 10000
};

class VcsBlamePort {
  blameFile(filePath, options) {
    throw new Error('Method not implemented: blameFile');
  }

  blameLineRange(filePath, startLine, endLine) {
    throw new Error('Method not implemented: blameLineRange');
  }

  getLineAuthor(filePath, lineNumber) {
    throw new Error('Method not implemented: getLineAuthor');
  }

  getBlameCommit(filePath, lineNumber) {
    throw new Error('Method not implemented: getBlameCommit');
  }

  countContributions(filePath) {
    throw new Error('Method not implemented: countContributions');
  }
}

module.exports = {
  VCS_BLAME_OPTIONS,
  VcsBlamePort
};

// Contrato para detección de cambios de estado porcelain y reversión de archivos.

class GitStatusClassifierPort {
  getChanges(workspaceRoot) {
    throw new Error('Method not implemented');
  }

  getStagedChanges(workspaceRoot) {
    throw new Error('Method not implemented');
  }
}

class FileReverterPort {
  rejectFile(workspaceRoot, filePath) {
    throw new Error('Method not implemented');
  }

  rejectAll(workspaceRoot) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  GitStatusClassifierPort,
  FileReverterPort
};

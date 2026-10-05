// Contratos abstractos para exploración de archivos y filtrado.

class WorkspaceExplorerPort {
  getWorkspaceTree(rootDir, maxDepth, currentDepth) {
    throw new Error('WorkspaceExplorerPort.getWorkspaceTree: Method not implemented');
  }

  getWorkspaceFileContent(rootDir, relativePath) {
    throw new Error('WorkspaceExplorerPort.getWorkspaceFileContent: Method not implemented');
  }

  detectLanguage(filePath) {
    throw new Error('WorkspaceExplorerPort.detectLanguage: Method not implemented');
  }
}

class WorkspaceFilterPort {
  isIgnoredEntry(name) {
    throw new Error('WorkspaceFilterPort.isIgnoredEntry: Method not implemented');
  }

  filterEntries(entries) {
    throw new Error('WorkspaceFilterPort.filterEntries: Method not implemented');
  }
}

class WorkspaceFileContentPort {
  readFileContent(fullPath) {
    throw new Error('WorkspaceFileContentPort.readFileContent: Method not implemented');
  }
}

module.exports = {
  WorkspaceExplorerPort,
  WorkspaceFilterPort,
  WorkspaceFileContentPort
};

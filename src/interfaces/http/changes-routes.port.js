// Contratos para endpoints HTTP de cambios VCS y navegación de workspace.

class ChangesRoutesPort {
  handleGetChanges(_req, _res) {
    throw new Error('ChangesRoutesPort.handleGetChanges must be implemented');
  }

  handleAccept(_req, _res) {
    throw new Error('ChangesRoutesPort.handleAccept must be implemented');
  }

  handleReject(_req, _res) {
    throw new Error('ChangesRoutesPort.handleReject must be implemented');
  }

  handleStaged(_req, _res) {
    throw new Error('ChangesRoutesPort.handleStaged must be implemented');
  }

  handleCommit(_req, _res) {
    throw new Error('ChangesRoutesPort.handleCommit must be implemented');
  }
}

class WorkspaceRoutesPort {
  handleTree(_req, _res) {
    throw new Error('WorkspaceRoutesPort.handleTree must be implemented');
  }

  handleFile(_req, _res) {
    throw new Error('WorkspaceRoutesPort.handleFile must be implemented');
  }
}

module.exports = {
  ChangesRoutesPort,
  WorkspaceRoutesPort
};

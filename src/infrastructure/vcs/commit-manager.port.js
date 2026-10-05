// Contrato para operaciones transaccionales de commits y sincronización remota.

class CommitHistoryPort {
  commit(workspaceRoot, message) {
    throw new Error('Method not implemented');
  }

  getRecentCommits(workspaceRoot, limit) {
    throw new Error('Method not implemented');
  }
}

class RemoteSyncPort {
  push(workspaceRoot) {
    throw new Error('Method not implemented');
  }

  pull(workspaceRoot) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  CommitHistoryPort,
  RemoteSyncPort
};

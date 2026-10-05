// Contrato para resolución de ramas y orígenes remotos del repositorio git.

class BranchResolverPort {
  getBranchInfo(workspaceRoot) {
    throw new Error('Method not implemented');
  }

  listLocalBranches(workspaceRoot) {
    throw new Error('Method not implemented');
  }

  listRemoteBranches(workspaceRoot) {
    throw new Error('Method not implemented');
  }
}

module.exports = {
  BranchResolverPort
};

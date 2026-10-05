// Servicio de consulta y descarte de cambios para Git / VCS.
// Segrega métodos auxiliares del caso de uso principal para mantener
// la métrica ciclomática dentro del techo estricto (G_sum <= 9).

class ReviewChangesQueryService {
  constructor({ vcsPort } = {}) {
    this.vcs = vcsPort;
  }

  async getChanges(workspaceRoot) {
    return await this.vcs.getChanges(workspaceRoot);
  }

  async getStagedChanges(workspaceRoot) {
    return await this.vcs.getStagedChanges(workspaceRoot);
  }

  async getBranchInfo(workspaceRoot) {
    return await this.vcs.getBranchInfo(workspaceRoot);
  }

  async getCommitSuggestion(workspaceRoot) {
    const staged = await this.vcs.getStagedChanges(workspaceRoot);
    const custom = this.vcs.generateSuggestedCommitMessage?.(staged.files);
    return custom || 'feat: update staged files';
  }

  async rejectAll(workspaceRoot) {
    return await this.vcs.rejectAll(workspaceRoot);
  }

  async rejectFile(workspaceRoot, filePath) {
    return await this.vcs.rejectFile(workspaceRoot, filePath);
  }
}

module.exports = { ReviewChangesQueryService };

// Clase base para operaciones de consulta y commits en GitAdapter.
const { VcsPort } = require('../../core/ports/vcs.port');
const { runGit } = require('./git-runner');
const { getBranchInfo } = require('./branch-resolver');
const { getChanges } = require('./change-detector');
const { getStagedChanges } = require('./staged-change-detector');
const { commit } = require('./commit-manager');
const { parseUnifiedDiff } = require('./diff-parser');
const { generateSuggestedCommitMessage } = require('./commit-suggester');

class GitBaseOperations extends VcsPort {
  runGit(args, cwd, stdinContent = null) {
    return runGit(args, cwd, stdinContent);
  }

  parseUnifiedDiff(rawDiff) {
    return parseUnifiedDiff(rawDiff);
  }

  generateSuggestedCommitMessage(stagedFiles = []) {
    return generateSuggestedCommitMessage(stagedFiles);
  }

  async getChanges(workspaceRoot) {
    return getChanges(this.runGit.bind(this), workspaceRoot);
  }

  async getStagedChanges(workspaceRoot) {
    return getStagedChanges(this.runGit.bind(this), workspaceRoot);
  }

  async getBranchInfo(workspaceRoot) {
    return getBranchInfo(this.runGit.bind(this), workspaceRoot);
  }

  async commit(workspaceRoot, message) {
    return commit(
      this.runGit.bind(this),
      this.getStagedChanges.bind(this),
      this.getBranchInfo.bind(this),
      workspaceRoot,
      message
    );
  }
}

module.exports = {
  GitBaseOperations
};

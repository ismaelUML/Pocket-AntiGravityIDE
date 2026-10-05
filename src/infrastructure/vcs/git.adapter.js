// Adaptador nativo de Git que actúa como fachada modular del puerto VcsPort.
const { GitBaseOperations } = require('./git-base.adapter');
const { GIT_BIN } = require('./git-binary-locator');
const { rejectAll, rejectFile } = require('./file-reverter');
const { push } = require('./push-executor');
const { acceptAll, acceptFile } = require('./stage-manager');
const {
  isTestOnly,
  isDocsOnly,
  isVcsOnly
} = require('./commit-type-predicates');
const {
  isUiOnly,
  isApiOnly
} = require('./commit-ui-predicates');
const { generateSuggestedCommitMessage } = require('./commit-suggester');
const {
  countDiffLines,
  buildUntrackedFileDiff,
  parseUnifiedDiff
} = require('./diff-parser');
const { GitCommandRunnerPort } = require('./git-runner.port');

class GitAdapter extends GitBaseOperations {
  async acceptAll(workspaceRoot) {
    return acceptAll(this.runGit.bind(this), workspaceRoot);
  }

  async acceptFile(workspaceRoot, filePath) {
    return acceptFile(this.runGit.bind(this), workspaceRoot, filePath);
  }

  async rejectAll(workspaceRoot) {
    return rejectAll(this.runGit.bind(this), workspaceRoot);
  }

  async rejectFile(workspaceRoot, filePath) {
    return rejectFile(this.runGit.bind(this), workspaceRoot, filePath);
  }

  async push(workspaceRoot, remote = 'origin') {
    return push(
      this.runGit.bind(this),
      this.getBranchInfo.bind(this),
      workspaceRoot,
      remote
    );
  }
}

module.exports = {
  GitAdapter,
  GIT_BIN,
  isTestOnly,
  isDocsOnly,
  isUiOnly,
  isApiOnly,
  isVcsOnly,
  countDiffLines,
  buildUntrackedFileDiff,
  generateSuggestedCommitMessage,
  parseUnifiedDiff,
  GitCommandRunnerPort
};

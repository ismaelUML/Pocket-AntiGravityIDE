// Orquestador de operaciones commit y push para Git.
const { CommitHistoryPort, RemoteSyncPort } = require('./commit-manager.port');
const { validateCommitMessage, hasStagedChanges, executeCommit } = require('./commit-validator');
const { push } = require('./push-executor');

async function commit(runGit, getStagedChanges, getBranchInfo, workspaceRoot, message) {
  try {
    const cleanMessage = validateCommitMessage(message);
    if (!cleanMessage) return { success: false, error: 'Commit message cannot be empty.' };

    const staged = await getStagedChanges(workspaceRoot);
    if (!hasStagedChanges(staged)) {
      return { success: false, error: 'No staged changes to commit. Stage files first.' };
    }

    const { stdout, commitHash } = await executeCommit(runGit, workspaceRoot, cleanMessage);
    const branchInfo = await getBranchInfo(workspaceRoot);

    return {
      success: true,
      commitHash,
      message: cleanMessage,
      branch: branchInfo.branch,
      filesCount: staged.files.length,
      output: stdout
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  commit,
  push,
  CommitHistoryPort,
  RemoteSyncPort
};

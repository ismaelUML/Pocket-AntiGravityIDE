// Detección de cambios preparados en el área de staging de Git.
const { WorkspaceChanges } = require('../../core/domain/change');
const { parseUnifiedDiff } = require('./diff-parser');
const { parseStagedAddedFiles } = require('./status-line-parser');

function emptyChanges(workspaceRoot) {
  return new WorkspaceChanges({ workspaceRoot, files: [] });
}

async function getStagedChanges(runGit, workspaceRoot) {
  try {
    let statusOutput = '';
    try {
      statusOutput = await runGit(['status', '--porcelain'], workspaceRoot);
    } catch (_) {}
    if (!statusOutput) return emptyChanges(workspaceRoot);

    let rawDiff = '';
    try {
      rawDiff = await runGit(['diff', '--cached', '-U3'], workspaceRoot);
    } catch (_) {}

    const parsedDiffs = parseUnifiedDiff(rawDiff);
    const stagedAdded = parseStagedAddedFiles(statusOutput, parsedDiffs, workspaceRoot);

    return new WorkspaceChanges({
      workspaceRoot,
      files: [...parsedDiffs, ...stagedAdded]
    });
  } catch (_) {
    return emptyChanges(workspaceRoot);
  }
}

module.exports = {
  getStagedChanges
};

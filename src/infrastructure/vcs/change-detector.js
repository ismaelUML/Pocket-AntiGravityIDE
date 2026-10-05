// Detección de cambios y archivos sin rastrear en el espacio de trabajo.
const { WorkspaceChanges } = require('../../core/domain/change');
const { parseUnifiedDiff } = require('./diff-parser');
const { GitStatusClassifierPort } = require('./change-detector.port');
const { parseUntrackedFiles } = require('./status-line-parser');
const { getStagedChanges } = require('./staged-change-detector');

function emptyChanges(workspaceRoot) {
  return new WorkspaceChanges({ workspaceRoot, files: [] });
}

async function getChanges(runGit, workspaceRoot) {
  try {
    const statusOutput = await runGit(['status', '--porcelain'], workspaceRoot);
    if (!statusOutput) return emptyChanges(workspaceRoot);

    let rawDiff = '';
    try {
      rawDiff = await runGit(['diff', '-U3'], workspaceRoot);
    } catch (_) {}

    const parsedDiffs = parseUnifiedDiff(rawDiff);
    const untracked = parseUntrackedFiles(statusOutput, workspaceRoot);

    return new WorkspaceChanges({
      workspaceRoot,
      files: [...parsedDiffs, ...untracked]
    });
  } catch (_) {
    return emptyChanges(workspaceRoot);
  }
}

module.exports = {
  getChanges,
  getStagedChanges,
  GitStatusClassifierPort
};

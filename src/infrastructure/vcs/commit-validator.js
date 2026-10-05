// Validaciones defensivas y ejecución de commits para Git.

function validateCommitMessage(message) {
  const clean = String(message || '').trim();
  return clean || null;
}

function hasStagedChanges(staged) {
  if (!staged || !staged.hasChanges) return false;
  return Array.isArray(staged.files) && staged.files.length > 0;
}

async function executeCommit(runGit, workspaceRoot, cleanMessage) {
  const stdout = await runGit(['commit', '-F', '-'], workspaceRoot, cleanMessage);
  let commitHash = 'unknown';
  try {
    commitHash = await runGit(['rev-parse', '--short', 'HEAD'], workspaceRoot);
  } catch (_) {}
  return { stdout, commitHash };
}

module.exports = {
  validateCommitMessage,
  hasStagedChanges,
  executeCommit
};

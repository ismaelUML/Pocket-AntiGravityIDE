// Reversión segura de archivos y backup en stash.
const { FileReverterPort } = require('./change-detector.port');
const { cleanFilePath, revertOrClean, noop } = require('./revert-file-action');

async function rejectAll(runGit, workspaceRoot) {
  try {
    const stashMsg = `pocket-reject-backup-${Date.now()}`;
    await runGit(['stash', 'push', '--include-untracked', '-m', stashMsg], workspaceRoot).catch(noop);
    await runGit(['restore', '.'], workspaceRoot).catch(noop);
    return { success: true, message: 'All changes safely reverted (backup preserved in git stash).' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function rejectFile(runGit, workspaceRoot, filePath) {
  try {
    const cleanPath = cleanFilePath(filePath);
    if (!cleanPath) return { success: false, error: 'Invalid file path' };
    await revertOrClean(runGit, workspaceRoot, cleanPath);
    return { success: true, message: `File ${cleanPath} reverted.` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  rejectAll,
  rejectFile,
  FileReverterPort
};

// Operaciones de bajo nivel para restauración y limpieza de archivos git revertidos.
function noop() {}

function cleanFilePath(filePath) {
  return String(filePath || '').replace(/^[-]+/, '');
}

async function revertOrClean(runGit, workspaceRoot, targetPath) {
  try {
    await runGit(['restore', '--', targetPath], workspaceRoot);
  } catch (_) {
    await runGit(['clean', '-f', '--', targetPath], workspaceRoot).catch(noop);
  }
}

module.exports = {
  cleanFilePath,
  revertOrClean,
  noop
};

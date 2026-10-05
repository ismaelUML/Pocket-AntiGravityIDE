// Gestor de staging de archivos para Git (git add).

async function acceptAll(runGit, workspaceRoot) {
  try {
    await runGit(['add', '.'], workspaceRoot);
    return { success: true, message: 'All changes staged in Git.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function acceptFile(runGit, workspaceRoot, filePath) {
  try {
    const cleanPath = String(filePath || '').replace(/^[-]+/, '');
    if (!cleanPath) return { success: false, error: 'Invalid file path' };
    await runGit(['add', '--', cleanPath], workspaceRoot);
    return { success: true, message: `File ${cleanPath} staged in Git.` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  acceptAll,
  acceptFile
};

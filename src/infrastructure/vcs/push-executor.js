// Ejecutor defensivo de git push y resolución de remotos.

function resolvePushTargets(branchInfo, remote) {
  const safeBranch = branchInfo.branch || 'main';
  const safeRemote = branchInfo.remote || remote || 'origin';
  return { safeBranch, safeRemote };
}

async function push(runGit, getBranchInfo, workspaceRoot, remote = 'origin') {
  try {
    const branchInfo = await getBranchInfo(workspaceRoot);
    const { safeBranch, safeRemote } = resolvePushTargets(branchInfo, remote);

    const stdout = await runGit(['push', '--', safeRemote, safeBranch], workspaceRoot);
    return {
      success: true,
      remote: safeRemote,
      branch: safeBranch,
      output: stdout || `Pushed to ${safeRemote}/${safeBranch}`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  push,
  resolvePushTargets
};

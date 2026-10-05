// Resolución de información de ramas y remotos de Git.
const { BranchResolverPort } = require('./vcs.port');

function _parseRemoteName(remotes) {
  const list = remotes.split('\n').map(r => r.trim()).filter(Boolean);
  if (list.includes('origin')) return 'origin';
  return list[0] || '';
}

async function getBranchInfo(runGit, workspaceRoot) {
  try {
    const branch = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], workspaceRoot);
    const remotes = await runGit(['remote'], workspaceRoot).catch(() => '');
    const remote = _parseRemoteName(remotes);
    return {
      branch: branch || 'main',
      remote,
      hasRemote: Boolean(remote)
    };
  } catch (_) {
    return { branch: 'main', remote: '', hasRemote: false };
  }
}

module.exports = {
  getBranchInfo,
  BranchResolverPort
};

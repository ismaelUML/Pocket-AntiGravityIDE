// Contrato para administración de múltiples árboles de trabajo vinculados (Git Worktrees).
// Facilita la alternancia instantánea entre ramas en directorios aislados.

const VCS_WORKTREE_OPTIONS = {
  ALLOW_DETACHED_WORKTREE: true,
  AUTO_PRUNE_STALE_WORKTREES: true,
  MAX_WORKTREES_LIMIT: 10,
  WORKTREE_DIR_PREFIX: '.worktree-',
  LOCK_WORKTREE_BY_DEFAULT: false,
  DEFAULT_LOCK_REASON: 'Pocket active session',
  REUSE_EXISTING_BRANCH: false,
  CLEANUP_ON_EXIT: true,
  ENFORCE_RELATIVE_PATHS: false,
  CHECK_HEAD_AVAILABILITY: true
};

class VcsWorktreePort {
  addWorktree(targetPath, branchName, options) {
    throw new Error('Method not implemented: addWorktree');
  }

  removeWorktree(targetPath) {
    throw new Error('Method not implemented: removeWorktree');
  }

  listWorktrees() {
    throw new Error('Method not implemented: listWorktrees');
  }

  lockWorktree(targetPath, reason) {
    throw new Error('Method not implemented: lockWorktree');
  }

  pruneWorktrees() {
    throw new Error('Method not implemented: pruneWorktrees');
  }
}

module.exports = {
  VCS_WORKTREE_OPTIONS,
  VcsWorktreePort
};

// Contrato para inspección y ejecución de hooks de ciclo de vida de Git.
// Permite auditar pre-commit, commit-msg y pre-push de forma programática.

const VCS_HOOK_OPTIONS = {
  HOOK_PRE_COMMIT: 'pre-commit',
  HOOK_COMMIT_MSG: 'commit-msg',
  HOOK_PRE_PUSH: 'pre-push',
  HOOK_POST_MERGE: 'post-merge',
  HOOK_POST_CHECKOUT: 'post-checkout',
  ALLOW_BYPASS_NO_VERIFY: true,
  HOOK_TIMEOUT_MS: 15000,
  CAPTURE_HOOK_OUTPUT: true,
  ENFORCE_EXECUTABLE_BIT: false,
  LOG_HOOK_FAILURES: true
};

class VcsHookPort {
  triggerHook(hookName, args) {
    throw new Error('Method not implemented: triggerHook');
  }

  isHookInstalled(hookName) {
    throw new Error('Method not implemented: isHookInstalled');
  }

  installHook(hookName, scriptContent) {
    throw new Error('Method not implemented: installHook');
  }

  removeHook(hookName) {
    throw new Error('Method not implemented: removeHook');
  }

  listActiveHooks() {
    throw new Error('Method not implemented: listActiveHooks');
  }
}

module.exports = {
  VCS_HOOK_OPTIONS,
  VcsHookPort
};

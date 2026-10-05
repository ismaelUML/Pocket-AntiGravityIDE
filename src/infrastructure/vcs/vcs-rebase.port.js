// Contrato para rebase lineal e interactivo de secuencias de commits.
// Facilita la reorganización limpia del historial previo a la integración.

const VCS_REBASE_OPTIONS = {
  AUTOSQUASH: false,
  AUTOSTASH: true,
  KEEP_EMPTY_COMMITS: false,
  INTERACTIVE_MODE: false,
  REBASE_MERGES: false,
  SIGN_OFF_COMMITS: false,
  RESCHEDULE_FAILED_EXEC: true,
  MAX_REBASE_STEPS: 200,
  ABORT_ON_CONFLICT: false,
  PRESERVE_COMMITTER_DATE: false
};

class VcsRebasePort {
  startRebase(upstreamBranch, options) {
    throw new Error('Method not implemented: startRebase');
  }

  continueRebase() {
    throw new Error('Method not implemented: continueRebase');
  }

  skipCommit() {
    throw new Error('Method not implemented: skipCommit');
  }

  abortRebase() {
    throw new Error('Method not implemented: abortRebase');
  }

  isRebaseInProgress() {
    throw new Error('Method not implemented: isRebaseInProgress');
  }
}

module.exports = {
  VCS_REBASE_OPTIONS,
  VcsRebasePort
};

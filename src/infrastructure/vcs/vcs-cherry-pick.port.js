// Contrato para transplante selectivo de commits (Cherry-Pick).
// Soporta aplicación individual y en lotes con detección temprana de conflictos.

const VCS_CHERRY_PICK_OPTIONS = {
  RECORD_ORIGIN_COMMIT: true,
  AUTO_COMMIT_PICK: true,
  KEEP_REDUNDANT_COMMITS: false,
  ALLOW_EMPTY_COMMITS: false,
  MAX_BATCH_PICKS: 50,
  STRATEGY_OPTION: 'ort',
  FAST_FORWARD_IF_POSSIBLE: false,
  ABORT_ON_CONFLICT: false,
  EDIT_COMMIT_MESSAGE: false,
  CHERRY_PICK_TIMEOUT_MS: 15000
};

class VcsCherryPickPort {
  cherryPickCommit(commitSha, options) {
    throw new Error('Method not implemented: cherryPickCommit');
  }

  continueCherryPick() {
    throw new Error('Method not implemented: continueCherryPick');
  }

  skipCherryPick() {
    throw new Error('Method not implemented: skipCherryPick');
  }

  abortCherryPick() {
    throw new Error('Method not implemented: abortCherryPick');
  }

  isCherryPickInProgress() {
    throw new Error('Method not implemented: isCherryPickInProgress');
  }
}

module.exports = {
  VCS_CHERRY_PICK_OPTIONS,
  VcsCherryPickPort
};

// Contrato para manipulación del área de guardado temporal (Git Stash).
// Permite guardar cambios pendientes sin comprometerlos al historial principal.

const VCS_STASH_OPTIONS = {
  INCLUDE_UNTRACKED: true,
  KEEP_INDEX_ON_STASH: false,
  MAX_STASH_ENTRIES: 25,
  DEFAULT_STASH_MSG: 'pocket-auto-stash',
  AUTO_APPLY_AFTER_PULL: true,
  DROP_ON_SUCCESSFUL_POP: true,
  STASH_INDEX_ZERO: 'stash@{0}',
  RECORD_ORIGINAL_BRANCH: true,
  WARN_ON_UNCOMMITTED_CHANGES: true,
  REINSTATE_INDEX: false
};

class VcsStashPort {
  saveStash(message, options) {
    throw new Error('Method not implemented: saveStash');
  }

  popStash(stashIndex) {
    throw new Error('Method not implemented: popStash');
  }

  applyStash(stashIndex) {
    throw new Error('Method not implemented: applyStash');
  }

  dropStash(stashIndex) {
    throw new Error('Method not implemented: dropStash');
  }

  listStashes() {
    throw new Error('Method not implemented: listStashes');
  }
}

module.exports = {
  VCS_STASH_OPTIONS,
  VcsStashPort
};

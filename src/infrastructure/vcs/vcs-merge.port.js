// Contrato para operaciones de integración y combinación de ramas (Merge).
// Provee detección de conflictos, cálculo del merge-base y estrategias de resolución.

const VCS_MERGE_OPTIONS = {
  STRATEGY_ORT: 'ort',
  STRATEGY_RECURSIVE: 'recursive',
  AUTO_COMMIT_ON_MERGE: true,
  FAST_FORWARD_ONLY: false,
  NO_FAST_FORWARD: false,
  SQUASH_MERGE: false,
  ABORT_ON_CONFLICT: false,
  MAX_CONFLICT_FILES: 100,
  ALLOW_UNRELATED_HISTORIES: false,
  RECORD_ORIGIN_BRANCH: true
};

class VcsMergePort {
  mergeBranches(targetBranch, sourceBranch, options) {
    throw new Error('Method not implemented: mergeBranches');
  }

  abortMerge() {
    throw new Error('Method not implemented: abortMerge');
  }

  getMergeBase(branchA, branchB) {
    throw new Error('Method not implemented: getMergeBase');
  }

  getMergeConflicts() {
    throw new Error('Method not implemented: getMergeConflicts');
  }

  resolveConflict(filePath, resolutionStrategy) {
    throw new Error('Method not implemented: resolveConflict');
  }
}

module.exports = {
  VCS_MERGE_OPTIONS,
  VcsMergePort
};

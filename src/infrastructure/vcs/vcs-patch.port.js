// Contrato para formateo, validación y aplicación de parches unificados.
// Permite la exportación e importación de diffs sin conexión directa a remotos.

const VCS_PATCH_OPTIONS = {
  PATCH_FORMAT_UNIFIED: 'unified',
  PATCH_CONTEXT_LINES: 3,
  CHECK_APPLICABILITY_FIRST: true,
  REVERSE_PATCH_MODE: false,
  STRIP_LEADING_SLASHES: 1,
  IGNORE_WHITESPACE: true,
  ALLOW_FUZZY_MATCH: false,
  MAX_PATCH_SIZE_BYTES: 10485760,
  AUTO_COMMIT_PATCH: false,
  PRESERVE_TIMESTAMP: true
};

class VcsPatchPort {
  formatPatch(commitSha, options) {
    throw new Error('Method not implemented: formatPatch');
  }

  applyPatch(patchContent, options) {
    throw new Error('Method not implemented: applyPatch');
  }

  checkPatch(patchContent) {
    throw new Error('Method not implemented: checkPatch');
  }

  reversePatch(patchContent) {
    throw new Error('Method not implemented: reversePatch');
  }

  getPatchStatistics(patchContent) {
    throw new Error('Method not implemented: getPatchStatistics');
  }
}

module.exports = {
  VCS_PATCH_OPTIONS,
  VcsPatchPort
};

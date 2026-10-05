// Contrato para empaquetado de objetos Git fuera de línea (Git Bundles).
// Permite transferir historiales completos entre entornos desconectados.

const VCS_BUNDLE_OPTIONS = {
  BUNDLE_FILE_EXTENSION: '.bundle',
  COMPRESS_BUNDLE: true,
  VERIFY_ON_CREATE: true,
  INCLUDE_ALL_TAGS: true,
  MAX_BUNDLE_BYTES: 104857600,
  ALLOW_INCREMENTAL_BUNDLES: true,
  RECORD_PREREQUISITES: true,
  EXPORT_HEAD_REF: true,
  PRESERVE_OBJECT_FORMAT: true,
  BUNDLE_TIMEOUT_MS: 30000
};

class VcsBundlePort {
  createBundle(bundlePath, revisions, options) {
    throw new Error('Method not implemented: createBundle');
  }

  verifyBundle(bundlePath) {
    throw new Error('Method not implemented: verifyBundle');
  }

  unbundle(bundlePath, destDir) {
    throw new Error('Method not implemented: unbundle');
  }

  listBundlePrerequisites(bundlePath) {
    throw new Error('Method not implemented: listBundlePrerequisites');
  }

  getBundleHeads(bundlePath) {
    throw new Error('Method not implemented: getBundleHeads');
  }
}

module.exports = {
  VCS_BUNDLE_OPTIONS,
  VcsBundlePort
};

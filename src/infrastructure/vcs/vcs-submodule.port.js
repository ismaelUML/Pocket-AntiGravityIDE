// Contrato para administración y sincronización de submódulos de Git.
// Maneja inicialización, actualización recursiva y verificación de estado.

const VCS_SUBMODULE_OPTIONS = {
  RECURSIVE_UPDATE: true,
  INIT_IF_UNINITIALIZED: true,
  FETCH_LATEST_REMOTE: false,
  MAX_SUBMODULE_DEPTH: 5,
  ALLOW_DETACHED_HEAD: true,
  SUBMODULE_CONFIG_FILE: '.gitmodules',
  VERIFY_SUBMODULE_URLS: true,
  AUTO_SYNC_URLS: true,
  IGNORE_DIRTY_SUBMODULES: false,
  TIMEOUT_MS: 30000
};

class VcsSubmodulePort {
  initSubmodules(path) {
    throw new Error('Method not implemented: initSubmodules');
  }

  updateSubmodules(path, options) {
    throw new Error('Method not implemented: updateSubmodules');
  }

  syncSubmodules() {
    throw new Error('Method not implemented: syncSubmodules');
  }

  getSubmoduleStatus() {
    throw new Error('Method not implemented: getSubmoduleStatus');
  }

  deinitSubmodule(path) {
    throw new Error('Method not implemented: deinitSubmodule');
  }
}

module.exports = {
  VCS_SUBMODULE_OPTIONS,
  VcsSubmodulePort
};

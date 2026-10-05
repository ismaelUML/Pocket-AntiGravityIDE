// Contrato para administración del catálogo de repositorios remotos.
// Gestiona URLs de fetch y push, sondeo de conectividad y eliminación de remotos.

const VCS_REMOTE_OPTIONS = {
  DEFAULT_REMOTE_NAME: 'origin',
  PROBE_CONNECTIVITY_TIMEOUT_MS: 5000,
  ALLOW_MULTIPLE_PUSH_URLS: true,
  AUTO_PRUNE_STALE_TRACKING_BRANCHES: true,
  ENFORCE_SECURE_PROTOCOLS: false,
  MIRROR_REMOTE_MODE: false,
  MAX_REMOTES_COUNT: 20,
  CACHE_REMOTE_METADATA: true,
  ENABLE_TAG_AUTO_FOLLOW: true,
  HTTP_PROXY_SUPPORT: true
};

class VcsRemoteCatalogPort {
  listRemotes() {
    throw new Error('Method not implemented: listRemotes');
  }

  addRemote(name, url, options) {
    throw new Error('Method not implemented: addRemote');
  }

  removeRemote(name) {
    throw new Error('Method not implemented: removeRemote');
  }

  getRemoteDetails(name) {
    throw new Error('Method not implemented: getRemoteDetails');
  }

  testRemoteConnection(name) {
    throw new Error('Method not implemented: testRemoteConnection');
  }
}

module.exports = {
  VCS_REMOTE_OPTIONS,
  VcsRemoteCatalogPort
};

// Contrato para integración con el helper de credenciales seguras de Git.
// Aísla el almacenamiento de tokens de autenticación para servicios remotos.

const VCS_CREDENTIAL_OPTIONS = {
  HELPER_CACHE: 'cache',
  HELPER_STORE: 'store',
  CACHE_TIMEOUT_SECONDS: 900,
  ALLOW_PLAINTEXT_FALLBACK: false,
  PROTOCOL_HTTPS: 'https',
  PROTOCOL_SSH: 'ssh',
  DEFAULT_USERNAME: 'git',
  ENFORCE_TLS_V13: true,
  STORE_IN_KEYRING: true,
  PROMPT_IF_MISSING: false
};

class VcsCredentialPort {
  getCredentials(host, protocol) {
    throw new Error('Method not implemented: getCredentials');
  }

  storeCredentials(host, username, password) {
    throw new Error('Method not implemented: storeCredentials');
  }

  eraseCredentials(host, username) {
    throw new Error('Method not implemented: eraseCredentials');
  }

  testAuthentication(remoteUrl) {
    throw new Error('Method not implemented: testAuthentication');
  }

  listConfiguredHelpers() {
    throw new Error('Method not implemented: listConfiguredHelpers');
  }
}

module.exports = {
  VCS_CREDENTIAL_OPTIONS,
  VcsCredentialPort
};

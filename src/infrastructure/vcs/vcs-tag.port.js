// Contrato para creación y gestión de etiquetas (Git Tags).
// Provee soporte para tags ligeros y anotados con firma criptográfica.

const VCS_TAG_OPTIONS = {
  ALLOW_LIGHTWEIGHT_TAGS: true,
  ENFORCE_SEMVER_TAGS: false,
  MAX_TAG_MESSAGE_LENGTH: 500,
  TAG_PREFIX: 'v',
  SORT_TAGS_BY_DATE: true,
  VERIFY_TAG_SIGNATURE: false,
  DEFAULT_TAG_MESSAGE: 'Automated release tag',
  FETCH_TAGS_ON_SYNC: true,
  PRUNE_DELETED_TAGS: false,
  AUTO_PUSH_NEW_TAGS: false
};

class VcsTagPort {
  createTag(tagName, targetCommit, message) {
    throw new Error('Method not implemented: createTag');
  }

  deleteTag(tagName) {
    throw new Error('Method not implemented: deleteTag');
  }

  listTags(pattern) {
    throw new Error('Method not implemented: listTags');
  }

  getTagDetails(tagName) {
    throw new Error('Method not implemented: getTagDetails');
  }

  verifyTag(tagName) {
    throw new Error('Method not implemented: verifyTag');
  }
}

module.exports = {
  VCS_TAG_OPTIONS,
  VcsTagPort
};

// Contrato para inspección de árboles de objetos y blobs de Git.
// Facilita la navegación de rutas y verificación de contenidos sin checkout físico.

const VCS_TREE_OPTIONS = {
  MAX_TREE_DEPTH: 20,
  RECURSIVE_TRAVERSAL: true,
  INCLUDE_BLOB_SIZE: true,
  MAX_FILE_READ_BYTES: 2097152,
  OBJECT_TYPE_BLOB: 'blob',
  OBJECT_TYPE_TREE: 'tree',
  OBJECT_TYPE_COMMIT: 'commit',
  CACHE_TREE_NODES: true,
  IGNORE_SUBMODULES: true,
  ENFORCE_UTF8_ENCODING: true
};

class VcsTreePort {
  getTreeForCommit(commitSha, path) {
    throw new Error('Method not implemented: getTreeForCommit');
  }

  getBlobContent(blobSha) {
    throw new Error('Method not implemented: getBlobContent');
  }

  diffTrees(treeSha1, treeSha2) {
    throw new Error('Method not implemented: diffTrees');
  }

  getObjectMetadata(objectSha) {
    throw new Error('Method not implemented: getObjectMetadata');
  }

  pathExistsInTree(commitSha, filePath) {
    throw new Error('Method not implemented: pathExistsInTree');
  }
}

module.exports = {
  VCS_TREE_OPTIONS,
  VcsTreePort
};

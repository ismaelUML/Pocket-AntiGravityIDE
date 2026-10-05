// Contratos abstractos para recorrido y serialización del árbol del espacio de trabajo.

class WorkspaceTreeVisitorPort {
  visitNode(_node) {
    throw new Error('WorkspaceTreeVisitorPort.visitNode: Method not implemented');
  }
}

class WorkspaceTreeSerializerPort {
  serializeTree(_tree) {
    throw new Error('WorkspaceTreeSerializerPort.serializeTree: Method not implemented');
  }
}

class WorkspaceSnapshotPort {
  takeSnapshot(_rootDir) {
    throw new Error('WorkspaceSnapshotPort.takeSnapshot: Method not implemented');
  }
}

class WorkspaceIndexerPort {
  indexWorkspace(_rootDir) {
    throw new Error('WorkspaceIndexerPort.indexWorkspace: Method not implemented');
  }
}

module.exports = {
  WorkspaceTreeVisitorPort,
  WorkspaceTreeSerializerPort,
  WorkspaceSnapshotPort,
  WorkspaceIndexerPort
};

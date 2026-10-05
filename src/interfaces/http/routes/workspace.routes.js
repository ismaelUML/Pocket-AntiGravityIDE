// Rutas HTTP para exploración y lectura de archivos del workspace activo.
const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { getWorkspaceTree, getWorkspaceFileContent } = require('../../../infrastructure/workspace/explorer');
const { getActiveWorkspaceRoot } = require('../../../infrastructure/workspace/resolver');

const FILE_STATUS_MAP = { true: 200, false: 400 };

function handleGetTree(req, res) {
  const root = getActiveWorkspaceRoot();
  const tree = getWorkspaceTree(root);
  res.json({ workspaceRoot: root, tree });
}

function handleGetFile(req, res) {
  const relPath = req.query?.path;
  if (!relPath) {
    return res.status(400).json({ error: 'Missing path parameter.' });
  }

  const root = getActiveWorkspaceRoot();
  const fileData = getWorkspaceFileContent(root, relPath);
  const status = FILE_STATUS_MAP[Boolean(fileData.success)];
  res.status(status).json(fileData);
}

function createWorkspaceRoutes() {
  const router = express.Router();
  router.get('/tree', requireAuth, handleGetTree);
  router.get('/file', requireAuth, handleGetFile);
  return router;
}

module.exports = {
  createWorkspaceRoutes,
  handleGetTree,
  handleGetFile
};

// Rutas HTTP para gestión de sesiones, cambio de chats y visualización de artefactos.
// Pura capa de interfaz: delega en ManageSessionsUseCase con fallback a resolveArtifact para mocks.
const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { getActiveWorkspaceRoot } = require('../../../infrastructure/workspace/resolver');
const { resolveArtifact } = require('../../../infrastructure/transcript/artifact-resolver');

function createSessionsRoutes({ manageSessionsUseCase, getActiveSessionId, setActiveSessionId }) {
  const router = express.Router();

  router.get('/', requireAuth, (req, res) => {
    const sessions = manageSessionsUseCase.listSessions();
    res.json({ sessions, activeConversationId: getActiveSessionId() });
  });

  router.get('/:id/artifact', requireAuth, (req, res) => {
    const rawPath = req.query.path || req.query.name || req.query.file;
    const convId = req.params.id === 'active' ? getActiveSessionId() : req.params.id;
    const workspaceRoot = getActiveWorkspaceRoot();

    const result = typeof manageSessionsUseCase.readArtifact === 'function'
      ? manageSessionsUseCase.readArtifact(convId, rawPath, workspaceRoot)
      : resolveArtifact(convId, rawPath, workspaceRoot);

    if (!result.success) {
      return res.status(result.statusCode || 500).json(result);
    }

    res.json(result);
  });

  router.get('/:id', requireAuth, async (req, res) => {
    const id = req.params.id;
    const messages = await manageSessionsUseCase.readTranscript(id);
    res.json({ conversationId: id, messages });
  });

  router.post('/switch', requireAuth, (req, res) => {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: 'Missing conversationId parameter.' });
    }

    setActiveSessionId(conversationId);
    res.json({ success: true, activeConversationId: conversationId });
  });

  router.post('/new', requireAuth, async (req, res) => {
    const result = await manageSessionsUseCase.startNewSession();
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    setActiveSessionId('NEW_PENDING_SESSION');
    res.json({
      success: true,
      activeConversationId: 'NEW_PENDING_SESSION'
    });
  });

  return router;
}

module.exports = { createSessionsRoutes };

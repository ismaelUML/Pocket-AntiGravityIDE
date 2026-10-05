// Fábrica de aplicación Express y montaje de rutas de la API.
const express = require('express');
const path = require('path');
const { createCorsMiddleware } = require('../infrastructure/security/origin-guard');
const { createAuthRoutes } = require('../interfaces/http/routes/auth.routes');
const { createChangesRoutes } = require('../interfaces/http/routes/changes.routes');
const { createSessionsRoutes } = require('../interfaces/http/routes/sessions.routes');
const { createWorkspaceRoutes } = require('../interfaces/http/routes/workspace.routes');
const { createPromptRoutes } = require('../interfaces/http/routes/prompt.routes');
const { createPersonasRoutes } = require('../interfaces/http/routes/personas.routes');
const { createSystemRoutes } = require('../interfaces/http/routes/system.routes');
const { upload } = require('./upload-config');

function createApp({
  tunnelManager,
  port,
  sessionWatcher,
  reviewChangesUseCase,
  manageSessionsUseCase,
  managePersonasUseCase,
  sendPromptUseCase,
  ideAutomationAdapter,
  systemDoctor,
  memoryGuard,
  getWsHandler
}) {
  const app = express();

  app.use(createCorsMiddleware({ tunnelManager, activePort: port }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      architecture: 'hexagonal',
      activeConversationId: sessionWatcher.getActiveConversationId(),
      pendingPromptsInQueue: ideAutomationAdapter.getPendingQueueCount(),
      memory: memoryGuard.getMemoryStats(),
      tunnel: tunnelManager.getStatus()
    });
  });

  app.use('/api/auth', createAuthRoutes());
  app.use('/api/changes', createChangesRoutes({
    reviewChangesUseCase,
    onChangesBroadcast: () => {
      const ws = getWsHandler();
      if (ws) ws.broadcastChanges();
    }
  }));
  app.use('/api/sessions', createSessionsRoutes({
    manageSessionsUseCase,
    getActiveSessionId: () => sessionWatcher.getActiveConversationId(),
    setActiveSessionId: (newId) => sessionWatcher.setActiveConversationId(newId)
  }));
  app.use('/api/workspace', createWorkspaceRoutes());
  app.use('/api/personas', createPersonasRoutes({ managePersonasUseCase }));
  app.use('/api', createPromptRoutes({
    sendPromptUseCase,
    ideAutomationPort: ideAutomationAdapter,
    upload
  }));
  app.use('/api/system', createSystemRoutes({
    systemDoctor,
    tunnelManager,
    getActiveSessionId: () => sessionWatcher.getActiveConversationId(),
    getClientCount: () => {
      const ws = getWsHandler();
      return ws ? ws.getClientCount() : 0;
    }
  }));

  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'dashboard', 'index.html'));
  });

  return app;
}

module.exports = {
  createApp
};

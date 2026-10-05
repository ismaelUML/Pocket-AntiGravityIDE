// Punto de entrada del servidor Pocket-AntiGravityIDE.
// Coordina la raíz de composición, el servidor Express HTTP, WebSocket y la observación reactiva.
const http = require('http');
const { loadConfig } = require('./infrastructure/security/pin-auth');
const { WebSocketServerHandler } = require('./interfaces/websockets/websocket-server');
const { createCompositionRoot } = require('./server/composition-root');
const { SessionWatcherService } = require('./server/session-watcher-service');
const { startAutoDetection } = require('./server/session-auto-detector');
const { createApp } = require('./server/app-factory');
const { printServerBanner } = require('./server/banner-printer');

const container = createCompositionRoot();
const config = loadConfig();
const PORT = process.env.PORT || config.port || 3000;

let wsHandler = null;

const sessionWatcher = new SessionWatcherService({
  manageSessionsUseCase: container.manageSessionsUseCase,
  memoryGuard: container.memoryGuard,
  getWsHandler: () => wsHandler
});

const app = createApp({
  ...container,
  port: PORT,
  sessionWatcher,
  getWsHandler: () => wsHandler
});

const server = http.createServer(app);

wsHandler = new WebSocketServerHandler({
  server,
  reviewChangesUseCase: container.reviewChangesUseCase,
  ideAutomationPort: container.ideAutomationAdapter,
  getActiveSessionId: () => sessionWatcher.getActiveConversationId(),
  tunnelManager: container.tunnelManager
});

startAutoDetection(sessionWatcher, 1000);

if (config.preventSleep) {
  container.systemDoctor.setKeepAwake(true);
}

server.listen(PORT, () => {
  printServerBanner(PORT, container.systemDoctor, config, container.DEFAULT_BRAIN_DIR);
});

module.exports = {
  app,
  server,
  container
};

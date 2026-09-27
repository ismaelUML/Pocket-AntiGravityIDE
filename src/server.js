const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// Core Use Cases
const { SendPromptUseCase } = require('./core/usecases/send-prompt.usecase');
const { ReviewChangesUseCase } = require('./core/usecases/review-changes.usecase');
const { ManageSessionsUseCase } = require('./core/usecases/manage-sessions.usecase');
const { ManagePersonasUseCase } = require('./core/usecases/manage-personas.usecase');

// Outbound Infrastructure Adapters
const { JsonConfigAdapter } = require('./infrastructure/config/json-config.adapter');
const { Win32AutomationAdapter } = require('./infrastructure/automation/win32-automation.adapter');
const { GitAdapter } = require('./infrastructure/vcs/git.adapter');
const { JsonlTranscriptAdapter, DEFAULT_BRAIN_DIR } = require('./infrastructure/transcript/jsonl-transcript.adapter');
const { SystemDoctor } = require('./infrastructure/system/doctor');
const { TunnelManager } = require('./infrastructure/system/tunnel-manager');
const { MemoryEvictionGuard } = require('./infrastructure/resilience/memory-eviction');
const { createCorsMiddleware } = require('./infrastructure/security/origin-guard');
const { getLogoBanner, box, COLORS, rgb, BOLD, RESET, DIM } = require('./infrastructure/terminal/theme');

// Inbound Primary Interfaces
const { createAuthRoutes } = require('./interfaces/http/routes/auth.routes');
const { createChangesRoutes } = require('./interfaces/http/routes/changes.routes');
const { createSessionsRoutes } = require('./interfaces/http/routes/sessions.routes');
const { createWorkspaceRoutes } = require('./interfaces/http/routes/workspace.routes');
const { createPromptRoutes } = require('./interfaces/http/routes/prompt.routes');
const { createPersonasRoutes } = require('./interfaces/http/routes/personas.routes');
const { createSystemRoutes } = require('./interfaces/http/routes/system.routes');
const { WebSocketServerHandler } = require('./interfaces/websockets/websocket-server');

const { loadConfig } = require('./infrastructure/security/pin-auth');
const { getActiveWorkspaceRoot } = require('./infrastructure/workspace/resolver');

// ----------------------------------------------------
// 1. Composition Root (El cableado de dependencias)
// Acá se enchufa todo: instanciamos los adaptadores que tocan fierros del SO
// (Win32, Git CLI, logs de disco, config) y se los inyectamos a los Casos de Uso del core.
// Ningún endpoint HTTP toca el sistema operativo de forma directa; todo pasa por este desacoplamiento.
// ----------------------------------------------------
const jsonConfigAdapter = new JsonConfigAdapter();
const ideAutomationAdapter = new Win32AutomationAdapter();
const vcsAdapter = new GitAdapter();
const transcriptAdapter = new JsonlTranscriptAdapter(DEFAULT_BRAIN_DIR);
const systemDoctor = new SystemDoctor();
const tunnelManager = new TunnelManager();
const memoryGuard = new MemoryEvictionGuard({ maxItems: 100, heapThresholdMb: 250 });

const managePersonasUseCase = new ManagePersonasUseCase(jsonConfigAdapter);
const sendPromptUseCase = new SendPromptUseCase(ideAutomationAdapter, managePersonasUseCase);
const reviewChangesUseCase = new ReviewChangesUseCase({
  vcsPort: vcsAdapter,
  ideAutomationPort: ideAutomationAdapter
});
const manageSessionsUseCase = new ManageSessionsUseCase({
  transcriptPort: transcriptAdapter,
  ideAutomationPort: ideAutomationAdapter
});

// Active Session State & Retention Guard
let activeConversationId = null;
const initialSessions = manageSessionsUseCase.listSessions();
const knownSessionIds = new Set(initialSessions.map((s) => s.id));
if (initialSessions.length > 0) {
  activeConversationId = initialSessions[0].id;
}

// ----------------------------------------------------
// 2. HTTP & WebSocket Server Setup
// ----------------------------------------------------
const app = express();
const server = http.createServer(app);

const config = loadConfig();
const PORT = process.env.PORT || config.port || 3000;

// Restricción Quirúrgica de Orígenes (CORS estricto)
app.use(createCorsMiddleware({ tunnelManager, activePort: PORT }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configure Multer with safe limits and cryptographically random filenames
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

// WebSocket Handler con Origin Guard
const wsHandler = new WebSocketServerHandler({
  server,
  reviewChangesUseCase,
  ideAutomationPort: ideAutomationAdapter,
  getActiveSessionId: () => activeConversationId,
  tunnelManager
});

// Transcript Watcher Hook
function startSessionWatcher(sessionId) {
  if (!sessionId || sessionId === 'NEW_PENDING_SESSION') return;
  manageSessionsUseCase.watchSession(sessionId, (convId, stepData) => {
    wsHandler.broadcast({
      type: 'TRANSCRIPT_STEP',
      conversationId: convId,
      step: stepData
    });
    if (stepData.type === 'PLANNER_RESPONSE' || stepData.status === 'DONE') {
      setTimeout(() => wsHandler.broadcastChanges(), 500);
    }
  });
}
if (activeConversationId) startSessionWatcher(activeConversationId);

// Auto-detect genuinely brand-new sessions created on disk con política de desalojo
setInterval(() => {
  const sessions = manageSessionsUseCase.listSessions();
  const currentIds = new Set(sessions.map((s) => s.id));

  // Prune deleted sessions from knownSessionIds
  for (const id of knownSessionIds) {
    if (!currentIds.has(id)) {
      knownSessionIds.delete(id);
    }
  }

  // Desalojo defensivo de memoria si el historial de IDs crece demasiado
  memoryGuard.evictOldest(knownSessionIds, 100);

  // Find if there is a session on disk that was NOT known previously
  const brandNewSession = sessions.find((s) => !knownSessionIds.has(s.id));

  if (brandNewSession) {
    console.log(`[Hexagonal-Server] Auto-detected brand-new session on disk: ${brandNewSession.id}`);
    knownSessionIds.add(brandNewSession.id);
    activeConversationId = brandNewSession.id;
    startSessionWatcher(activeConversationId);
    wsHandler.broadcast({
      type: 'SESSION_AUTO_SWITCHED',
      conversationId: activeConversationId
    });
  }
}, 1000);

// ----------------------------------------------------
// 3. Mount Modular Routes
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    architecture: 'hexagonal',
    activeConversationId,
    pendingPromptsInQueue: ideAutomationAdapter.getPendingQueueCount(),
    memory: memoryGuard.getMemoryStats(),
    tunnel: tunnelManager.getStatus()
  });
});

app.use('/api/auth', createAuthRoutes());
app.use('/api/changes', createChangesRoutes({
  reviewChangesUseCase,
  onChangesBroadcast: () => wsHandler.broadcastChanges()
}));
app.use('/api/sessions', createSessionsRoutes({
  manageSessionsUseCase,
  getActiveSessionId: () => activeConversationId,
  setActiveSessionId: (newId) => {
    activeConversationId = newId;
    if (newId && newId !== 'NEW_PENDING_SESSION') {
      knownSessionIds.add(newId);
    }
    startSessionWatcher(newId);
  }
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
  getActiveSessionId: () => activeConversationId,
  getClientCount: () => wsHandler.getClientCount()
}));

// Dashboard Redirect
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'index.html'));
});

// ----------------------------------------------------
// 4. Arranque del Servidor
// ----------------------------------------------------
if (config.preventSleep) {
  systemDoctor.setKeepAwake(true);
}

server.listen(PORT, () => {
  const root = getActiveWorkspaceRoot();
  const netInfo = systemDoctor.getNetworkInfo(PORT);
  
  console.log('\n' + getLogoBanner() + '\n');
  console.log(box([
    `🚀 ${BOLD}Pocket Antigravity Host Engine${RESET}  ${rgb(COLORS.neonGreen[0], COLORS.neonGreen[1], COLORS.neonGreen[2], '[ONLINE]')}`,
    ``,
    `🎛️  ${BOLD}Control Center:${RESET}    ${rgb(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2], `http://localhost:${PORT}/dashboard`)}`,
    `📱 ${BOLD}Local Wi-Fi URL:${RESET}   ${rgb(COLORS.blurple[0], COLORS.blurple[1], COLORS.blurple[2], netInfo.primaryUrl)}`,
    `🔒 ${BOLD}Security PIN:${RESET}      ${config.pin ? rgb(COLORS.neonGreen[0], COLORS.neonGreen[1], COLORS.neonGreen[2], 'ENABLED (Protected)') : rgb(COLORS.yellow[0], COLORS.yellow[1], COLORS.yellow[2], 'DISABLED')}`,
    `📁 ${BOLD}Workspace:${RESET}         ${DIM}${root}${RESET}`,
    `🧠 ${BOLD}Brain Logs:${RESET}        ${DIM}${DEFAULT_BRAIN_DIR}${RESET}`
  ], { title: `POCKET ANTIGRAVITY v1.7.0 [PORT ${PORT}]`, borderColor: COLORS.blurple }) + '\n');
});

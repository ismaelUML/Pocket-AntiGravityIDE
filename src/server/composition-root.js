// Composición de dependencias e instanciación de adaptadores y casos de uso del Core.
const { SendPromptUseCase } = require('../core/usecases/send-prompt.usecase');
const { ReviewChangesUseCase } = require('../core/usecases/review-changes.usecase');
const { ManageSessionsUseCase } = require('../core/usecases/manage-sessions.usecase');
const { ManagePersonasUseCase } = require('../core/usecases/manage-personas.usecase');

const { JsonConfigAdapter } = require('../infrastructure/config/json-config.adapter');
const { Win32AutomationAdapter } = require('../infrastructure/automation/win32-automation.adapter');
const { GitAdapter } = require('../infrastructure/vcs/git.adapter');
const { JsonlTranscriptAdapter, DEFAULT_BRAIN_DIR } = require('../infrastructure/transcript/jsonl-transcript.adapter');
const { SystemDoctor } = require('../infrastructure/system/doctor');
const { TunnelManager } = require('../infrastructure/system/tunnel-manager');
const { MemoryEvictionGuard } = require('../infrastructure/resilience/memory-eviction');

function createCompositionRoot() {
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

  return {
    jsonConfigAdapter,
    ideAutomationAdapter,
    vcsAdapter,
    transcriptAdapter,
    systemDoctor,
    tunnelManager,
    memoryGuard,
    managePersonasUseCase,
    sendPromptUseCase,
    reviewChangesUseCase,
    manageSessionsUseCase,
    DEFAULT_BRAIN_DIR
  };
}

module.exports = {
  createCompositionRoot
};

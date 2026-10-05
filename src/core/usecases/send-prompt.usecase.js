// Caso de uso: Validación, enriquecimiento con Personas y envío de prompts a la IDE.
// Acepta options con signal para propagar la cancelación en cascada al puerto de automatización.
const { Prompt } = require('../domain/prompt');
const { UseCasePort } = require('./usecase.port');

function _enrichWithPersona(prompt, managePersonas) {
  if (prompt.newChat || !prompt.text) return;
  const persona = managePersonas?.getPersonaById?.(prompt.personaId);
  if (persona) {
    prompt.text = persona.applyToPrompt(prompt.text);
  }
}

class SendPromptUseCase extends UseCasePort {
  constructor(ideAutomationPort, managePersonasUseCase = null) {
    super();
    this.ideAutomation = ideAutomationPort;
    this.managePersonas = managePersonasUseCase;
  }

  async execute(promptData, options = {}) {
    const prompt = new Prompt(promptData);
    if (!prompt.isValid()) {
      return { success: false, error: 'Must provide prompt text, image upload, or file path.' };
    }

    _enrichWithPersona(prompt, this.managePersonas);

    const result = await this.ideAutomation.sendPrompt(prompt, options);
    return {
      success: result.success,
      capacityError: Boolean(result.capacityError),
      aborted: Boolean(result.aborted),
      pendingInQueue: this.ideAutomation.getPendingQueueCount(),
      result
    };
  }
}

module.exports = { SendPromptUseCase };

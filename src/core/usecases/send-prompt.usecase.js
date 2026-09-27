// Caso de uso: Validación, enriquecimiento con Personas y envío de prompts a la IDE.
// Acepta options con signal para propagar la cancelación en cascada al puerto de automatización.
const { Prompt } = require('../domain/prompt');

class SendPromptUseCase {
  constructor(ideAutomationPort, managePersonasUseCase = null) {
    this.ideAutomation = ideAutomationPort;
    this.managePersonas = managePersonasUseCase;
  }

  async execute(promptData, options = {}) {
    const prompt = new Prompt(promptData);
    if (!prompt.isValid()) {
      return { success: false, error: 'Must provide prompt text, image upload, or file path.' };
    }

    // Inyectamos directivas de rol si el usuario seleccionó una persona activa
    if (this.managePersonas && prompt.text && !prompt.newChat) {
      const persona = this.managePersonas.getPersonaById(prompt.personaId);
      if (persona) {
        prompt.text = persona.applyToPrompt(prompt.text);
      }
    }

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

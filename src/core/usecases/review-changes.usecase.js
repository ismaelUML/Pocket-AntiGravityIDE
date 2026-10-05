// Caso de uso para revisar diffs desde el celular.
// Esto maneja la lógica detrás del "Tinder para código": deslizar a la derecha para aceptar o a la izquierda para descartar.
const { ReviewChangesQueryService } = require('./review-changes-query.service');

class ReviewChangesUseCase extends ReviewChangesQueryService {
  constructor({ vcsPort, ideAutomationPort }) {
    super({ vcsPort });
    this.ideAutomation = ideAutomationPort;
  }

  async acceptAll(workspaceRoot) {
    // 1. Disparamos el atajo de la IDE (Alt+Enter) para que Antigravity cierre sus barras flotantes de diff
    try {
      await this.ideAutomation?.acceptFocusedHunk?.();
    } catch (_) {}

    // 2. Y de inmediato mandamos git add . para que el árbol de Git quede sincronizado de verdad
    return await this.vcs.acceptAll(workspaceRoot);
  }

  async acceptFile(workspaceRoot, filePath) {
    // TRAMPA MORTAL: No llames a acceptFocusedHunk acá bajo ninguna circunstancia.
    // En Antigravity, Alt+Enter es un botón nuclear que acepta TODOS los archivos pendientes
    // del proyecto completo. Si el usuario deslizó una sola tarjeta en el celular,
    // únicamente debemos pasarle git add al archivo puntual.
    return await this.vcs.acceptFile(workspaceRoot, filePath);
  }

  async commitChanges(workspaceRoot, { message, push = false } = {}) {
    const commitResult = await this.vcs.commit(workspaceRoot, message);
    if (!commitResult.success) {
      return commitResult;
    }

    if (push) {
      const pushResult = await this.vcs.push(workspaceRoot, 'origin');
      return {
        ...commitResult,
        pushed: pushResult.success,
        pushOutput: pushResult.output || pushResult.error
      };
    }

    return {
      ...commitResult,
      pushed: false
    };
  }
}

module.exports = { ReviewChangesUseCase };

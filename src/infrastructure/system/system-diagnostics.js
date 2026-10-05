// Chequeos de salud y dependencias del sistema anfitrión (Node, Git, PowerShell, IDE).
const { DiagnosticsPort } = require('./system.port');
const {
  formatIdeStatus,
  checkGit,
  checkPowerShell,
  checkAntigravityIde
} = require('./system-probes');

function evaluateNodeVersion() {
  const nodeVersion = process.version;
  const nodeMajor = Number.parseInt(nodeVersion.slice(1).split('.')[0], 10);
  const isOk = nodeMajor >= 18;
  return {
    status: isOk ? 'ok' : 'warning',
    version: nodeVersion,
    recommended: '>= 18.0.0'
  };
}

class SystemDiagnostics extends DiagnosticsPort {
  async getDiagnostics(isKeepAwakeActive = false) {
    const [gitResult, psResult, ideResult] = await Promise.all([
      checkGit(),
      checkPowerShell(),
      checkAntigravityIde()
    ]);

    return {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch,
      node: evaluateNodeVersion(),
      git: gitResult,
      powershell: psResult,
      antigravity: ideResult,
      keepAwake: {
        active: Boolean(isKeepAwakeActive)
      }
    };
  }
}

module.exports = {
  SystemDiagnostics,
  formatIdeStatus
};

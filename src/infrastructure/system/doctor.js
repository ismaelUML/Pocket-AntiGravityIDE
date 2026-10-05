// Fachada del subsistema SystemDoctor.
// Orquesta diagnósticos del sistema, adaptadores de red y prevención de suspensión.
const { SystemDoctorPort } = require('./system.port');
const { SystemDiagnostics } = require('./system-diagnostics');
const { KeepAwakeManager } = require('./keep-awake-manager');
const {
  isVirtualNetworkInterface,
  processInterfaceAddress,
  selectPrimaryEndpoint,
  getNetworkInfo
} = require('./network-doctor');

class SystemDoctor extends SystemDoctorPort {
  constructor(diagnostics = new SystemDiagnostics(), keepAwake = new KeepAwakeManager()) {
    super();
    this._diagnostics = diagnostics;
    this._keepAwake = keepAwake;
  }

  async getDiagnostics() {
    return this._diagnostics.getDiagnostics(this.isKeepAwakeActive());
  }

  getNetworkInfo(port = 3000) {
    return getNetworkInfo(port);
  }

  setKeepAwake(enable) {
    return this._keepAwake.setKeepAwake(enable);
  }

  isKeepAwakeActive() {
    return this._keepAwake.isKeepAwakeActive();
  }

  async _checkGit() {
    return this._diagnostics._checkGit();
  }

  async _checkPowerShell() {
    return this._diagnostics._checkPowerShell();
  }

  async _checkAntigravityIde() {
    return this._diagnostics._checkAntigravityIde();
  }
}

module.exports = {
  SystemDoctor,
  isVirtualNetworkInterface,
  processInterfaceAddress,
  selectPrimaryEndpoint
};

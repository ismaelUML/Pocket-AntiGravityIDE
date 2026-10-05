// Contratos abstractos de diagnóstico de sistema y prevención de suspensión.

class SystemDoctorPort {
  async getDiagnostics() {
    throw new Error('SystemDoctorPort.getDiagnostics must be implemented by adapter');
  }

  getNetworkInfo(_port = 3000) {
    throw new Error('SystemDoctorPort.getNetworkInfo must be implemented by adapter');
  }

  setKeepAwake(_enable) {
    throw new Error('SystemDoctorPort.setKeepAwake must be implemented by adapter');
  }

  isKeepAwakeActive() {
    throw new Error('SystemDoctorPort.isKeepAwakeActive must be implemented by adapter');
  }
}

class KeepAwakePort {
  setKeepAwake(_enable) {
    throw new Error('KeepAwakePort.setKeepAwake must be implemented by adapter');
  }

  isKeepAwakeActive() {
    throw new Error('KeepAwakePort.isKeepAwakeActive must be implemented by adapter');
  }
}

class DiagnosticsPort {
  async getDiagnostics(_isKeepAwakeActive) {
    throw new Error('DiagnosticsPort.getDiagnostics must be implemented by adapter');
  }
}

module.exports = {
  SystemDoctorPort,
  KeepAwakePort,
  DiagnosticsPort
};

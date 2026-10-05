// Contrato para endpoints HTTP de diagnóstico, red y sistema.

class SystemRoutesPort {
  handleDoctor(_req, _res) {
    throw new Error('SystemRoutesPort.handleDoctor must be implemented');
  }

  handleNetwork(_req, _res) {
    throw new Error('SystemRoutesPort.handleNetwork must be implemented');
  }

  handleTunnelStart(_req, _res) {
    throw new Error('SystemRoutesPort.handleTunnelStart must be implemented');
  }

  handlePower(_req, _res) {
    throw new Error('SystemRoutesPort.handlePower must be implemented');
  }

  handleConfig(_req, _res) {
    throw new Error('SystemRoutesPort.handleConfig must be implemented');
  }

  handleStats(_req, _res) {
    throw new Error('SystemRoutesPort.handleStats must be implemented');
  }
}

module.exports = {
  SystemRoutesPort
};

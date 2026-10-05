// Contrato abstracto para detección y filtrado de interfaces de red.

class NetworkDoctorPort {
  getNetworkInfo(_port) {
    throw new Error('NetworkDoctorPort.getNetworkInfo must be implemented by adapter');
  }

  isVirtualInterface(_name) {
    throw new Error('NetworkDoctorPort.isVirtualInterface must be implemented by adapter');
  }

  selectPrimaryEndpoint(_lanUrls, _virtualUrls, _port) {
    throw new Error('NetworkDoctorPort.selectPrimaryEndpoint must be implemented by adapter');
  }
}

module.exports = { NetworkDoctorPort };

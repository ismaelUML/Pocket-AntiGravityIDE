// Definición de contratos y puertos del subsistema de diagnóstico y túneles.
// Re-exporta los contratos segregados para mantener compatibilidad total de interfaces.
const { SystemDoctorPort, KeepAwakePort, DiagnosticsPort } = require('./system-doctor.port');
const { NetworkDoctorPort } = require('./network-doctor.port');
const { TunnelManagerPort, TunnelStatePort } = require('./tunnel.port');

module.exports = {
  SystemDoctorPort,
  TunnelManagerPort,
  KeepAwakePort,
  DiagnosticsPort,
  NetworkDoctorPort,
  TunnelStatePort
};

// Contratos abstractos para restricción de orígenes y CORS.

class OriginGuardPort {
  isOriginAllowed(origin, options) {
    throw new Error('OriginGuardPort.isOriginAllowed: Method not implemented');
  }

  isLocalOrPrivateIp(hostname) {
    throw new Error('OriginGuardPort.isLocalOrPrivateIp: Method not implemented');
  }

  getAllowedOrigins(options) {
    throw new Error('OriginGuardPort.getAllowedOrigins: Method not implemented');
  }

  createCorsMiddleware(options) {
    throw new Error('OriginGuardPort.createCorsMiddleware: Method not implemented');
  }
}

module.exports = { OriginGuardPort };

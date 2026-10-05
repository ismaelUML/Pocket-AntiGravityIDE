// Contratos para enrutadores, autenticación y manejo de errores HTTP.

class HttpRoutesFactoryPort {
  createRouter() {
    throw new Error('HttpRoutesFactoryPort.createRouter must be implemented');
  }
}

class AuthRoutesPort {
  handleStatus(_req, _res) {
    throw new Error('AuthRoutesPort.handleStatus must be implemented');
  }

  handleVerify(_req, _res) {
    throw new Error('AuthRoutesPort.handleVerify must be implemented');
  }
}

class AuthMiddlewarePort {
  requireAuth(_req, _res, _next) {
    throw new Error('AuthMiddlewarePort.requireAuth must be implemented');
  }
}

class HttpErrorHandlingPort {
  handleNotFound(_req, _res) {
    throw new Error('HttpErrorHandlingPort.handleNotFound must be implemented');
  }

  handleServerError(_err, _req, _res, _next) {
    throw new Error('HttpErrorHandlingPort.handleServerError must be implemented');
  }
}

module.exports = {
  HttpRoutesFactoryPort,
  AuthRoutesPort,
  AuthMiddlewarePort,
  HttpErrorHandlingPort
};

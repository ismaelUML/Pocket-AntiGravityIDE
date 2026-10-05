// Abstracciones de eventos, repositorios y servicios del dominio.
// Provee contratos abstractos de ciclo de vida e invariantes de negocio.

class DomainEventPort {
  getOccurredOn() {
    throw new Error('DomainEventPort.getOccurredOn: Method not implemented');
  }

  getEventName() {
    throw new Error('DomainEventPort.getEventName: Method not implemented');
  }
}

class DomainRepositoryPort {
  findById(_id) {
    throw new Error('DomainRepositoryPort.findById: Method not implemented');
  }

  save(_entity) {
    throw new Error('DomainRepositoryPort.save: Method not implemented');
  }

  delete(_id) {
    throw new Error('DomainRepositoryPort.delete: Method not implemented');
  }
}

class DomainServicePort {
  execute(_context) {
    throw new Error('DomainServicePort.execute: Method not implemented');
  }
}

class DomainSpecificationPort {
  isSatisfiedBy(_candidate) {
    throw new Error('DomainSpecificationPort.isSatisfiedBy: Method not implemented');
  }
}

class DomainFactoryPort {
  create(_params) {
    throw new Error('DomainFactoryPort.create: Method not implemented');
  }
}

module.exports = {
  DomainEventPort,
  DomainRepositoryPort,
  DomainServicePort,
  DomainSpecificationPort,
  DomainFactoryPort
};

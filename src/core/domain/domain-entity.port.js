// Abstracciones de entidad y objeto de valor del dominio.
// Definidas como puertos puros para desacoplar el core del modelo físico.

class DomainEntityPort {
  getId() {
    throw new Error('DomainEntityPort.getId: Method not implemented');
  }

  equals(_other) {
    throw new Error('DomainEntityPort.equals: Method not implemented');
  }

  validate() {
    throw new Error('DomainEntityPort.validate: Method not implemented');
  }
}

class AggregateRootPort extends DomainEntityPort {
  getDomainEvents() {
    throw new Error('AggregateRootPort.getDomainEvents: Method not implemented');
  }

  clearDomainEvents() {
    throw new Error('AggregateRootPort.clearDomainEvents: Method not implemented');
  }
}

class ValueObjectPort {
  equals(_other) {
    throw new Error('ValueObjectPort.equals: Method not implemented');
  }

  toJSON() {
    throw new Error('ValueObjectPort.toJSON: Method not implemented');
  }
}

module.exports = {
  DomainEntityPort,
  AggregateRootPort,
  ValueObjectPort
};

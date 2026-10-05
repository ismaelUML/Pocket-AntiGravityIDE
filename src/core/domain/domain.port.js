// Contratos y puertos base para las entidades y objetos de valor del dominio.
// Re-exporta los contratos segregados para mantener compatibilidad total de interfaces.

const {
  DomainEntityPort,
  AggregateRootPort,
  ValueObjectPort
} = require('./domain-entity.port');

const {
  DomainEventPort,
  DomainRepositoryPort,
  DomainServicePort,
  DomainSpecificationPort,
  DomainFactoryPort
} = require('./domain-event.port');

module.exports = {
  DomainEntityPort,
  AggregateRootPort,
  ValueObjectPort,
  DomainEventPort,
  DomainRepositoryPort,
  DomainServicePort,
  DomainSpecificationPort,
  DomainFactoryPort
};

// Contrato de validación estructural y esquemas para envelopes conversacionales.
// Asegura consistencia de formato JSON Lines y valida tipado de eventos.

const TRANSCRIPT_SCHEMA_DEFINITIONS = {
  CURRENT_VERSION: '2.0.0',
  SUPPORTED_VERSIONS: '1.0.0,1.1.0,2.0.0',
  REQUIRE_TIMESTAMP: true,
  REQUIRE_ROLE: true,
  STRICT_TYPE_CHECKING: false,
  MAX_ADDITIONAL_PROPERTIES: 10,
  ALLOW_UNKNOWN_FIELDS: true,
  SCHEMA_VALIDATION_ENABLED: true,
  CACHE_COMPILED_SCHEMAS: true,
  LOG_VALIDATION_WARNINGS: true
};

class TranscriptSchemaPort {
  validateEnvelope(envelope) {
    throw new Error('Method not implemented: validateEnvelope');
  }

  validateStepPayload(step) {
    throw new Error('Method not implemented: validateStepPayload');
  }

  validateToolResult(toolResult) {
    throw new Error('Method not implemented: validateToolResult');
  }

  getSchemaVersion() {
    throw new Error('Method not implemented: getSchemaVersion');
  }

  migratePayload(oldPayload, fromVersion) {
    throw new Error('Method not implemented: migratePayload');
  }
}

module.exports = {
  TRANSCRIPT_SCHEMA_DEFINITIONS,
  TranscriptSchemaPort
};

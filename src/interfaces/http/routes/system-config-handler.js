// Controladores de actualización y lectura de configuración del sistema.
const { saveConfig } = require('../../../infrastructure/security/pin-auth');
const { buildConfigUpdates } = require('./config-update-builder');

const DEFAULT_PORT = 3000;

function resolvePort(config) {
  if (config?.port) return config.port;
  return DEFAULT_PORT;
}

function handleUpdateConfig(systemDoctor, req, res) {
  try {
    const updates = buildConfigUpdates(req.body, systemDoctor);
    const updated = saveConfig(updates);
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleUpdateConfig,
  resolvePort,
  buildConfigUpdates
};

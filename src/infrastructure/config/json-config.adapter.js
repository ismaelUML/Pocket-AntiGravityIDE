// Adaptador de infraestructura para persistencia en archivo JSON local.
// Aca viven los accesos a disco con fs para que los Casos de Uso no se ensucien
// con rutas del sistema operativo ni errores de I/O sincrónicos.
const fs = require('fs');
const path = require('path');
const { ConfigPort } = require('../../core/ports/config.port');
const { mergeConfigUpdates } = require('./config-validator');

const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', '..', '..', 'pocket.config.json');

class JsonConfigAdapter extends ConfigPort {
  constructor(configPath = DEFAULT_CONFIG_PATH) {
    super();
    this.configPath = configPath;
  }

  loadConfig() {
    let config = { pin: '1234', port: 3000 };

    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        config = { ...config, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[JsonConfigAdapter] Error reading config file, falling back to defaults:', err.message);
    }

    if (process.env.POCKET_PIN !== undefined) {
      config.pin = process.env.POCKET_PIN;
    }

    return config;
  }

  saveConfig(updates = {}) {
    const current = this.loadConfig();
    const next = mergeConfigUpdates(current, updates);

    try {
      fs.writeFileSync(this.configPath, JSON.stringify(next, null, 2), 'utf8');
    } catch (err) {
      console.error('[JsonConfigAdapter] Failed to write config to disk:', err.message);
      throw err;
    }

    return next;
  }
}

module.exports = {
  JsonConfigAdapter,
  DEFAULT_CONFIG_PATH
};

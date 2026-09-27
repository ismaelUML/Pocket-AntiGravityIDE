// Adaptador de infraestructura para persistencia en archivo JSON local.
// Aca viven los accesos a disco con fs para que los Casos de Uso no se ensucien
// con rutas del sistema operativo ni errores de I/O sincrónicos.
const fs = require('fs');
const path = require('path');
const { ConfigPort } = require('../../core/ports/config.port');

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
      // Si el archivo esta corrupto o bloqueado a medio escribir por otro proceso,
      // no rompemos el servidor: usamos la configuracion por defecto y logueamos advertencia.
      console.warn('[JsonConfigAdapter] Error reading config file, falling back to defaults:', err.message);
    }

    if (process.env.POCKET_PIN !== undefined) {
      config.pin = process.env.POCKET_PIN;
    }

    return config;
  }

  saveConfig(updates = {}) {
    const current = this.loadConfig();
    const next = { ...current, ...updates };

    if (updates.pin !== undefined) {
      next.pin = String(updates.pin).trim();
    }
    if (updates.port !== undefined) {
      const p = parseInt(updates.port, 10);
      if (!isNaN(p) && p > 0 && p < 65536) next.port = p;
    }

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

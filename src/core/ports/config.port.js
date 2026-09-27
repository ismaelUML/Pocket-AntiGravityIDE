// Contrato puro para leer y guardar la configuración de la app.
// Si mañana tiramos el JSON por la ventana y metemos SQLite o variables de entorno puras,
// el core no tiene por qué enterarse ni sufrir.
class ConfigPort {
  loadConfig() {
    throw new Error('Method not implemented.');
  }

  saveConfig(updates) {
    throw new Error('Method not implemented.');
  }
}

module.exports = { ConfigPort };

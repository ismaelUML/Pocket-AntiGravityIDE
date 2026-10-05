// Controladores de diagnóstico de doctor, red, túnel y gestión de energía.
const { loadConfig, saveConfig } = require('../../../infrastructure/security/pin-auth');
const { resolvePort } = require('./system-config-handler');
const { handleQr } = require('./qr-code-handler');

async function handleDoctor(systemDoctor, res) {
  try {
    const diagnostics = await systemDoctor.getDiagnostics();
    res.json(diagnostics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function handleNetwork(systemDoctor, res) {
  try {
    const config = loadConfig();
    const port = resolvePort(config);
    res.json(systemDoctor.getNetworkInfo(port));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleTunnelStart(tunnelManager, res) {
  try {
    const config = loadConfig();
    const port = resolvePort(config);
    res.json(await tunnelManager.start(port));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function handlePower(systemDoctor, req, res) {
  try {
    const enable = req.body?.enable;
    const active = systemDoctor.setKeepAwake(Boolean(enable));
    saveConfig({ preventSleep: active });
    res.json({ active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleQr,
  handleDoctor,
  handleNetwork,
  handleTunnelStart,
  handlePower
};

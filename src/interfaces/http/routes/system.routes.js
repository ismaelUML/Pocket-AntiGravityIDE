// Rutas HTTP para diagnóstico, configuración y estado del sistema.
// Modularizado en controladores independientes para cumplir con estándares de mantenibilidad y tamaño acotado.
const express = require('express');
const QRCode = require('qrcode');
const { loadConfig, saveConfig } = require('../../../infrastructure/security/pin-auth');

async function handleQr(req, res) {
  try {
    const text = req.query.text;
    if (!text) return res.status(400).send('Missing text query parameter');
    const svg = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: { dark: '#ffffff', light: '#00000000' }
    });
    res.type('image/svg+xml').send(svg);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

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
    const port = config.port || 3000;
    res.json(systemDoctor.getNetworkInfo(port));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleTunnelStart(tunnelManager, res) {
  try {
    const config = loadConfig();
    const port = config.port || 3000;
    res.json(await tunnelManager.start(port));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function handlePower(systemDoctor, req, res) {
  try {
    const { enable } = req.body;
    const active = systemDoctor.setKeepAwake(Boolean(enable));
    saveConfig({ preventSleep: active });
    res.json({ active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function handleUpdateConfig(systemDoctor, req, res) {
  try {
    const { pin, port, preventSleep, defaultPersona } = req.body;
    const updates = {};
    if (pin !== undefined) updates.pin = pin;
    if (port !== undefined) updates.port = port;
    if (preventSleep !== undefined) {
      updates.preventSleep = Boolean(preventSleep);
      systemDoctor.setKeepAwake(Boolean(preventSleep));
    }
    if (defaultPersona !== undefined) updates.defaultPersona = defaultPersona;

    const updated = saveConfig(updates);
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function handleStats(getActiveSessionId, getClientCount, res) {
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    activeConversationId: getActiveSessionId ? getActiveSessionId() : null,
    clientCount: getClientCount ? getClientCount() : 0,
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  });
}

function createSystemRoutes({ systemDoctor, tunnelManager, getActiveSessionId, getClientCount }) {
  const router = express.Router();

  router.get('/qr', handleQr);
  router.get('/doctor', (req, res) => handleDoctor(systemDoctor, res));
  router.get('/network', (req, res) => handleNetwork(systemDoctor, res));
  router.get('/tunnel', (req, res) => res.json(tunnelManager.getStatus()));
  router.post('/tunnel/start', (req, res) => handleTunnelStart(tunnelManager, res));
  router.post('/tunnel/stop', (req, res) => res.json(tunnelManager.stop()));
  router.post('/power', (req, res) => handlePower(systemDoctor, req, res));
  router.get('/config', (req, res) => res.json(loadConfig()));
  router.post('/config', (req, res) => handleUpdateConfig(systemDoctor, req, res));
  router.get('/stats', (req, res) => handleStats(getActiveSessionId, getClientCount, res));

  return router;
}

module.exports = { createSystemRoutes };

// Rutas HTTP para diagnóstico, configuración y estado del sistema.
const express = require('express');
const { loadConfig } = require('../../../infrastructure/security/pin-auth');
const { handleUpdateConfig } = require('./system-config-handler');
const {
  handleQr,
  handleDoctor,
  handleNetwork,
  handleTunnelStart,
  handlePower
} = require('./system-doctor-handler');
const { handleStats } = require('./system-stats-handler');

function createSystemRoutes({ systemDoctor, tunnelManager, getActiveSessionId, getClientCount }) {
  const router = express.Router();
  router.get('/qr', handleQr);
  router.get('/doctor', (req, res) => {
    return handleDoctor(systemDoctor, res);
  });
  router.get('/network', (req, res) => {
    return handleNetwork(systemDoctor, res);
  });
  router.get('/tunnel', (req, res) => {
    return res.json(tunnelManager.getStatus());
  });
  router.post('/tunnel/start', (req, res) => {
    return handleTunnelStart(tunnelManager, res);
  });
  router.post('/tunnel/stop', (req, res) => {
    return res.json(tunnelManager.stop());
  });
  router.post('/power', (req, res) => {
    return handlePower(systemDoctor, req, res);
  });
  router.get('/config', (req, res) => {
    return res.json(loadConfig());
  });
  router.post('/config', (req, res) => {
    return handleUpdateConfig(systemDoctor, req, res);
  });
  router.get('/stats', (req, res) => {
    return handleStats(getActiveSessionId, getClientCount, res);
  });
  return router;
}

module.exports = {
  createSystemRoutes,
  handleQr,
  handleDoctor,
  handleNetwork,
  handleTunnelStart,
  handlePower,
  handleUpdateConfig,
  handleStats
};

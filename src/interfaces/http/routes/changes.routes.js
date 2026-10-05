// Rutas HTTP para revisión de cambios, aceptación granular y commits desde el móvil.
const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { isInvalidFileParam } = require('./changes-validator');
const { handleAcceptChanges, handleRejectChanges } = require('./changes-action-handler');
const {
  handleGetChanges,
  handleStagedChanges,
  handleCommitChanges
} = require('./changes-query-handler');

function createChangesRoutes({ reviewChangesUseCase, onChangesBroadcast }) {
  const router = express.Router();

  router.get('/', requireAuth, (req, res) => {
    return handleGetChanges(reviewChangesUseCase, req, res);
  });
  router.post('/accept', requireAuth, (req, res) => {
    return handleAcceptChanges(reviewChangesUseCase, onChangesBroadcast, req, res);
  });
  router.post('/reject', requireAuth, (req, res) => {
    return handleRejectChanges(reviewChangesUseCase, onChangesBroadcast, req, res);
  });
  router.get('/staged', requireAuth, (req, res) => {
    return handleStagedChanges(reviewChangesUseCase, req, res);
  });
  router.post('/commit', requireAuth, (req, res) => {
    return handleCommitChanges(reviewChangesUseCase, onChangesBroadcast, req, res);
  });

  return router;
}

module.exports = {
  createChangesRoutes,
  handleGetChanges,
  handleAcceptChanges,
  handleRejectChanges,
  handleStagedChanges,
  handleCommitChanges,
  isInvalidFileParam
};

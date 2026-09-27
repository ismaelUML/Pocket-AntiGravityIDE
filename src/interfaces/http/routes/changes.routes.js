// Rutas HTTP para revisión de cambios, aceptación granular y commits desde el móvil.
// Modularizado en controladores independientes para mantener cada función bajo 40 líneas.
const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { getActiveWorkspaceRoot } = require('../../../infrastructure/workspace/resolver');

async function handleGetChanges(reviewChangesUseCase, req, res) {
  const root = getActiveWorkspaceRoot();
  const changes = await reviewChangesUseCase.getChanges(root);
  res.json(changes);
}

async function handleAcceptChanges(reviewChangesUseCase, onChangesBroadcast, req, res) {
  const root = getActiveWorkspaceRoot();
  const { file } = req.body || {};
  const result = file
    ? await reviewChangesUseCase.acceptFile(root, file)
    : await reviewChangesUseCase.acceptAll(root);

  if (typeof onChangesBroadcast === 'function') onChangesBroadcast();
  res.status(result.success ? 200 : 500).json(result);
}

async function handleRejectChanges(reviewChangesUseCase, onChangesBroadcast, req, res) {
  const root = getActiveWorkspaceRoot();
  const { file } = req.body || {};
  const result = file
    ? await reviewChangesUseCase.rejectFile(root, file)
    : await reviewChangesUseCase.rejectAll(root);

  if (typeof onChangesBroadcast === 'function') onChangesBroadcast();
  res.status(result.success ? 200 : 500).json(result);
}

async function handleStagedChanges(reviewChangesUseCase, req, res) {
  try {
    const root = getActiveWorkspaceRoot();
    const [stagedChanges, branchInfo, suggestedMessage] = await Promise.all([
      reviewChangesUseCase.getStagedChanges(root),
      reviewChangesUseCase.getBranchInfo(root),
      reviewChangesUseCase.getCommitSuggestion(root)
    ]);
    res.json({ staged: stagedChanges, branch: branchInfo, suggestedMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleCommitChanges(reviewChangesUseCase, onChangesBroadcast, req, res) {
  try {
    const root = getActiveWorkspaceRoot();
    const { message, push = true, remote, branch } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Commit message is required.' });
    }

    const result = await reviewChangesUseCase.commitChanges(root, {
      message: message.trim(),
      push: Boolean(push),
      remote,
      branch
    });

    if (typeof onChangesBroadcast === 'function') onChangesBroadcast();
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

function createChangesRoutes({ reviewChangesUseCase, onChangesBroadcast }) {
  const router = express.Router();

  router.get('/', requireAuth, (req, res) => handleGetChanges(reviewChangesUseCase, req, res));
  router.post('/accept', requireAuth, (req, res) => handleAcceptChanges(reviewChangesUseCase, onChangesBroadcast, req, res));
  router.post('/reject', requireAuth, (req, res) => handleRejectChanges(reviewChangesUseCase, onChangesBroadcast, req, res));
  router.get('/staged', requireAuth, (req, res) => handleStagedChanges(reviewChangesUseCase, req, res));
  router.post('/commit', requireAuth, (req, res) => handleCommitChanges(reviewChangesUseCase, onChangesBroadcast, req, res));

  return router;
}

module.exports = { createChangesRoutes };

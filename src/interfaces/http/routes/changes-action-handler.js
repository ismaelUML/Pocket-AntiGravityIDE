// Controladores para acciones de aceptar y rechazar cambios en Git.
const { getActiveWorkspaceRoot } = require('../../../infrastructure/workspace/resolver');
const { validateFileParam, STATUS_CODE_MAP } = require('./changes-validator');
const { notifyBroadcast } = require('./changes-notification');

async function executeAccept(usecase, root, file) {
  if (file) {
    return usecase.acceptFile(root, file);
  }
  return usecase.acceptAll(root);
}

async function handleAcceptChanges(reviewChangesUseCase, onChangesBroadcast, req, res) {
  const file = req.body?.file;
  if (!validateFileParam(file)) {
    return res.status(400).json({ success: false, error: 'Invalid file parameter' });
  }

  const root = getActiveWorkspaceRoot();
  const result = await executeAccept(reviewChangesUseCase, root, file);
  notifyBroadcast(onChangesBroadcast);
  const status = STATUS_CODE_MAP[Boolean(result.success)];
  res.status(status).json(result);
}

async function executeReject(usecase, root, file) {
  if (file) {
    return usecase.rejectFile(root, file);
  }
  return usecase.rejectAll(root);
}

async function handleRejectChanges(reviewChangesUseCase, onChangesBroadcast, req, res) {
  const file = req.body?.file;
  if (!validateFileParam(file)) {
    return res.status(400).json({ success: false, error: 'Invalid file parameter' });
  }

  const root = getActiveWorkspaceRoot();
  const result = await executeReject(reviewChangesUseCase, root, file);
  notifyBroadcast(onChangesBroadcast);
  const status = STATUS_CODE_MAP[Boolean(result.success)];
  res.status(status).json(result);
}

module.exports = {
  handleAcceptChanges,
  handleRejectChanges,
  executeAccept,
  executeReject
};

// Controladores para consulta de cambios, inspección de staged y confirmación de commits.
const { getActiveWorkspaceRoot } = require('../../../infrastructure/workspace/resolver');
const { validateCommitMessage, COMMIT_STATUS_MAP } = require('./changes-validator');
const { notifyBroadcast } = require('./changes-notification');

async function handleGetChanges(reviewChangesUseCase, req, res) {
  const root = getActiveWorkspaceRoot();
  const changes = await reviewChangesUseCase.getChanges(root);
  res.json(changes);
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
    const safeMessage = validateCommitMessage(req.body?.message);
    if (!safeMessage) {
      return res.status(400).json({ success: false, error: 'Commit message is required.' });
    }

    const root = getActiveWorkspaceRoot();
    const push = req.body?.push !== false;
    const result = await reviewChangesUseCase.commitChanges(root, {
      message: safeMessage,
      push
    });

    notifyBroadcast(onChangesBroadcast);
    const status = COMMIT_STATUS_MAP[Boolean(result.success)];
    res.status(status).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleGetChanges,
  handleStagedChanges,
  handleCommitChanges
};

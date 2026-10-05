// Generador inteligente de mensajes de Conventional Commits.
const { CommitSuggesterPort } = require('./commit-suggester.port');
const { isTestOnly, isDocsOnly, isVcsOnly } = require('./commit-type-predicates');
const { isUiOnly, isApiOnly } = require('./commit-ui-predicates');
const {
  extractFilePath,
  resolveCategoryMessage,
  resolveUiMessage,
  resolveSingleFileMessage
} = require('./commit-message-formatter');

function generateSuggestedCommitMessage(stagedFiles = []) {
  if (!stagedFiles || stagedFiles.length === 0) {
    return 'chore: update workspace files';
  }

  const files = stagedFiles.map(extractFilePath);

  const catMsg = resolveCategoryMessage(files);
  if (catMsg) return catMsg;

  const uiMsg = resolveUiMessage(files);
  if (uiMsg) return uiMsg;

  if (files.length === 1) {
    return resolveSingleFileMessage(files[0]);
  }

  return `feat: update ${files.length} project files`;
}

module.exports = {
  isTestOnly,
  isDocsOnly,
  isUiOnly,
  isApiOnly,
  isVcsOnly,
  generateSuggestedCommitMessage,
  CommitSuggesterPort
};

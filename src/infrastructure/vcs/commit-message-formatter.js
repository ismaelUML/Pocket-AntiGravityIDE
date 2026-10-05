// Formateo y ensamblado de plantillas de mensajes convencionales para commits.
const path = require('path');
const { isUiOnly } = require('./commit-ui-predicates');
const { resolveCategoryMessage } = require('./category-message-resolver');

function extractFilePath(item) {
  if (typeof item === 'string') return item;
  return item && item.file ? item.file : '';
}

function resolveUiMessage(files) {
  if (!isUiOnly(files)) return null;
  return files.length === 1
    ? `feat(ui): update ${path.basename(files[0])}`
    : 'feat(ui): update mobile interface and components';
}

function resolveSingleFileMessage(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(base);
  const name = base.replace(ext, '');
  return `feat(${name}): update ${base}`;
}

module.exports = {
  extractFilePath,
  resolveCategoryMessage,
  resolveUiMessage,
  resolveSingleFileMessage
};

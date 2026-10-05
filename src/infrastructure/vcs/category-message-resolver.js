// Resolutor de mensajes de commit para categorías semánticas (test, docs, api, vcs).
const { isTestOnly, isDocsOnly, isVcsOnly } = require('./commit-type-predicates');
const { isApiOnly } = require('./commit-ui-predicates');

function resolveCategoryMessage(files) {
  if (isTestOnly(files)) return 'test: add and update test suites';
  if (isDocsOnly(files)) return 'docs: update project documentation and guides';
  if (isApiOnly(files)) return 'feat(api): update HTTP routes and endpoints';
  if (isVcsOnly(files)) return 'feat(vcs): enhance version control system capabilities';
  return null;
}

module.exports = {
  resolveCategoryMessage
};

// Predicados de clasificación de archivos para tests y documentación.
const { isVcsOnly } = require('./commit-vcs-predicates');

function isTestFile(file) {
  return file.includes('test') || file.includes('.spec.');
}

function isTestOnly(files) {
  return files.length > 0 && files.every(isTestFile);
}

function isDocFile(file) {
  return file.endsWith('.md') || file.includes('docs/');
}

function isDocsOnly(files) {
  return files.length > 0 && files.every(isDocFile);
}

module.exports = {
  isTestOnly,
  isDocsOnly,
  isVcsOnly
};

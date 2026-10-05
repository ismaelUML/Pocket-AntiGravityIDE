// Predicados de clasificación de archivos para el subsistema VCS.

function isVcsFile(file) {
  return file.includes('src/infrastructure/vcs') || file.includes('src/core/ports/vcs');
}

function isVcsOnly(files) {
  return files.length > 0 && files.every(isVcsFile);
}

module.exports = {
  isVcsFile,
  isVcsOnly
};

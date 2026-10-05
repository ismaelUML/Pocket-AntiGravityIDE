// Predicados de clasificación de archivos para UI e interfaces HTTP/API.

function isUiFile(file) {
  return file.startsWith('public/') || file.endsWith('.html') || file.endsWith('.css');
}

function isUiOnly(files) {
  return files.length > 0 && files.every(isUiFile);
}

function isApiFile(file) {
  return file.includes('src/interfaces/http') || file.includes('routes/');
}

function isApiOnly(files) {
  return files.length > 0 && files.every(isApiFile);
}

module.exports = {
  isUiOnly,
  isApiOnly
};

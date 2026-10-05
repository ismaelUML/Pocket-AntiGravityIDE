// Lectura segura de contenido de archivos del espacio de trabajo y detección de lenguaje.
const fs = require('fs');
const path = require('path');

const EXTENSION_MAP = {
  '.js': 'javascript',
  '.ts': 'typescript',
  '.jsx': 'javascript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.md': 'markdown',
  '.py': 'python',
  '.ps1': 'powershell',
  '.sh': 'bash',
  '.bat': 'batch',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.xml': 'xml',
  '.sql': 'sql'
};

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_MAP[ext] || 'plaintext';
}

function validateWorkspaceFile(fullPath) {
  if (!fs.existsSync(fullPath)) return 'File not found.';
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) return 'Path is not a regular file.';
  if (stat.size > 500 * 1024) return 'File too large to preview (>500KB).';
  return null;
}

function getWorkspaceFileContent(rootDir, relativePath) {
  try {
    const safeRelPath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(rootDir, safeRelPath);

    const validationError = validateWorkspaceFile(fullPath);
    if (validationError) {
      return { success: false, error: validationError };
    }

    return {
      success: true,
      relativePath: safeRelPath.replace(/\\/g, '/'),
      language: detectLanguage(fullPath),
      content: fs.readFileSync(fullPath, 'utf8')
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  detectLanguage,
  validateWorkspaceFile,
  getWorkspaceFileContent
};

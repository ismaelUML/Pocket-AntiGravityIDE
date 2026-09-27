// Utilidades compartidas para ejecución y parseo de respuestas JSON de scripts PowerShell nativos.
// Centraliza la resolución del ejecutable del sistema y la extracción de bloques JSON sin regex backtracking.
const path = require('path');

const PS_SYSTEM_BIN = process.platform === 'win32'
  ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  : 'powershell.exe';

/**
 * Extrae y parsea de forma segura el bloque JSON { ... } emitido por scripts de PowerShell.
 * Evita expresiones regulares con backtracking catastrófico (O(N) exacto).
 * @param {string} rawOutput
 * @returns {object|null}
 */
function extractJsonBlock(rawOutput) {
  if (!rawOutput) return null;
  const str = String(rawOutput).trim();
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const sanitized = str.slice(start, end + 1).replace(/[\r\n\t]+/g, ' ');
    return JSON.parse(sanitized);
  } catch (_) {
    return null;
  }
}

module.exports = {
  PS_SYSTEM_BIN,
  extractJsonBlock
};

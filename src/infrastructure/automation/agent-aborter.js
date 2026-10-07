// Ejecutor de PowerShell para abortar turnos en Antigravity IDE vía Win32.
// Dispara Ctrl+D para cancelar la generación o ejecución de herramientas de inmediato.
const { spawn } = require('child_process');
const path = require('path');
const { PS_SYSTEM_BIN } = require('./ps-parser');

/**
 * Inyecta Ctrl+D a la ventana de Antigravity IDE para cancelar el turno activo.
 * @returns {Promise<{success: boolean, message?: string}>}
 */
function triggerIdeAbort() {
  return new Promise((resolve) => {
    const psScript = path.join(__dirname, 'native', 'abort-injector.ps1');
    const child = spawn(PS_SYSTEM_BIN, [
      '-NoProfile',
      '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass',
      '-File', psScript
    ], { windowsHide: true });

    let output = '';
    child.stdout.on('data', (d) => { output += d.toString(); });
    child.stderr.on('data', (d) => { output += d.toString(); });

    child.on('close', (code) => {
      const trimmed = output.trim();
      const isSuccess = code === 0 && !trimmed.startsWith('WARNING');
      resolve({ success: isSuccess, message: trimmed });
    });
  });
}

module.exports = { triggerIdeAbort };

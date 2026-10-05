// Sondas y chequeos individuales de dependencias del sistema anfitrión.
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

function formatIdeStatus(isRunning) {
  if (isRunning) {
    return { status: 'running', details: 'Antigravity IDE process active' };
  }
  return { status: 'not_detected', details: 'Antigravity IDE process not found in tasklist' };
}

async function checkGit() {
  try {
    const { stdout } = await execAsync('git --version', { timeout: 3000 });
    return { status: 'ok', version: stdout.trim() };
  } catch (_) {
    return { status: 'missing', message: 'Git CLI not found in PATH' };
  }
}

async function checkPowerShell() {
  try {
    const cmd = 'powershell.exe -NoProfile -Command "$PSVersionTable.PSVersion.ToString()"';
    const { stdout } = await execAsync(cmd, { timeout: 4000 });
    return { status: 'ok', version: stdout.trim() };
  } catch (_) {
    return { status: 'missing', message: 'PowerShell not detected' };
  }
}

async function checkAntigravityIde() {
  try {
    if (process.platform !== 'win32') {
      return { status: 'unknown', details: 'Platform is not Windows' };
    }
    const { stdout } = await execAsync('tasklist', { timeout: 4000 });
    const isRunning = stdout.toLowerCase().includes('antigravity');
    return formatIdeStatus(isRunning);
  } catch (err) {
    return { status: 'error', details: err.message };
  }
}

module.exports = {
  formatIdeStatus,
  checkGit,
  checkPowerShell,
  checkAntigravityIde
};

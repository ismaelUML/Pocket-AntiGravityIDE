// Utilidades de bajo nivel para invocación y aniquilación de procesos de túnel.
// En Windows necesitamos taskkill /T /F para no dejar huérfanos procesos cmd.exe o cloudflared.
const path = require('path');
const { spawn, exec } = require('child_process');

const CMD_BIN = process.platform === 'win32'
  ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe')
  : 'sh';

function spawnTunnelProcess(commandArgs) {
  return spawn(CMD_BIN, ['/c', ...commandArgs], { windowsHide: true });
}

function _killWin(pid) {
  exec(`taskkill /pid ${pid} /T /F`, () => {});
}

function _killUnix(proc) {
  try {
    proc.kill('SIGTERM');
  } catch (_) {}
}

function killProcessTree(proc) {
  if (!proc?.pid) return;

  if (process.platform === 'win32') {
    _killWin(proc.pid);
    return;
  }

  _killUnix(proc);
}

module.exports = {
  CMD_BIN,
  spawnTunnelProcess,
  killProcessTree
};

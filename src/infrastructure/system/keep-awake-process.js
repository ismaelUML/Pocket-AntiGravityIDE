// Subproceso nativo de Windows para SetThreadExecutionState.
const path = require('path');
const { spawn } = require('child_process');

const PS_BIN = process.platform === 'win32'
  ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  : 'powershell.exe';

const KEEP_AWAKE_SCRIPT = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class NativePower {
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
"@
[NativePower]::SetThreadExecutionState(0x80000001)
while($true) { Start-Sleep -Seconds 60 }
`;

function spawnKeepAwakeSubprocess(onExit) {
  const proc = spawn(PS_BIN, [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', KEEP_AWAKE_SCRIPT
  ], { windowsHide: true });

  proc.on('exit', onExit);
  proc.on('error', onExit);
  return proc;
}

function killKeepAwakeSubprocess(proc) {
  if (!proc) return;
  try {
    proc.kill();
  } catch (_) {}
}

module.exports = {
  PS_BIN,
  spawnKeepAwakeSubprocess,
  killKeepAwakeSubprocess
};

// Diagnóstico y telemetría del sistema operativo (SystemDoctor).
// Complejidad ciclomática reducida (<= 5 por función).
// Manejo defensivo de adaptadores virtuales y estados de suspensión de Windows.
const os = require('os');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Filtramos adaptadores virtuales molestos (WSL, Hyper-V, Tailscale, ZeroTier).
// Si le mostramos al usuario la IP de WSL en el código QR, el celular intenta
// conectarse a una red virtual interna inalcanzable y se queda colgado esperando.
function isVirtualNetworkInterface(name) {
  const lower = name.toLowerCase();
  return lower.includes('tailscale') ||
         lower.includes('zerotier') ||
         lower.includes('vethernet') ||
         lower.includes('wsl');
}

function processInterfaceAddress(name, addr, port, isVirtual) {
  if (addr.family !== 'IPv4' || addr.internal) return null;

  return {
    interface: name,
    ip: addr.address,
    url: `http://${addr.address}:${port}`,
    type: isVirtual ? 'virtual' : 'lan'
  };
}

function selectPrimaryEndpoint(lanUrls, virtualUrls, port) {
  if (lanUrls.length > 0) {
    return { url: lanUrls[0].url, ip: lanUrls[0].ip };
  }
  if (virtualUrls.length > 0) {
    return { url: virtualUrls[0].url, ip: virtualUrls[0].ip };
  }
  return { url: `http://localhost:${port}`, ip: '127.0.0.1' };
}

class SystemDoctor {
  constructor() {
    this._keepAwakeProcess = null;
    this._isKeepAwakeEnabled = false;
  }

  async getDiagnostics() {
    const [gitResult, psResult, ideResult] = await Promise.all([
      this._checkGit(),
      this._checkPowerShell(),
      this._checkAntigravityIde()
    ]);

    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0], 10);

    return {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      arch: process.arch,
      node: {
        status: nodeMajor >= 18 ? 'ok' : 'warning',
        version: nodeVersion,
        recommended: '>= 18.0.0'
      },
      git: gitResult,
      powershell: psResult,
      antigravity: ideResult,
      keepAwake: {
        active: this._isKeepAwakeEnabled
      }
    };
  }

  getNetworkInfo(port = 3000) {
    const interfaces = os.networkInterfaces();
    const result = {
      hostname: os.hostname(),
      port,
      primaryUrl: `http://localhost:${port}`,
      lanUrls: [],
      virtualUrls: []
    };

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      const isVirtual = isVirtualNetworkInterface(name);

      for (const addr of addrs) {
        const entry = processInterfaceAddress(name, addr, port, isVirtual);
        if (!entry) continue;

        if (isVirtual) {
          result.virtualUrls.push(entry);
        } else {
          result.lanUrls.push(entry);
        }
      }
    }

    const primary = selectPrimaryEndpoint(result.lanUrls, result.virtualUrls, port);
    result.primaryUrl = primary.url;
    result.primaryIp = primary.ip;

    return result;
  }

  setKeepAwake(enable) {
    if (process.platform !== 'win32') {
      this._isKeepAwakeEnabled = Boolean(enable);
      return this._isKeepAwakeEnabled;
    }

    // Si estás tirado en el sillón esperando que el agente termine un refactoring grande,
    // el plan de energía de Windows te suspende la PC a los 5 minutos y te mata la sesión WebSocket.
    // Usamos SetThreadExecutionState con ES_CONTINUOUS | ES_SYSTEM_REQUIRED (0x80000001)
    // para decirle al kernel de Windows que la PC está ocupada sin cambiar las opciones de energía del sistema.
    if (enable && !this._keepAwakeProcess) {
      const psScript = `
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class NativePower {
            [DllImport("kernel32.dll", SetLastError = true)]
            public static extern uint SetThreadExecutionState(uint esFlags);
        }
"@
        # 0x80000001 = ES_CONTINUOUS | ES_SYSTEM_REQUIRED
        [NativePower]::SetThreadExecutionState(0x80000001)
        while($true) { Start-Sleep -Seconds 60 }
      `;

      this._keepAwakeProcess = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-Command', psScript
      ], { windowsHide: true });

      this._keepAwakeProcess.on('exit', () => {
        this._keepAwakeProcess = null;
        this._isKeepAwakeEnabled = false;
      });

      this._keepAwakeProcess.on('error', () => {
        this._keepAwakeProcess = null;
        this._isKeepAwakeEnabled = false;
      });

      this._isKeepAwakeEnabled = true;
    } else if (!enable && this._keepAwakeProcess) {
      try {
        this._keepAwakeProcess.kill();
      } catch (_) {}
      this._keepAwakeProcess = null;
      this._isKeepAwakeEnabled = false;
    }

    return this._isKeepAwakeEnabled;
  }

  isKeepAwakeActive() {
    return this._isKeepAwakeEnabled;
  }

  async _checkGit() {
    try {
      const { stdout } = await execAsync('git --version', { timeout: 3000 });
      return { status: 'ok', version: stdout.trim() };
    } catch (_) {
      return { status: 'missing', message: 'Git CLI not found in PATH' };
    }
  }

  async _checkPowerShell() {
    try {
      const { stdout } = await execAsync('powershell.exe -NoProfile -Command "$PSVersionTable.PSVersion.ToString()"', { timeout: 4000 });
      return { status: 'ok', version: stdout.trim() };
    } catch (_) {
      return { status: 'missing', message: 'PowerShell not detected' };
    }
  }

  async _checkAntigravityIde() {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('tasklist', { timeout: 4000 });
        const isRunning = stdout.toLowerCase().includes('antigravity');
        return {
          status: isRunning ? 'running' : 'not_detected',
          details: isRunning ? 'Antigravity IDE process active' : 'Antigravity IDE process not found in tasklist'
        };
      }
      return { status: 'unknown', details: 'Platform is not Windows' };
    } catch (err) {
      return { status: 'error', details: err.message };
    }
  }
}

module.exports = {
  SystemDoctor,
  isVirtualNetworkInterface,
  processInterfaceAddress,
  selectPrimaryEndpoint
};

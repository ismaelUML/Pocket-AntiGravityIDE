// Gestor de túneles públicos con Circuit Breaker y Conmutación por Fallo (Failover).
// A nadie le gusta que el túnel muera en medio de una demo remota o mientras estás en el colectivo.
// Si Cloudflare se cae, se bloquea o agota timeouts, el Circuit Breaker entra en juego
// y conmuta automáticamente a Localtunnel sin tirar errores en la cara del usuario.
const { spawn, exec } = require('child_process');
const path = require('path');
const { CircuitBreaker } = require('../resilience/circuit-breaker');

const CMD_BIN = process.platform === 'win32'
  ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe')
  : 'sh';

class TunnelManager {
  constructor() {
    this._process = null;
    this._status = 'stopped'; // 'stopped' | 'starting' | 'active' | 'error'
    this._publicUrl = null;
    this._provider = null; // 'cloudflare' | 'localtunnel'
    this._error = null;
    this._listeners = new Set();
    this.cfBreaker = new CircuitBreaker({
      name: 'CloudflareTunnel',
      failureThreshold: 2,
      resetTimeoutMs: 60000
    });
  }

  getStatus() {
    return {
      active: this._status === 'active',
      status: this._status,
      publicUrl: this._publicUrl,
      provider: this._provider,
      error: this._error,
      circuitBreaker: this.cfBreaker.getState()
    };
  }

  onStatusChange(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify() {
    const status = this.getStatus();
    for (const listener of this._listeners) {
      try {
        listener(status);
      } catch (_) {}
    }
  }

  /**
   * Start a public tunnel to expose local port with circuit-breaker protection
   * @param {number} port
   */
  start(port = 3000) {
    if (this._status === 'active' || this._status === 'starting') {
      return Promise.resolve(this.getStatus());
    }

    this._status = 'starting';
    this._publicUrl = null;
    this._error = null;
    this._notify();

    return new Promise((resolve) => {
      // Si el breaker detectó que Cloudflare viene fallando reiteradamente,
      // no perdemos 30 segundos esperando el timeout: saltamos directo a Localtunnel.
      if (this.cfBreaker.getState().state === 'OPEN') {
        console.warn('[TunnelManager] Cloudflare circuit is OPEN. Bypassing straight to Localtunnel fallback.');
        return this._startLocaltunnelFallback(port, resolve);
      }

      this._startCloudflare(port, resolve);
    });
  }

  _startCloudflare(port, resolve) {
    let resolved = false;
    this._provider = 'cloudflare';

    const cfProc = spawn(CMD_BIN, [
      '/c', 'npx', '-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${port}`
    ], { windowsHide: true });

    this._process = cfProc;

    const handleOutput = (data) => {
      const text = data.toString();
      const matches = text.match(/https:\/\/(?!api\.)[a-zA-Z0-9-]+\.trycloudflare\.com/g);
      if (matches && matches.length > 0 && !this._publicUrl) {
        this._publicUrl = matches[0];
        this._status = 'active';
        this._provider = 'cloudflare';
        this.cfBreaker._onSuccess();
        this._notify();
        if (!resolved) {
          resolved = true;
          resolve(this.getStatus());
        }
      }
    };

    cfProc.stdout.on('data', handleOutput);
    cfProc.stderr.on('data', handleOutput);

    cfProc.on('error', (err) => {
      console.error('[TunnelManager] Cloudflare spawn error:', err.message);
      this.cfBreaker._onFailure(err);
    });

    cfProc.on('close', (code) => {
      if (!this._publicUrl && this._status === 'starting') {
        console.log(`[TunnelManager] Cloudflare exited (code ${code}). Tripping breaker & triggering fallback...`);
        this.cfBreaker._onFailure(new Error(`Exit code ${code}`));
        this._startLocaltunnelFallback(port, resolve);
      } else if (this._status === 'active') {
        this._status = 'stopped';
        this._publicUrl = null;
        this._notify();
      }
    });

    // 30 segundos de gracia: si Cloudflare se cuelga sin escupir URL,
    // forzamos el failover al proveedor secundario.
    setTimeout(() => {
      if (this._status === 'starting' && !resolved) {
        console.warn('[TunnelManager] Cloudflare provisioning timeout. Shifting to Localtunnel...');
        this.cfBreaker._onFailure(new Error('Provisioning timeout'));
        this._startLocaltunnelFallback(port, resolve);
      }
    }, 30000);
  }

  _startLocaltunnelFallback(port, resolve) {
    this._provider = 'localtunnel';
    const ltProc = spawn(CMD_BIN, [
      '/c', 'npx', '-y', 'localtunnel', '--port', String(port), '--local-host', 'localhost'
    ], { windowsHide: true });

    this._process = ltProc;

    const handleLtOutput = (data) => {
      const text = data.toString();
      const matches = text.match(/https:\/\/[a-zA-Z0-9-]+\.loca\.lt/g);
      if (matches && matches.length > 0 && !this._publicUrl) {
        this._publicUrl = matches[0];
        this._status = 'active';
        this._notify();
        resolve(this.getStatus());
      }
    };

    ltProc.stdout.on('data', handleLtOutput);
    ltProc.stderr.on('data', handleLtOutput);

    ltProc.on('close', () => {
      this._status = 'stopped';
      this._publicUrl = null;
      this._notify();
    });
  }

  /**
   * Stop any running tunnel process and kill the full process tree.
   */
  stop() {
    if (this._process) {
      const pid = this._process.pid;
      if (process.platform === 'win32' && pid) {
        // Matamos todo el arbol de procesos (/T) forzado (/F) para no dejar procesos zombis de cmd.exe ni node en el fondo
        exec(`taskkill /pid ${pid} /T /F`, () => {});
      } else {
        try {
          this._process.kill('SIGTERM');
        } catch (_) {}
      }
      this._process = null;
    }

    this._status = 'stopped';
    this._publicUrl = null;
    this._provider = null;
    this._error = null;
    this._notify();
    return this.getStatus();
  }
}

module.exports = { TunnelManager };

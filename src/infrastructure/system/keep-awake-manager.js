// Prevención de suspensión de Windows para no perder sesiones WebSocket.
// Invocamos SetThreadExecutionState con ES_CONTINUOUS | ES_SYSTEM_REQUIRED (0x80000001).
const { KeepAwakePort } = require('./system.port');
const {
  PS_BIN,
  spawnKeepAwakeSubprocess,
  killKeepAwakeSubprocess
} = require('./keep-awake-process');

class KeepAwakeManager extends KeepAwakePort {
  constructor() {
    super();
    this._keepAwakeProcess = null;
    this._isKeepAwakeEnabled = false;
  }

  isKeepAwakeActive() {
    return this._isKeepAwakeEnabled;
  }

  _start() {
    if (this._keepAwakeProcess) return;
    this._keepAwakeProcess = spawnKeepAwakeSubprocess(() => {
      this._keepAwakeProcess = null;
      this._isKeepAwakeEnabled = false;
    });
    this._isKeepAwakeEnabled = true;
  }

  _stop() {
    killKeepAwakeSubprocess(this._keepAwakeProcess);
    this._keepAwakeProcess = null;
    this._isKeepAwakeEnabled = false;
  }

  setKeepAwake(enable) {
    if (process.platform !== 'win32') {
      this._isKeepAwakeEnabled = Boolean(enable);
      return this._isKeepAwakeEnabled;
    }

    if (enable) {
      this._start();
    } else {
      this._stop();
    }
    return this._isKeepAwakeEnabled;
  }
}

module.exports = {
  KeepAwakeManager,
  PS_BIN
};

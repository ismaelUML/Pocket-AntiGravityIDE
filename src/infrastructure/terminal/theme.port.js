// Contratos abstractos de temas y spinners para la terminal.

class TerminalThemePort {
  rgb(_r, _g, _b, _text) {
    throw new Error('TerminalThemePort.rgb: Method not implemented');
  }

  gradient(_text, _startRgb, _endRgb) {
    throw new Error('TerminalThemePort.gradient: Method not implemented');
  }
}

class TerminalSpinnerPort {
  start() {
    throw new Error('TerminalSpinnerPort.start: Method not implemented');
  }

  update(_newText) {
    throw new Error('TerminalSpinnerPort.update: Method not implemented');
  }

  succeed(_msg) {
    throw new Error('TerminalSpinnerPort.succeed: Method not implemented');
  }

  fail(_msg) {
    throw new Error('TerminalSpinnerPort.fail: Method not implemented');
  }

  stop() {
    throw new Error('TerminalSpinnerPort.stop: Method not implemented');
  }
}

module.exports = {
  TerminalThemePort,
  TerminalSpinnerPort
};

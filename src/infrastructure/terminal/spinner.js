// Spinner animado para la terminal en tareas asíncronas.
const { ESC, RESET, BOLD, COLORS, rgb } = require('./terminal-colors');
const { TerminalSpinnerPort } = require('./terminal.port');
const { formatStatus, stopSpinnerTimer } = require('./spinner-frame');

class Spinner extends TerminalSpinnerPort {
  constructor(initialText = 'Loading...') {
    super();
    this.text = initialText;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.index = 0;
    this.timer = null;
    this.isTTY = process.stdout.isTTY;
  }

  start() {
    if (!this.isTTY) {
      console.log(`[*] ${this.text}`);
      return this;
    }

    process.stdout.write(`${ESC}?25l`);

    this.timer = setInterval(() => {
      const frame = rgb(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2], this.frames[this.index]);
      const current = `${frame} ${BOLD}${this.text}${RESET}`;
      process.stdout.write(`\r\x1b[K${current}`);
      this.index = (this.index + 1) % this.frames.length;
    }, 80);

    return this;
  }

  update(newText) {
    this.text = newText;
    if (!this.isTTY) {
      console.log(`[*] ${newText}`);
    }
  }

  succeed(msg) {
    this.stop();
    console.log(formatStatus(COLORS.neonGreen, '✔', msg, this.text));
  }

  fail(msg) {
    this.stop();
    console.log(formatStatus(COLORS.red, '✖', msg, this.text));
  }

  stop() {
    stopSpinnerTimer(this.timer, this.isTTY);
    this.timer = null;
  }
}

module.exports = { Spinner };

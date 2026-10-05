// Formateo de frames ANSI y control de cursor para el spinner.
const { ESC, RESET, BOLD, rgb } = require('./terminal-colors');

function formatStatus(color, symbol, msg, defaultText) {
  const text = msg || defaultText;
  const mark = rgb(color[0], color[1], color[2], symbol);
  return `\r\x1b[K${mark} ${BOLD}${text}${RESET}`;
}

function stopSpinnerTimer(timer, isTTY) {
  if (timer) {
    clearInterval(timer);
  }
  if (isTTY) {
    process.stdout.write(`${ESC}?25h`);
  }
}

module.exports = {
  formatStatus,
  stopSpinnerTimer
};

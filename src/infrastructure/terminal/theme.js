// Fachada del subsistema Terminal UI Theme & Animations.
// Provee degradados neon, marcos de tarjeta, badges y spinners CLI animados.
const {
  ESC,
  RESET,
  BOLD,
  DIM,
  COLORS,
  rgb,
  hex,
  gradient
} = require('./terminal-colors');
const { Spinner } = require('./spinner');

const BANNER_ART = [
  "  █▀█ █▀█ █▀▀ █ █ █▀▀ ▀█▀   ▄▀█ █▄ █ ▀█▀ █ █▀▀ █▀█ █▀█ █ █ █ ▀█▀ █ █",
  "  █▀▀ █▄█ █▄▄ █▀▄ ██▄  █    █▀█ █ ▀█  █  █ █▄█ █▀▄ █▀█ ▀▄▀ █  █  ▀█▀"
];

function getLogoBanner() {
  return BANNER_ART.map(line => gradient(line, COLORS.magenta, COLORS.cyan)).join('\n');
}

function _computeContentWidth(lines, title, padding, minWidth, stripAnsi) {
  let contentWidth = minWidth;
  if (title) {
    contentWidth = Math.max(contentWidth, stripAnsi(title).length + 4);
  }
  for (const l of lines) {
    contentWidth = Math.max(contentWidth, stripAnsi(l).length + (padding * 2));
  }
  return contentWidth;
}

function box(lines, options = {}) {
  const {
    title = '',
    borderColor = COLORS.blurple,
    padding = 2,
    minWidth = 58
  } = options;

  const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*m/g, '');
  const contentWidth = _computeContentWidth(lines, title, padding, minWidth, stripAnsi);
  const border = (char) => rgb(borderColor[0], borderColor[1], borderColor[2], char);

  const topBorder = title
    ? border('╭─ ') + `${BOLD}${title}${RESET}` + border(' ' + '─'.repeat(Math.max(0, contentWidth - stripAnsi(title).length - 3)) + '╮')
    : border('╭' + '─'.repeat(contentWidth) + '╮');

  const bottomBorder = border('╰' + '─'.repeat(contentWidth) + '╯');

  const formattedLines = lines.map(line => {
    const stripped = stripAnsi(line);
    const rightPad = Math.max(0, contentWidth - stripped.length - (padding * 2));
    const padStr = ' '.repeat(padding);
    return border('│') + padStr + line + ' '.repeat(rightPad) + padStr + border('│');
  });

  return [topBorder, ...formattedLines, bottomBorder].join('\n');
}

module.exports = {
  COLORS,
  rgb,
  hex,
  gradient,
  box,
  Spinner,
  getLogoBanner,
  BOLD,
  DIM,
  RESET,
  ESC
};

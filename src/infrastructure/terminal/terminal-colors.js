// Paleta de colores RGB y degradados ANSI para la terminal.
const ESC = '\x1b[';
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;

const COLORS = {
  blurple: [88, 101, 242],
  cyan: [0, 240, 255],
  magenta: [255, 0, 128],
  neonGreen: [0, 255, 136],
  yellow: [255, 204, 0],
  red: [255, 68, 68],
  white: [250, 250, 255],
  gray: [120, 125, 135],
  darkGray: [60, 64, 75]
};

function rgb(r, g, b, text) {
  return `${ESC}38;2;${r};${g};${b}m${text}${RESET}`;
}

function hex(hexStr, text) {
  const num = Number.parseInt(hexStr.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return rgb(r, g, b, text);
}

function gradient(text, startRgb = COLORS.magenta, endRgb = COLORS.cyan) {
  const chars = Array.from(text);
  const len = chars.length || 1;
  return chars.map((ch, i) => {
    const factor = i / (len - 1 || 1);
    const r = Math.round(startRgb[0] + factor * (endRgb[0] - startRgb[0]));
    const g = Math.round(startRgb[1] + factor * (endRgb[1] - startRgb[1]));
    const b = Math.round(startRgb[2] + factor * (endRgb[2] - startRgb[2]));
    return `${ESC}38;2;${r};${g};${b}m${ch}`;
  }).join('') + RESET;
}

module.exports = {
  ESC,
  RESET,
  BOLD,
  DIM,
  COLORS,
  rgb,
  hex,
  gradient
};

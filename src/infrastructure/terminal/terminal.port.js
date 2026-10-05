// Contratos y puertos base para renderizado y presentación en terminal.
// Re-exporta los contratos segregados para mantener compatibilidad total de interfaces.
const { TerminalThemePort, TerminalSpinnerPort } = require('./theme.port');
const {
  TerminalBoxRendererPort,
  TerminalBannerPort,
  TerminalColorPalettePort,
  TerminalProgressBarPort,
  TerminalPromptDialogPort,
  TerminalCardRendererPort,
  TerminalBadgePort,
  TerminalHeaderPort
} = require('./render.port');
const {
  TerminalLayoutPort,
  TerminalAnsiStreamPort,
  TerminalAsciiArtPort,
  TerminalTableRendererPort,
  TerminalNotificationPort
} = require('./stream.port');

module.exports = {
  TerminalThemePort,
  TerminalSpinnerPort,
  TerminalBoxRendererPort,
  TerminalBannerPort,
  TerminalColorPalettePort,
  TerminalProgressBarPort,
  TerminalPromptDialogPort,
  TerminalCardRendererPort,
  TerminalBadgePort,
  TerminalHeaderPort,
  TerminalLayoutPort,
  TerminalAnsiStreamPort,
  TerminalAsciiArtPort,
  TerminalTableRendererPort,
  TerminalNotificationPort
};

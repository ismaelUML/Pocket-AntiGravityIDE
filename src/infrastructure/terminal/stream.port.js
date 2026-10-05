// Contratos abstractos para layouts, streams ANSI, tablas y notificaciones.

class TerminalLayoutPort {
  renderLayout(_components) {
    throw new Error('TerminalLayoutPort.renderLayout: Method not implemented');
  }
}

class TerminalAnsiStreamPort {
  write(_text) {
    throw new Error('TerminalAnsiStreamPort.write: Method not implemented');
  }
}

class TerminalAsciiArtPort {
  getArt(_name) {
    throw new Error('TerminalAsciiArtPort.getArt: Method not implemented');
  }
}

class TerminalTableRendererPort {
  renderTable(_headers, _rows) {
    throw new Error('TerminalTableRendererPort.renderTable: Method not implemented');
  }
}

class TerminalNotificationPort {
  notify(_title, _message) {
    throw new Error('TerminalNotificationPort.notify: Method not implemented');
  }
}

module.exports = {
  TerminalLayoutPort,
  TerminalAnsiStreamPort,
  TerminalAsciiArtPort,
  TerminalTableRendererPort,
  TerminalNotificationPort
};

// Contratos abstractos para renderizado de cajas, banners y diálogos.

class TerminalBoxRendererPort {
  box(_lines, _options) {
    throw new Error('TerminalBoxRendererPort.box: Method not implemented');
  }
}

class TerminalBannerPort {
  getLogoBanner() {
    throw new Error('TerminalBannerPort.getLogoBanner: Method not implemented');
  }
}

class TerminalColorPalettePort {
  getColor(_name) {
    throw new Error('TerminalColorPalettePort.getColor: Method not implemented');
  }
}

class TerminalProgressBarPort {
  render(_percent) {
    throw new Error('TerminalProgressBarPort.render: Method not implemented');
  }
}

class TerminalPromptDialogPort {
  ask(_question) {
    throw new Error('TerminalPromptDialogPort.ask: Method not implemented');
  }
}

class TerminalCardRendererPort {
  renderCard(_title, _content) {
    throw new Error('TerminalCardRendererPort.renderCard: Method not implemented');
  }
}

class TerminalBadgePort {
  renderBadge(_label, _color) {
    throw new Error('TerminalBadgePort.renderBadge: Method not implemented');
  }
}

class TerminalHeaderPort {
  renderHeader(_text) {
    throw new Error('TerminalHeaderPort.renderHeader: Method not implemented');
  }
}

module.exports = {
  TerminalBoxRendererPort,
  TerminalBannerPort,
  TerminalColorPalettePort,
  TerminalProgressBarPort,
  TerminalPromptDialogPort,
  TerminalCardRendererPort,
  TerminalBadgePort,
  TerminalHeaderPort
};

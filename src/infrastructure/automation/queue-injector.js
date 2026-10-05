// Despacho de inyección de texto y medios para la cola de automatización.
const fs = require('fs');
const { injectText } = require('./clipboard-injector');
const { injectMedia } = require('./media-injector');

function cleanupTempUpload(filePath) {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch (_) {}
}

function dispatchInjection(item, signal) {
  const hasMedia = Boolean(item.uploadedImage || item.filePath);
  if (hasMedia) {
    return injectMedia({
      imagePath: item.uploadedImage,
      filePath: item.filePath,
      text: item.text,
      targetTitle: 'Antigravity IDE',
      processName: 'Antigravity IDE',
      focusDelayMs: 600,
      pasteDelayMs: 300,
      submitEnter: true,
      signal
    });
  }

  return injectText({
    text: item.text,
    targetTitle: 'Antigravity IDE',
    processName: 'Antigravity IDE',
    focusDelayMs: 600,
    pasteDelayMs: 300,
    submitEnter: true,
    focusShortcut: item.focusShortcut || 'Auto',
    method: item.method || 'keybd_event',
    newChat: Boolean(item.newChat),
    signal
  });
}

module.exports = { cleanupTempUpload, dispatchInjection };

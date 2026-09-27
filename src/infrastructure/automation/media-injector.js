// Inyector de medios (imágenes y archivos) para el panel de chat de Antigravity.
// Soporta cancelación con AbortSignal para interrumpir la carga y limpiar temporales si el cliente corta.
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const PS_SCRIPT_PATH = path.join(__dirname, 'native', 'media-injector.ps1');

function buildMediaArgs(options) {
  const {
    imagePath = '',
    filePath = '',
    text = '',
    targetTitle = 'Antigravity IDE',
    processName = 'Antigravity IDE',
    focusDelayMs = 500,
    pasteDelayMs = 300,
    submitEnter = true
  } = options;

  const args = [
    '-NoProfile',
    '-WindowStyle', 'Hidden',
    '-ExecutionPolicy', 'Bypass',
    '-File', PS_SCRIPT_PATH,
    '-ImagePath', imagePath,
    '-FilePath', filePath,
    '-Text', text,
    '-TargetTitle', targetTitle,
    '-ProcessName', processName,
    '-FocusDelayMs', String(focusDelayMs),
    '-PasteDelayMs', String(pasteDelayMs)
  ];

  if (!submitEnter) args.push('-SendEnter:$false');
  return args;
}

function parseMediaOutput(stdout, { imagePath, filePath, text }) {
  const trimmed = (stdout || '').trim();
  const match = trimmed.match(/\{.*\}$/s);
  if (!match) return null;

  try {
    const cleanJson = match[0].replace(/[\r\n\t]+/g, ' ');
    const parsed = JSON.parse(cleanJson);
    return {
      success: Boolean(parsed.Success),
      hwnd: parsed.HWND || '0x0',
      pid: parsed.PID || 0,
      title: parsed.Title || '',
      imagePath: parsed.ImagePath || imagePath,
      filePath: parsed.FilePath || filePath,
      text: parsed.Text || text,
      error: parsed.Error || null
    };
  } catch (_) {
    return null;
  }
}

function injectMedia(options = {}) {
  const { imagePath = '', filePath = '', text = '', signal } = options;
  const args = buildMediaArgs(options);

  return new Promise((resolve) => {
    const execOptions = { encoding: 'utf8', windowsHide: true };
    if (signal) execOptions.signal = signal;

    execFile('powershell.exe', args, execOptions, (error, stdout, stderr) => {
      if (error) {
        const isAborted = error.name === 'AbortError' || (signal && signal.aborted);
        return resolve({
          success: false,
          aborted: isAborted,
          hwnd: '0x0',
          pid: 0,
          title: '',
          imagePath,
          filePath,
          text,
          error: isAborted ? 'Media injection aborted by client.' : `Execution error: ${error.message}`
        });
      }

      const parsed = parseMediaOutput(stdout, { imagePath, filePath, text });
      if (parsed) return resolve(parsed);

      resolve({
        success: false,
        hwnd: '0x0',
        pid: 0,
        title: '',
        imagePath,
        filePath,
        text,
        error: `Unexpected output: ${(stdout || stderr).trim()}`
      });
    });
  });
}

module.exports = { injectMedia };

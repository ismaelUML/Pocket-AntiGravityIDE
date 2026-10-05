// Inyector de texto vía Portapapeles y Win32.
// Para no lidiar con ventanas negras ni bugs de foco, mandamos a PowerShell en modo oculto
// y aceptamos señales de aborto (AbortSignal) para cortar el proceso si el socket HTTP se desconecta.
const { execFile } = require('child_process');
const path = require('path');

const PS_SCRIPT_PATH = path.join(__dirname, 'native', 'clipboard-injector.ps1');

function buildArgs(options) {
  const {
    text = '',
    targetTitle = 'Antigravity IDE',
    processName = 'Antigravity IDE',
    focusDelayMs = 400,
    pasteDelayMs = 250,
    submitEnter = true,
    focusShortcut = 'Auto',
    method = 'keybd_event',
    newChat = false
  } = options;

  const args = [
    '-NoProfile',
    '-WindowStyle', 'Hidden',
    '-ExecutionPolicy', 'Bypass',
    '-File', PS_SCRIPT_PATH,
    '-Text', text,
    '-TargetTitle', targetTitle,
    '-ProcessName', processName,
    '-FocusDelayMs', String(focusDelayMs),
    '-PasteDelayMs', String(pasteDelayMs),
    '-FocusShortcut', focusShortcut,
    '-Method', method
  ];

  if (!submitEnter) args.push('-SendEnter:$false');
  if (newChat) args.push('-NewChat');

  return args;
}

const { PS_SYSTEM_BIN, extractJsonBlock } = require('./ps-parser');

const DEFAULT_INJECTOR_RESULT = {
  hwnd: '0x0',
  pid: 0,
  title: '',
  error: null
};

function parseInjectorOutput(stdout, fallbackText) {
  const parsed = extractJsonBlock(stdout);
  if (!parsed) return null;

  return {
    ...DEFAULT_INJECTOR_RESULT,
    ...parsed,
    success: Boolean(parsed.Success),
    textInjected: parsed.TextInjected || fallbackText
  };
}

function injectText(options = {}) {
  const { text = '', signal } = options;
  const args = buildArgs(options);

  return new Promise((resolve) => {
    const execOptions = { encoding: 'utf8', windowsHide: true };
    if (signal) execOptions.signal = signal;

    execFile(PS_SYSTEM_BIN, args, execOptions, (error, stdout, stderr) => {
      if (error) {
        const isAborted = error.name === 'AbortError' || (signal && signal.aborted);
        return resolve({
          success: false,
          aborted: isAborted,
          hwnd: '0x0',
          pid: 0,
          title: '',
          textInjected: text,
          error: isAborted ? 'Operation aborted by client connection termination.' : `Execution error: ${error.message}`
        });
      }

      const parsed = parseInjectorOutput(stdout, text);
      if (parsed) return resolve(parsed);

      resolve({
        success: false,
        hwnd: '0x0',
        pid: 0,
        title: '',
        textInjected: text,
        error: `Unexpected output: ${(stdout || stderr).trim()}`
      });
    });
  });
}

module.exports = { injectText };

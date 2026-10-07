const { execFile } = require('child_process');
const path = require('path');

const { PS_SYSTEM_BIN, extractJsonBlock } = require('./ps-parser');

const PS_SCRIPT_PATH = path.join(__dirname, 'native', 'check-chat-state.ps1');

/**
 * Detects whether Antigravity IDE Chat Panel is FOCUSED, OPENED, or CLOSED.
 * @returns {Promise<{windowFound: boolean, isWindowForeground: boolean, isChatOpen: boolean, isChatFocused: boolean, stateString: string}>}
 */
function getChatState(targetTitle = 'Antigravity IDE', processName = 'Antigravity IDE') {
  return new Promise((resolve) => {
    const args = [
      '-NoProfile',
      '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass',
      '-File', PS_SCRIPT_PATH,
      '-TargetTitle', targetTitle,
      '-ProcessName', processName
    ];

    execFile(PS_SYSTEM_BIN, args, { encoding: 'utf8', timeout: 2500, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        if (stderr) console.error('[checkChatState] PowerShell stderr:', stderr.trim());
        return resolve({
          windowFound: false,
          isWindowForeground: false,
          isChatOpen: false,
          isChatFocused: false,
          stateString: 'CLOSED'
        });
      }

      try {
        const parsed = extractJsonBlock(stdout);
        if (parsed) {
          return resolve({
            windowFound: Boolean(parsed.WindowFound),
            isWindowForeground: Boolean(parsed.IsWindowForeground),
            isChatOpen: Boolean(parsed.IsChatOpen),
            isChatFocused: Boolean(parsed.IsChatFocused),
            stateString: parsed.StateString || 'CLOSED'
          });
        }
      } catch (parseErr) {
        console.error('[checkChatState] JSON Parse error:', parseErr.message, 'Output:', stdout);
      }

      resolve({
        windowFound: false,
        isWindowForeground: false,
        isChatOpen: false,
        isChatFocused: false,
        stateString: 'CLOSED'
      });
    });
  });
}

module.exports = { getChatState };

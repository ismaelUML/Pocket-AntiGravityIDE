// Impresor de banner de terminal y estado del host.
const { getLogoBanner, box, COLORS, rgb, BOLD, RESET, DIM } = require('../infrastructure/terminal/theme');
const { getActiveWorkspaceRoot } = require('../infrastructure/workspace/resolver');

function printServerBanner(port, systemDoctor, config, defaultBrainDir) {
  const root = getActiveWorkspaceRoot();
  const netInfo = systemDoctor.getNetworkInfo(port);
  const pinLabel = config.pin
    ? rgb(COLORS.neonGreen[0], COLORS.neonGreen[1], COLORS.neonGreen[2], 'ENABLED (Protected)')
    : rgb(COLORS.yellow[0], COLORS.yellow[1], COLORS.yellow[2], 'DISABLED');

  console.log('\n' + getLogoBanner() + '\n');
  console.log(box([
    `🚀 ${BOLD}Pocket Antigravity Host Engine${RESET}  ${rgb(COLORS.neonGreen[0], COLORS.neonGreen[1], COLORS.neonGreen[2], '[ONLINE]')}`,
    ``,
    `🎛️  ${BOLD}Control Center:${RESET}    ${rgb(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2], `http://localhost:${port}/dashboard`)}`,
    `📱 ${BOLD}Local Wi-Fi URL:${RESET}   ${rgb(COLORS.blurple[0], COLORS.blurple[1], COLORS.blurple[2], netInfo.primaryUrl)}`,
    `🔒 ${BOLD}Security PIN:${RESET}      ${pinLabel}`,
    `📁 ${BOLD}Workspace:${RESET}         ${DIM}${root}${RESET}`,
    `🧠 ${BOLD}Brain Logs:${RESET}        ${DIM}${defaultBrainDir}${RESET}`
  ], { title: `POCKET ANTIGRAVITY v1.7.0 [PORT ${port}]`, borderColor: COLORS.blurple }) + '\n');
}

module.exports = {
  printServerBanner
};

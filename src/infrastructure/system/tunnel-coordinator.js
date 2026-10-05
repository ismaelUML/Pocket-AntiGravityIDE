// Coordinación de aprovisionamiento de túneles y conmutación Cloudflare -> Localtunnel.
const { runLocaltunnelFallback } = require('./localtunnel-flow');
const { startCloudflareFlow } = require('./cloudflare-flow');

function coordinateTunnelStart(state, port, setProcess) {
  state.resetForStart();

  return new Promise((resolve) => {
    const breakerState = state.cfBreaker.getState().state;
    if (breakerState === 'OPEN') {
      runLocaltunnelFallback(state, port, setProcess, resolve);
      return;
    }
    startCloudflareFlow(state, port, setProcess, resolve);
  });
}

module.exports = {
  coordinateTunnelStart,
  runLocaltunnelFallback
};

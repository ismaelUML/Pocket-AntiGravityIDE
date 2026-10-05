// Flujo de arranque, monitoreo y failover para Cloudflare Tunnel.
const { startCloudflareTunnel } = require('./cloudflare-tunnel');
const { runLocaltunnelFallback } = require('./localtunnel-flow');

function handleClose(state, port, setProcess, resolve, code) {
  if (state.isPendingUrl()) {
    state.cfBreaker.onFailure(new Error(`Exit code ${code}`));
    runLocaltunnelFallback(state, port, setProcess, resolve);
  } else if (state.status === 'active') {
    state.markStopped();
  }
}

function handleTimeout(state, port, setProcess, resolve) {
  if (state.isPendingUrl()) {
    state.cfBreaker.onFailure(new Error('Provisioning timeout'));
    runLocaltunnelFallback(state, port, setProcess, resolve);
  }
}

function startCloudflareFlow(state, port, setProcess, resolve) {
  state.provider = 'cloudflare';
  const proc = startCloudflareTunnel(port, {
    onUrl: (url) => {
      state.markSuccess(url, 'cloudflare');
      resolve(state.getSnapshot());
    },
    onError: (err) => {
      state.cfBreaker.onFailure(err);
    },
    onClose: (code) => {
      handleClose(state, port, setProcess, resolve, code);
    }
  });
  setProcess(proc);
  setTimeout(() => {
    handleTimeout(state, port, setProcess, resolve);
  }, 30000);
}

module.exports = { startCloudflareFlow };

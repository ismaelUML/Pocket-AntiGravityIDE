// Conmutación por fallo hacia el túnel Localtunnel.
const { startLocaltunnel } = require('./localtunnel');

function runLocaltunnelFallback(state, port, setProcess, resolve) {
  state.provider = 'localtunnel';

  const onUrl = (url) => {
    state.markSuccess(url, 'localtunnel');
    resolve(state.getSnapshot());
  };
  const onClose = () => state.markStopped();

  const proc = startLocaltunnel(port, { onUrl, onClose });
  setProcess(proc);
}

module.exports = { runLocaltunnelFallback };

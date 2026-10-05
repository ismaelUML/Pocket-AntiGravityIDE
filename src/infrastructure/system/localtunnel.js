// Invocador específico de fallback Localtunnel cuando Cloudflare entra en circuito abierto.
const { spawnTunnelProcess } = require('./tunnel-runner');

const LT_REGEX = /https:\/\/[a-zA-Z0-9-]+\.loca\.lt/g;

function startLocaltunnel(port, { onUrl, onClose }) {
  const proc = spawnTunnelProcess([
    'npx', '-y', 'localtunnel', '--port', String(port), '--local-host', 'localhost'
  ]);

  let reportedUrl = false;

  const handleLtOutput = (data) => {
    if (reportedUrl) return;
    const text = data.toString();
    const matches = text.match(LT_REGEX);
    if (matches?.length) {
      reportedUrl = true;
      onUrl(matches[0]);
    }
  };

  proc.stdout.on('data', handleLtOutput);
  proc.stderr.on('data', handleLtOutput);

  if (onClose) {
    proc.on('close', (code) => onClose(code));
  }

  return proc;
}

module.exports = {
  startLocaltunnel,
  LT_REGEX
};

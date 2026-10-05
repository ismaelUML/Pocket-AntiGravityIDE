// Invocador específico del túnel Cloudflare Quick Tunnel.
const { spawnTunnelProcess } = require('./tunnel-runner');

const CF_REGEX = /https:\/\/(?!api\.)[a-zA-Z0-9-]+\.trycloudflare\.com/g;

function startCloudflareTunnel(port, { onUrl, onError, onClose }) {
  const proc = spawnTunnelProcess([
    'npx', '-y', 'cloudflared', 'tunnel', '--url', `http://localhost:${port}`
  ]);

  let reportedUrl = false;

  const handleOutput = (data) => {
    if (reportedUrl) return;
    const text = data.toString();
    const matches = text.match(CF_REGEX);
    if (matches?.length) {
      reportedUrl = true;
      onUrl(matches[0]);
    }
  };

  proc.stdout.on('data', handleOutput);
  proc.stderr.on('data', handleOutput);

  if (onError) {
    proc.on('error', (err) => onError(err));
  }

  if (onClose) {
    proc.on('close', (code) => onClose(code, reportedUrl));
  }

  return proc;
}

module.exports = {
  startCloudflareTunnel,
  CF_REGEX
};

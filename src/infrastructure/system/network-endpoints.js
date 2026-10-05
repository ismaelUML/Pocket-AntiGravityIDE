// Extracción de endpoints y filtrado de interfaces virtuales.
const VIRTUAL_KEYWORDS = ['tailscale', 'zerotier', 'vethernet', 'wsl'];
const TYPE_MAP = { true: 'virtual', false: 'lan' };

function isVirtualNetworkInterface(name) {
  const lower = String(name || '').toLowerCase();
  return VIRTUAL_KEYWORDS.some((kw) => lower.includes(kw));
}

function processInterfaceAddress(name, addr, port, isVirtual) {
  if (addr.family !== 'IPv4' || addr.internal) return null;

  return {
    interface: name,
    ip: addr.address,
    url: `http://${addr.address}:${port}`,
    type: TYPE_MAP[Boolean(isVirtual)]
  };
}

function selectPrimaryEndpoint(lanUrls, virtualUrls, port) {
  if (lanUrls?.length) {
    const primaryLan = lanUrls[0];
    return { url: primaryLan.url, ip: primaryLan.ip };
  }
  if (virtualUrls?.length) {
    const primaryVirtual = virtualUrls[0];
    return { url: primaryVirtual.url, ip: primaryVirtual.ip };
  }
  return { url: `http://localhost:${port}`, ip: '127.0.0.1' };
}

module.exports = {
  isVirtualNetworkInterface,
  processInterfaceAddress,
  selectPrimaryEndpoint
};

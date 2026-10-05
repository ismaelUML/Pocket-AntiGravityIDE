// Extracción y diagnóstico de interfaces de red IPv4 y endpoints.
const os = require('os');
const {
  isVirtualNetworkInterface,
  processInterfaceAddress,
  selectPrimaryEndpoint
} = require('./network-endpoints');

function getNetworkInfo(port = 3000) {
  const interfaces = os.networkInterfaces();
  const result = {
    hostname: os.hostname(),
    port,
    primaryUrl: `http://localhost:${port}`,
    lanUrls: [],
    virtualUrls: []
  };

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const isVirtual = isVirtualNetworkInterface(name);
    for (const addr of addrs) {
      const entry = processInterfaceAddress(name, addr, port, isVirtual);
      if (entry) {
        const bucket = isVirtual ? result.virtualUrls : result.lanUrls;
        bucket.push(entry);
      }
    }
  }

  const primary = selectPrimaryEndpoint(result.lanUrls, result.virtualUrls, port);
  result.primaryUrl = primary.url;
  result.primaryIp = primary.ip;
  return result;
}

module.exports = {
  isVirtualNetworkInterface,
  processInterfaceAddress,
  selectPrimaryEndpoint,
  getNetworkInfo
};

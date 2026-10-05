// Restricción quirúrgica de orígenes (CORS y WebSocket Origin Guard).
// Si un servicio escucha en localhost sin validar orígenes, cualquier web maliciosa
// abierta en una pestaña del navegador del usuario (ej. evil.com) puede hacer fetch()
// silenciosos contra http://localhost:3000 y ejecutar código o robar archivos locales.
// Esta guarda sólo autoriza localhost, IPs privadas de la LAN local y el túnel público activo.
const os = require('os');
const { OriginGuardPort } = require('./security.port');

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);
const PRIVATE_IP_REGEX = /^(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[0-1]))\.\d{1,3}\.\d{1,3}$/;

function isLocalOrPrivateIp(hostname) {
  if (!hostname) return false;
  if (LOCAL_HOSTNAMES.has(hostname)) return true;
  return PRIVATE_IP_REGEX.test(hostname);
}

function _isTunnelOrigin(originUrl, tunnelManager) {
  try {
    const pub = tunnelManager?.getStatus?.()?.publicUrl;
    if (!pub) return false;
    return originUrl.origin === new URL(pub).origin;
  } catch (_) {
    return false;
  }
}

function isOriginAllowed(origin, { tunnelManager, activePort } = {}) {
  // Peticiones directas entre servidor o apps nativas a veces no mandan cabecera Origin:
  // en navegación directa o same-origin las dejamos pasar.
  if (!origin) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    // 1. Localhost o red Wi-Fi privada
    if (isLocalOrPrivateIp(hostname)) {
      return true;
    }

    // 2. URL del túnel público activo (Cloudflare o Localtunnel)
    return _isTunnelOrigin(url, tunnelManager);
  } catch (_) {
    return false;
  }
}

function getAllowedOrigins({ tunnelManager, activePort } = {}) {
  const port = activePort || 3000;
  const list = [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
    `https://localhost:${port}`,
    `https://127.0.0.1:${port}`,
    'http://localhost',
    'http://127.0.0.1'
  ];

  try {
    const interfaces = os.networkInterfaces();
    for (const netList of Object.values(interfaces)) {
      if (!netList) continue;
      for (const net of netList) {
        if (net.family === 'IPv4' || net.family === 4) {
          list.push(`http://${net.address}:${port}`);
          list.push(`https://${net.address}:${port}`);
        }
      }
    }
  } catch (_) {}

  if (tunnelManager && typeof tunnelManager.getStatus === 'function') {
    const pub = tunnelManager.getStatus().publicUrl;
    if (pub) list.push(pub);
  }

  return list;
}

/**
 * Middleware para Express con bloqueo estricto de CORS
 */
function createCorsMiddleware({ tunnelManager, activePort } = {}) {
  return (req, res, next) => {
    const rawOrigin = req.headers.origin;

    if (!rawOrigin) {
      return next();
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(rawOrigin);
    } catch (_) {
      return res.status(400).json({ success: false, error: 'Malformed Origin Header' });
    }

    const sanitizedOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const allowedList = getAllowedOrigins({ tunnelManager, activePort });

    if (isOriginAllowed(sanitizedOrigin, { tunnelManager, activePort }) && !allowedList.includes(sanitizedOrigin)) {
      allowedList.push(sanitizedOrigin);
    }

    if (!allowedList.includes(sanitizedOrigin)) {
      const safeLog = sanitizedOrigin.replace(/[\r\n\x00-\x1f\x7f-\x9f]/g, '');
      console.warn(`[Security] Blocked unauthorized cross-origin request from: ${safeLog}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cross-Origin Request Blocked by Surgical Origin Guard.'
      });
    }

    // Permitir sólo al origen explícitamente verificado en la lista de permitidos
    res.setHeader('Access-Control-Allow-Origin', sanitizedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Pocket-Token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  };
}

module.exports = {
  isOriginAllowed,
  isLocalOrPrivateIp,
  createCorsMiddleware
};

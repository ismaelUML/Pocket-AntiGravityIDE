// Restricción quirúrgica de orígenes (CORS y WebSocket Origin Guard).
// Si un servicio escucha en localhost sin validar orígenes, cualquier web maliciosa
// abierta en una pestaña del navegador del usuario (ej. evil.com) puede hacer fetch()
// silenciosos contra http://localhost:3000 y ejecutar código o robar archivos locales.
// Esta guarda sólo autoriza localhost, IPs privadas de la LAN local y el túnel público activo.

function isLocalOrPrivateIp(hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;

  // Rangos IPv4 privados: 10.x.x.x, 172.16.x.x - 172.31.x.x, 192.168.x.x
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;

  return false;
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
    if (tunnelManager && typeof tunnelManager.getStatus === 'function') {
      const currentPublicUrl = tunnelManager.getStatus().publicUrl;
      if (currentPublicUrl) {
        const tunnelUrl = new URL(currentPublicUrl);
        if (url.origin === tunnelUrl.origin) {
          return true;
        }
      }
    }

    return false;
  } catch (_) {
    return false;
  }
}

/**
 * Middleware para Express con bloqueo estricto de CORS
 */
function createCorsMiddleware({ tunnelManager, activePort } = {}) {
  return (req, res, next) => {
    const origin = req.headers.origin;

    if (!origin) {
      return next();
    }

    if (!isOriginAllowed(origin, { tunnelManager, activePort })) {
      console.warn(`[Security] Blocked unauthorized cross-origin request from: ${origin}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cross-Origin Request Blocked by Surgical Origin Guard.'
      });
    }

    // Permitir sólo al origen legítimo verificado
    res.setHeader('Access-Control-Allow-Origin', origin);
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

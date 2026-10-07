// Gestor de Screen Wake-Lock para evitar suspensión de pantalla en móviles.
// Mantiene el WebSocket y la visualización activos durante tareas largas del bot.

let wakeLock = null;
let isRequested = false;

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return false;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    isRequested = true;
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
    return true;
  } catch (_) {
    wakeLock = null;
    return false;
  }
}

export async function releaseWakeLock() {
  isRequested = false;
  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch (_) {}
    wakeLock = null;
  }
}

export function isWakeLockActive() {
  return Boolean(wakeLock);
}

export async function toggleWakeLock() {
  if (wakeLock) {
    await releaseWakeLock();
    return false;
  } else {
    return await requestWakeLock();
  }
}

// Re-adquiere el bloqueo si el usuario cambió de app y volvió
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isRequested && !wakeLock) {
      await requestWakeLock();
    }
  });
}

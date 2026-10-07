// Notificador de audio sintetizado y vibración háptica para Pocket Antigravity.
// Cero dependencias: usa Web Audio API pura para no depender de archivos .mp3 externos.

let audioCtx = null;
let soundEnabled = localStorage.getItem('pocket_sound_enabled') !== 'false';

function getAudioContext() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Sintetiza un ping armónico suave (880Hz La -> 1320Hz Mi).
 */
export function playNotificationChime() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  } catch (_) {
    // Si el navegador bloquea autoplay o no hay soporte de audio, falla en silencio
  }
}

/**
 * Dispara vibración háptica en dispositivos móviles.
 */
export function triggerHapticPulse(pattern = [150, 80, 150]) {
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (_) {}
  }
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('pocket_sound_enabled', String(soundEnabled));
  if (soundEnabled) {
    playNotificationChime();
    triggerHapticPulse([80]);
  }
  return soundEnabled;
}

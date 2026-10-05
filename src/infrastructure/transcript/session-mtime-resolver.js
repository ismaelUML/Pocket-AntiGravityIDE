// Resolutor de marcas de tiempo (mtime) para ordenamiento cronológico de sesiones.
const fs = require('fs');

function resolveSessionMtime(sessionPath, transcriptPath) {
  try {
    const baseMtime = fs.statSync(sessionPath).mtime;
    if (!fs.existsSync(transcriptPath)) return baseMtime;
    const logMtime = fs.statSync(transcriptPath).mtime;
    return logMtime > baseMtime ? logMtime : baseMtime;
  } catch (_) {
    return new Date(0);
  }
}

module.exports = {
  resolveSessionMtime
};

// Notificación defensiva de eventos de broadcast de cambios.

function notifyBroadcast(onChangesBroadcast) {
  if (typeof onChangesBroadcast === 'function') {
    onChangesBroadcast();
  }
}

module.exports = {
  notifyBroadcast
};

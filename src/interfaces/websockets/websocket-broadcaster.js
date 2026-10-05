// Utilidades de transmisión y difusión segura a clientes WebSocket.

function sendIfClientOpen(client, rawPayload) {
  if (client.readyState !== 1) return;
  if (!client.isAuthenticated) return;
  client.send(rawPayload);
}

function broadcastToClients(clients, payload) {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  for (const client of clients) {
    sendIfClientOpen(client, raw);
  }
}

module.exports = {
  sendIfClientOpen,
  broadcastToClients
};

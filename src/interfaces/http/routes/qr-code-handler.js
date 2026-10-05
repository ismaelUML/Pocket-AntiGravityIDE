// Controlador HTTP para renderizado dinámico de código QR en SVG.
const QRCode = require('qrcode');

async function handleQr(req, res) {
  try {
    const text = req.query?.text;
    if (!text) return res.status(400).send('Missing text query parameter');
    const svg = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: { dark: '#ffffff', light: '#00000000' }
    });
    res.type('image/svg+xml').send(svg);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = {
  handleQr
};

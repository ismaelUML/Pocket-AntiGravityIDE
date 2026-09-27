// Rutas HTTP para envío de prompts y consulta de estado del chat.
// Implementa Socket-Level Abort: si la conexión TCP del cliente se cierra prematuramente
// (usuario cerró pestaña, apagó Wi-Fi o canceló), disparamos AbortSignal para interrumpir
// los subprocesos de Windows inmediatamente y no quemar recursos.
const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');

function createPromptRoutes({ sendPromptUseCase, ideAutomationPort, upload }) {
  const router = express.Router();

  router.post('/send', requireAuth, upload.single('image'), async (req, res) => {
    const ac = new AbortController();

    // Detección a nivel de socket: si el socket muere antes de terminar la respuesta, abortamos
    req.on('close', () => {
      if (!res.writableEnded) {
        ac.abort();
      }
    });

    const text = req.body.text || '';
    const filePath = req.body.filePath || '';
    const focusShortcut = req.body.focusShortcut || 'Auto';
    const method = req.body.method || 'keybd_event';
    const personaId = req.body.personaId || 'pair';
    const uploadedImage = req.file ? req.file.path : null;

    const result = await sendPromptUseCase.execute({
      text,
      filePath,
      uploadedImage,
      focusShortcut,
      method,
      personaId,
      newChat: false
    }, { signal: ac.signal });

    if (result.capacityError) {
      return res.status(429).json(result);
    }

    if (result.success) {
      return res.json(result);
    }

    const statusCode = result.aborted ? 499 : 500;
    res.status(statusCode).json(result);
  });

  router.get('/chat-state', requireAuth, async (req, res) => {
    const state = await ideAutomationPort.getChatState();
    res.json(state);
  });

  return router;
}

module.exports = { createPromptRoutes };

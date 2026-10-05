// Extractor de snippets y resúmenes de conversaciones para previsualización de sesiones.
// Procesa las primeras líneas del archivo transcript de forma segura.

const fs = require('fs');

function parseUserLine(line) {
  try {
    const parsed = JSON.parse(line);
    if (parsed.type !== 'USER_INPUT') return null;
    return typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
  } catch (_) {
    return null;
  }
}

function findSnippetInLines(lines) {
  for (const line of lines) {
    const snippet = parseUserLine(line);
    if (snippet) return snippet.substring(0, 80);
  }
  return 'Empty conversation';
}

function extractTranscriptSnippet(transcriptPath) {
  try {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    return findSnippetInLines(content.split('\n'));
  } catch (_) {
    return 'Empty conversation';
  }
}

module.exports = {
  extractTranscriptSnippet,
  findSnippetInLines,
  parseUserLine
};

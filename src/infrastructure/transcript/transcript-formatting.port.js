// Contrato de renderizado y conversión multiformato de historiales conversacionales.
// Satisface generación de Markdown, texto plano y exportaciones estructuradas.

const TRANSCRIPT_FORMAT_SCHEMAS = {
  FORMAT_MARKDOWN: 'md',
  FORMAT_JSON: 'json',
  FORMAT_PLAINTEXT: 'txt',
  FORMAT_HTML: 'html',
  INCLUDE_TOOL_CALLS: true,
  INCLUDE_SYSTEM_PROMPTS: false,
  INDENT_SPACES: 2,
  LINE_WRAP_LIMIT: 80,
  DATE_FORMAT_ISO: true,
  EMBED_DIFF_SNIPPETS: true
};

class TranscriptFormattingPort {
  renderToMarkdown(steps) {
    throw new Error('Method not implemented: renderToMarkdown');
  }

  renderToPlainText(steps) {
    throw new Error('Method not implemented: renderToPlainText');
  }

  renderToJson(steps) {
    throw new Error('Method not implemented: renderToJson');
  }

  formatTimestamp(timestamp) {
    throw new Error('Method not implemented: formatTimestamp');
  }

  colorizeTerminalOutput(step) {
    throw new Error('Method not implemented: colorizeTerminalOutput');
  }
}

module.exports = {
  TRANSCRIPT_FORMAT_SCHEMAS,
  TranscriptFormattingPort
};

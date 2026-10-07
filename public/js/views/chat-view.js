import { authFetch } from '../auth.js';
import { playSubtleAcceptSound } from './diff-view.js';
import { playNotificationChime, triggerHapticPulse } from '../sound-notifier.js';

let activeSessionId = null;
let selectedFile = null;
let selectedPersonaId = localStorage.getItem('pocket_persona_id') || 'pair';
let availablePersonas = [];

const chatContainer = document.getElementById('chat-container');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const sessionSelect = document.getElementById('session-select');
const newChatBtn = document.getElementById('new-chat-btn');
const previewArea = document.getElementById('attachment-preview');
const previewName = document.getElementById('preview-name');
const personaChipsBar = document.getElementById('persona-chips-bar');
const personaBadge = document.getElementById('persona-badge');

// Configure Marked.js options
if (typeof marked !== 'undefined') {
  marked.setOptions({
    gfm: true,
    breaks: true
  });
}

// Global Copy Helper
window.copyCodeSnippet = function (btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  if (!wrapper) return;
  const codeText = wrapper.querySelector('code').innerText;
  navigator.clipboard.writeText(codeText).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#4ec9b0';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = '';
    }, 2000);
  });
};

// Global Toast System
export function showToast(message, type = 'info') {
  const toast = document.getElementById('pocket-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `pocket-toast ${type}`;
  toast.style.display = 'flex';

  void toast.offsetWidth;
  toast.classList.add('show');

  if (window._toastTimeout) clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (!toast.classList.contains('show')) toast.style.display = 'none';
    }, 300);
  }, 3500);
}

// 1-Tap Plan Approval Handler
window.approvePocketPlan = async function () {
  try {
    playSubtleAcceptSound();
  } catch (_) {}

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(20); } catch (_) {}
  }

  showToast('Approving plan... Sending "Proceed" to Antigravity');

  try {
    const res = await authFetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Proceed' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Plan approved! Antigravity is now executing.');
    } else {
      showToast('Error: ' + (data.error || 'Failed to approve plan'), 'error');
    }
  } catch (err) {
    showToast('Failed to send approval: ' + err.message, 'error');
  }
};

export function parseMarkdown(text) {
  if (!text) return '';

  if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
    let html = marked.parse(text);

    html = html.replace(/<pre><code class="(?:language-)?([^"]+)">([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-lang">${lang}</span>
            <button class="copy-btn" onclick="copyCodeSnippet(this)">Copy</button>
          </div>
          <pre><code class="language-${lang}">${code}</code></pre>
        </div>
      `;
    });

    html = html.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-lang">code</span>
            <button class="copy-btn" onclick="copyCodeSnippet(this)">Copy</button>
          </div>
          <pre><code>${code}</code></pre>
        </div>
      `;
    });

    // Intercept file:/// links and artifact markdown links into clickable modal badges
    html = html.replace(/<a\s+href="(file:\/\/\/[^"]+|\S+?\.(?:md|json|js|ts|html|css|py|ps1))"[^>]*>([\s\S]*?)<\/a>/gi, (match, href, label) => {
      const isPlan = href.toLowerCase().includes('plan') || label.toLowerCase().includes('plan');
      const icon = isPlan ? '📋' : '📄';
      const cleanHref = href.replace(/'/g, "\\'");
      return `<button type="button" class="artifact-chip-link ${isPlan ? 'is-plan' : ''}" onclick="window.openPocketArtifact('${cleanHref}')">${icon} <span>${label}</span></button>`;
    });

    return html;
  }

  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const l = lang || 'code';
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-lang">${l}</span>
          <button class="copy-btn" onclick="copyCodeSnippet(this)">Copy</button>
        </div>
        <pre><code class="language-${l}">${code.trim()}</code></pre>
      </div>
    `;
  });

  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  escaped = escaped.replace(/\n/g, '<br/>');

  // Fallback artifact link interceptor
  escaped = escaped.replace(/\[([^\]]+)\]\((file:\/\/\/[^\)]+|\S+?\.(?:md|json|js|ts|html|css|py|ps1))\)/gi, (match, label, href) => {
    const isPlan = href.toLowerCase().includes('plan') || label.toLowerCase().includes('plan');
    const icon = isPlan ? '📋' : '📄';
    const cleanHref = href.replace(/'/g, "\\'");
    return `<button type="button" class="artifact-chip-link ${isPlan ? 'is-plan' : ''}" onclick="window.openPocketArtifact('${cleanHref}')">${icon} <span>${label}</span></button>`;
  });

  return escaped;
}

export function scrollToBottom() {
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

function getToolIcon(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('command')) return '💻';
  if (n.includes('view') || n.includes('read')) return '📄';
  if (n.includes('write') || n.includes('replace') || n.includes('edit')) return '✏️';
  if (n.includes('search') || n.includes('grep')) return '🔍';
  if (n.includes('list') || n.includes('dir')) return '📁';
  return '⚙️';
}

function getToolDetail(tc) {
  if (!tc || !tc.args) return '';
  const args = tc.args;
  if (args.CommandLine) return args.CommandLine;
  if (args.AbsolutePath) return args.AbsolutePath.split(/[\\/]/).pop();
  if (args.TargetFile) return args.TargetFile.split(/[\\/]/).pop();
  if (args.Query || args.query) return `"${args.Query || args.query}"`;
  if (args.DirectoryPath) return args.DirectoryPath.split(/[\\/]/).pop();
  return tc.toolAction || '';
}

export function createToolCallsElement(toolCalls) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return null;
  const container = document.createElement('div');
  container.className = 'tool-calls-container';

  toolCalls.forEach((tc) => {
    const card = document.createElement('div');
    card.className = 'tool-call-card';

    const header = document.createElement('div');
    header.className = 'tool-call-header';

    const icon = getToolIcon(tc.name || '');
    const title = tc.toolSummary || tc.name || 'Tool Execution';
    header.innerHTML = `
      <span class="tool-call-pulse"></span>
      <span class="tool-icon">${icon}</span>
      <span class="tool-title">${title}</span>
    `;
    card.appendChild(header);

    const detail = getToolDetail(tc);
    if (detail) {
      const detailEl = document.createElement('div');
      detailEl.className = 'tool-call-detail';
      detailEl.textContent = detail;
      card.appendChild(detailEl);
    }

    container.appendChild(card);
  });

  return container;
}

export function renderMessage(role, text, toolCalls = []) {
  if (!chatContainer) return;
  const hasText = Boolean(text && String(text).trim());
  const hasTools = Array.isArray(toolCalls) && toolCalls.length > 0;
  if (!hasText && !hasTools) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = role === 'user' ? 'You' : 'Antigravity Assistant';
  msgDiv.appendChild(meta);

  if (hasTools) {
    const toolsEl = createToolCallsElement(toolCalls);
    if (toolsEl) msgDiv.appendChild(toolsEl);
  }

  if (hasText) {
    const body = document.createElement('div');
    body.className = 'message-body';
    body.innerHTML = parseMarkdown(text);
    msgDiv.appendChild(body);
  }

  // If assistant presented an implementation plan or requests review, append 1-tap quick action bar
  if (role === 'assistant' && hasText && /implementation_plan\.md|#\s+Implementation Plan|User Review Required|explicit approval before proceeding|Say 'Proceed'/i.test(text)) {
    const planBar = document.createElement('div');
    planBar.className = 'plan-quick-action-bar';
    planBar.innerHTML = `
      <div class="plan-quick-action-header">
        <span class="plan-quick-badge">📋 Plan Ready</span>
        <span class="plan-quick-title">Antigravity awaits approval to execute</span>
      </div>
      <div class="plan-quick-buttons">
        <button type="button" class="btn-quick-view-plan" onclick="window.openPocketArtifact('implementation_plan.md')">
          <span>👁️ View Plan</span>
        </button>
        <button type="button" class="btn-quick-approve-plan" onclick="window.approvePocketPlan()">
          <span>⚡ Approve & Proceed</span>
        </button>
      </div>
    `;
    msgDiv.appendChild(planBar);
  }

  chatContainer.appendChild(msgDiv);
  scrollToBottom();
}

export function appendMessageFromStep(step) {
  let role = 'assistant';
  if (step.type === 'USER_INPUT' || step.source === 'USER_EXPLICIT') {
    role = 'user';
  }
  let text = typeof step.content === 'string' ? step.content : (step.content ? JSON.stringify(step.content) : '');
  const toolCalls = step.toolCalls || step.tool_calls || [];
  renderMessage(role, text, toolCalls);

  // Alertas al terminar turno
  if (role === 'assistant') {
    const abortBtn = document.getElementById('abort-btn');
    if (abortBtn && step.status === 'DONE') {
      abortBtn.style.display = 'none';
      playNotificationChime();
      triggerHapticPulse([150, 80, 150]);
    }
  }
}

export function getActiveSessionId() {
  return activeSessionId;
}

export function setActiveSessionId(id) {
  activeSessionId = id;
  if (sessionSelect && id && id !== 'NEW_PENDING_SESSION') {
    sessionSelect.value = id;
  }
}

// Assistant Persona Management
export async function loadPersonas() {
  if (!personaChipsBar) return;
  try {
    const res = await authFetch('/api/personas');
    const data = await res.json();
    if (data.personas && Array.isArray(data.personas)) {
      availablePersonas = data.personas;
      renderPersonaChips();
    }
  } catch (err) {
    console.warn('[Personas] Failed to load personas:', err.message);
  }
}

export function renderPersonaChips() {
  if (!personaChipsBar) return;
  personaChipsBar.innerHTML = '';

  availablePersonas.forEach((p) => {
    const chip = document.createElement('button');
    chip.className = `persona-chip ${p.id === selectedPersonaId ? 'active' : ''}`;
    chip.setAttribute('type', 'button');
    chip.setAttribute('title', p.description || p.name);
    chip.innerHTML = `<span>${p.icon || '🤖'}</span> <span>${p.name}</span>`;

    chip.addEventListener('click', () => {
      selectPersona(p.id);
    });

    personaChipsBar.appendChild(chip);
  });

  updatePersonaBadge();
}

export function selectPersona(id) {
  selectedPersonaId = id;
  localStorage.setItem('pocket_persona_id', id);

  if (personaChipsBar) {
    const chips = personaChipsBar.querySelectorAll('.persona-chip');
    chips.forEach((c, idx) => {
      const p = availablePersonas[idx];
      if (p && p.id === id) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  updatePersonaBadge();
  console.log(`[Persona] Switched active persona to: ${id}`);
}

export function updatePersonaBadge() {
  if (!personaBadge) return;
  const current = availablePersonas.find((p) => p.id === selectedPersonaId);
  if (current) {
    personaBadge.innerHTML = `<span>${current.icon || '🤖'}</span> <span>${current.name}</span>`;
  } else {
    personaBadge.textContent = '⚡ Pair Dev';
  }
}

// Load Sessions List
export async function loadSessions(targetId = null) {
  if (targetId) {
    activeSessionId = targetId;
  }
  if (activeSessionId === 'NEW_PENDING_SESSION') return;
  try {
    const res = await authFetch('/api/sessions');
    const data = await res.json();

    if (!sessionSelect) return;
    sessionSelect.innerHTML = '';
    if (data.sessions && data.sessions.length > 0) {
      const selectedId = activeSessionId || data.activeConversationId || data.sessions[0].id;
      data.sessions.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s.id;
        const dateStr = new Date(s.mtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        opt.textContent = `Session ${s.id.substring(0, 8)} (${dateStr})`;
        if (s.id === selectedId) {
          opt.selected = true;
        }
        sessionSelect.appendChild(opt);
      });

      if (!activeSessionId) {
        activeSessionId = selectedId;
        loadMessages(activeSessionId);
      } else {
        sessionSelect.value = activeSessionId;
      }
    } else {
      const opt = document.createElement('option');
      opt.textContent = 'No sessions';
      sessionSelect.appendChild(opt);
    }
  } catch (err) {
    console.error('Error loading sessions:', err);
  }
}

export async function loadMessages(sessionId) {
  if (!sessionId || sessionId === 'NEW_PENDING_SESSION' || !chatContainer) return;
  try {
    const res = await authFetch(`/api/sessions/${sessionId}`);
    const data = await res.json();

    chatContainer.innerHTML = '';
    data.messages.forEach((msg) => {
      renderMessage(msg.role, msg.content, msg.toolCalls || []);
    });
    scrollToBottom();
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

// Remote Stop / Abort Handler (Ctrl + D)
export async function handleAbort() {
  const abortBtn = document.getElementById('abort-btn');
  if (abortBtn) {
    abortBtn.disabled = true;
    abortBtn.innerHTML = '<span>⏳ Aborting...</span>';
  }
  try {
    const res = await authFetch('/api/prompt/abort', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('🛑 Turno abortado (Ctrl+D)', 'info');
      triggerHapticPulse([100, 50, 100]);
    } else {
      showToast(`Aviso: ${data.message || 'Ventana no encontrada'}`, 'warning');
    }
  } catch (err) {
    showToast(`Error al abortar: ${err.message}`, 'error');
  } finally {
    if (abortBtn) {
      abortBtn.disabled = false;
      abortBtn.innerHTML = '<span>🛑 Stop</span>';
      abortBtn.style.display = 'none';
    }
  }
}

// Quick Actions Handler
export function initQuickActions() {
  const bar = document.getElementById('quick-actions-bar');
  if (!bar || !promptInput) return;

  bar.addEventListener('click', (e) => {
    const chip = e.target.closest('.quick-action-chip');
    if (!chip) return;
    const action = chip.getAttribute('data-action');
    if (!action) return;

    if (action === '/plan' || action === '/grill-me') {
      promptInput.value = `${action} ${promptInput.value}`.trim();
      promptInput.focus();
    } else if (action === 'run_tests') {
      promptInput.value = 'Corre todos los tests automatizados del proyecto y reporta si pasa todo.';
      handleSend();
    } else if (action === 'undo_changes') {
      promptInput.value = 'Descarta todos los cambios sin commitear usando git restore.';
      handleSend();
    } else if (action === 'explain') {
      promptInput.value = 'Explicame en 2 oraciones sencillas qué cambios propusiste y por qué.';
      handleSend();
    }
  });
}

// Send Prompt Handler
export async function handleSend() {
  if (!promptInput) return;
  const text = promptInput.value.trim();
  if (!text && !selectedFile) return;

  if (activeSessionId === 'NEW_PENDING_SESSION' && chatContainer) {
    chatContainer.innerHTML = '';
  }

  renderMessage('user', text || '[Attachment]');
  promptInput.value = '';
  promptInput.style.height = '42px';

  const abortBtn = document.getElementById('abort-btn');
  if (abortBtn) abortBtn.style.display = 'inline-flex';

  const formData = new FormData();
  if (text) formData.append('text', text);
  if (selectedFile) formData.append('image', selectedFile);
  formData.append('personaId', selectedPersonaId);
  formData.append('focusShortcut', 'Auto');

  // Clear preview
  selectedFile = null;
  if (previewArea) previewArea.style.display = 'none';

  try {
    const res = await authFetch('/api/send', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) {
      alert(`Send Error: ${data.error}`);
      if (abortBtn) abortBtn.style.display = 'none';
    }
  } catch (err) {
    alert(`Failed to send prompt: ${err.message}`);
    if (abortBtn) abortBtn.style.display = 'none';
  }
}

export function initChatView() {
  if (sendBtn) sendBtn.addEventListener('click', handleSend);

  const abortBtn = document.getElementById('abort-btn');
  if (abortBtn) abortBtn.addEventListener('click', handleAbort);

  initQuickActions();

  if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    promptInput.addEventListener('input', function () {
      this.style.height = '42px';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  if (attachBtn && fileInput) {
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        if (previewName) previewName.textContent = selectedFile.name;
        if (previewArea) previewArea.style.display = 'flex';
      }
    });
  }

  if (sessionSelect) {
    sessionSelect.addEventListener('change', async (e) => {
      const newId = e.target.value;
      activeSessionId = newId;
      await authFetch('/api/sessions/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: newId })
      });
      loadMessages(newId);
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', async () => {
      if (!chatContainer) return;
      chatContainer.innerHTML = '<div class="loading-state">Starting new conversation...</div>';
      try {
        const res = await authFetch('/api/sessions/new', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          activeSessionId = 'NEW_PENDING_SESSION';
          chatContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 36px 16px; margin: auto;">
              <div style="font-size: 1.8rem; margin-bottom: 8px;">✨</div>
              <div style="font-size: 1rem; font-weight: 600; color: var(--text-bright); margin-bottom: 4px;">New Conversation Started</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Send a prompt below to begin chatting with Antigravity.</div>
            </div>
          `;
        } else {
          alert(`Error starting new chat: ${data.error}`);
        }
      } catch (err) {
        alert(`Error starting new chat: ${err.message}`);
      }
    });
  }

  initVoiceDictation();
}

export function initVoiceDictation() {
  const micBtn = document.getElementById('mic-btn');
  const promptInput = document.getElementById('prompt-input');
  if (!micBtn || !promptInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.title = 'Voice dictation not supported in this browser';
    micBtn.style.opacity = '0.5';
    micBtn.addEventListener('click', () => {
      alert('Voice dictation requires Web Speech API (supported on Chrome, Edge, and Safari iOS 14.5+).');
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || 'en-US';

  let isListening = false;
  let basePromptText = '';

  function startListening() {
    try {
      basePromptText = promptInput.value ? promptInput.value.trim() + ' ' : '';
      recognition.start();
      isListening = true;
      micBtn.classList.add('recording');
      micBtn.title = 'Listening... Tap to finish dictation';
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
    }
  }

  function stopListening() {
    try {
      recognition.stop();
    } catch (_) {}
    isListening = false;
    micBtn.classList.remove('recording');
    micBtn.title = 'Voice Dictation (Walkie-Talkie)';
  }

  micBtn.addEventListener('click', () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let accumulatedFinal = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const piece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        accumulatedFinal += piece;
      } else {
        interimTranscript += piece;
      }
    }

    if (accumulatedFinal) {
      basePromptText += accumulatedFinal + ' ';
    }

    promptInput.value = (basePromptText + interimTranscript).trimStart();
    promptInput.style.height = '42px';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
  };

  recognition.onerror = (event) => {
    console.warn('SpeechRecognition error:', event.error);
    if (event.error !== 'no-speech') {
      stopListening();
    }
  };

  recognition.onend = () => {
    if (isListening) {
      stopListening();
    }
  };
}


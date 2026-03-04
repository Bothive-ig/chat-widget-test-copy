/**
 * ============================================================
 *  BotHive AI — Chat Widget
 *  widget.js | Version 2.0.0
 *
 *  Standalone modular JS (non-IIFE).
 *  Load via: <link rel="stylesheet" href="widget.css">
 *            <script src="widget.js"></script>
 *  For embeddable single-file IIFE, see widget.embed.js
 * ============================================================
 */

// ── CONFIGURATION ────────────────────────────────────────────
const WIDGET_CONFIG = {
  WEBHOOK_URL: 'https://mii19.app.n8n.cloud/webhook-test/widgetreply2',
  BOT_NAME: 'Tara',
  BOT_TAGLINE: 'How can I help you today?',
  WELCOME_MSG: "Hi 👋 I'm Tara from BotHive AI. I help businesses launch chat and voice bots that handle leads, bookings, and support. Want to try it out or book a demo?",
  PLACEHOLDER: 'Message...',
  STORAGE_KEY: 'bh_chat_session',
  REQUEST_TIMEOUT_MS: 20000,
};

// ── SESSION MANAGER ──────────────────────────────────────────
const SessionManager = (() => {
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function load() {
    try {
      const raw = localStorage.getItem(WIDGET_CONFIG.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.sessionId) return { sessionId: parsed.sessionId };
      }
    } catch (e) {
      console.warn('[BotHive] Could not read session from localStorage.', e);
    }
    return { sessionId: generateUUID() };
  }

  function save(session) {
    try {
      localStorage.setItem(WIDGET_CONFIG.STORAGE_KEY, JSON.stringify({ sessionId: session.sessionId }));
    } catch (e) {
      console.warn('[BotHive] Could not save session to localStorage.', e);
    }
  }

  function clear() {
    try {
      localStorage.removeItem(WIDGET_CONFIG.STORAGE_KEY);
    } catch (e) { /* ignore */ }
  }

  return { load, save, clear, generateUUID };
})();

// ── UTILS ────────────────────────────────────────────────────
function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function sanitizeInput(input) {
  return String(input).trim().replace(/\s+/g, ' ');
}

// ── API CLIENT ───────────────────────────────────────────────
async function sendMessage(message, sessionId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WIDGET_CONFIG.REQUEST_TIMEOUT_MS);

  const payload = {
    message: sanitizeInput(message),
    sessionId: sessionId,
    timestamp: new Date().toISOString(),
  };

  let response;
  try {
    response = await fetch(WIDGET_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw new Error('Network error. Please check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Server error (${response.status}). Please try again.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Received an unexpected response format.');
  }

  if (typeof data.reply !== 'string' || data.reply.trim() === '') {
    throw new Error('No reply received from the assistant.');
  }

  return data.reply;
}

// ── DOM BUILDER ──────────────────────────────────────────────
function buildDOM() {
  if (!document.getElementById('bh-styles')) {
    const link = document.createElement('link');
    link.id = 'bh-styles';
    link.rel = 'stylesheet';
    link.href = 'widget.css';
    document.head.appendChild(link);
  }

  const root = document.createElement('div');
  root.id = 'bh-chat-root';
  root.innerHTML = `
    <!-- ── Launcher ── -->
    <button id="bh-launcher" aria-label="Open chat" aria-expanded="false">
      <span id="bh-launcher-icon" aria-hidden="true">
        <svg class="bh-icon bh-icon-chat" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <svg class="bh-icon bh-icon-close" viewBox="0 0 24 24" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span id="bh-unread-badge" aria-hidden="true">1</span>
      </span>
      <span id="bh-launcher-content" aria-hidden="true">
        <span id="bh-launcher-title">Chat with ${escapeHTML(WIDGET_CONFIG.BOT_NAME)}</span>
        <span id="bh-launcher-subtitle"></span>
      </span>
      <span id="bh-launcher-dismiss" aria-label="Dismiss" role="button" tabindex="-1">
        <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </span>
    </button>

    <!-- ── Chat Window ── -->
    <div id="bh-chat-window" role="dialog" aria-label="Chat with ${escapeHTML(WIDGET_CONFIG.BOT_NAME)}" aria-hidden="true">

      <!-- Header -->
      <div id="bh-header">
        <div id="bh-header-logo" aria-hidden="true">
          <img src="agent-avatar.png" alt="${escapeHTML(WIDGET_CONFIG.BOT_NAME)}">
        </div>
        <div id="bh-header-name">${escapeHTML(WIDGET_CONFIG.BOT_NAME)}</div>
        <div id="bh-header-actions">
          <button class="bh-header-btn" aria-label="Refresh chat" onclick="SessionManager.clear(); window.location.reload();">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </button>
          <button class="bh-header-btn" aria-label="Close chat" onclick="closeChat()">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages (scrollable — profile area is first item inside) -->
      <div id="bh-messages" role="log" aria-live="polite" aria-label="Conversation">

        <!-- Profile / AssistantInfo (scrolls away as chat grows) -->
        <div id="bh-profile-area">
          <div id="bh-profile-avatar">
            <img src="agent-avatar.png" alt="${escapeHTML(WIDGET_CONFIG.BOT_NAME)}">
          </div>
          <div id="bh-profile-name">${escapeHTML(WIDGET_CONFIG.BOT_NAME)}</div>
          <div id="bh-profile-tagline">${escapeHTML(WIDGET_CONFIG.BOT_TAGLINE)}</div>
        </div>

        <!-- Message content wrapper -->
        <div id="bh-messages-inner">

          <!-- Welcome message + quick reply buttons -->
          <div id="bh-welcome-container">
            <div class="bh-msg-row bh-bot">
              <div class="bh-bubble-wrap">
                <div class="bh-bubble">${escapeHTML(WIDGET_CONFIG.WELCOME_MSG)}</div>
                <div class="bh-msg-meta" aria-hidden="true">
                  <img class="bh-msg-meta-avatar" src="agent-avatar.png" alt="">
                  <span class="bh-msg-meta-name">${escapeHTML(WIDGET_CONFIG.BOT_NAME)}</span>
                  <span class="bh-msg-meta-sep">·</span>
                  <span class="bh-msg-time">Just now</span>
                </div>
              </div>
            </div>
            <div class="bh-action-buttons">
              <button class="bh-action-btn" onclick="document.getElementById('bh-input').value='Get Started';document.getElementById('bh-send-btn').click();">Get Started</button>
              <button class="bh-action-btn" onclick="document.getElementById('bh-input').value='Book a Demo';document.getElementById('bh-send-btn').click();">Book a Demo</button>
              <button class="bh-action-btn" onclick="document.getElementById('bh-input').value='See Pricing';document.getElementById('bh-send-btn').click();">See Pricing</button>
            </div>
          </div>

          <!-- Typing indicator (hidden by default) -->
          <div id="bh-typing-row" aria-label="Assistant is typing">
            <div class="bh-msg-avatar" aria-hidden="true">
              <img src="agent-avatar.png" alt="${escapeHTML(WIDGET_CONFIG.BOT_NAME)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
            </div>
            <div class="bh-typing-bubble" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
          </div>

        </div><!-- /#bh-messages-inner -->
      </div><!-- /#bh-messages -->

      <!-- Footer -->
      <div id="bh-footer">
        <div class="bh-input-wrapper">
          <textarea
            id="bh-input"
            placeholder="${escapeHTML(WIDGET_CONFIG.PLACEHOLDER)}"
            rows="1"
            aria-label="Type a message"
            maxlength="2000"
          ></textarea>
          <button id="bh-send-btn" aria-label="Send message" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
        <div id="bh-branding">
          Powered by <a href="https://itsbothive.com" target="_blank" rel="noopener noreferrer">BotHive</a>
        </div>
      </div>

    </div><!-- /#bh-chat-window -->
  `;

  document.body.appendChild(root);
}

// ── UI HELPERS ───────────────────────────────────────────────
function appendMessage(role, text, date = new Date()) {
  const messagesInner = document.getElementById('bh-messages-inner');
  const typingRow = document.getElementById('bh-typing-row');

  const row = document.createElement('div');
  row.className = `bh-msg-row bh-${role}`;

  if (role === 'bot') {
    row.innerHTML = `
      <div class="bh-bubble-wrap">
        <div class="bh-bubble">${escapeHTML(text)}</div>
        <div class="bh-msg-meta" aria-hidden="true">
          <img class="bh-msg-meta-avatar" src="agent-avatar.png" alt="">
          <span class="bh-msg-meta-name">${escapeHTML(WIDGET_CONFIG.BOT_NAME)}</span>
          <span class="bh-msg-meta-sep">·</span>
          <span class="bh-msg-time">${formatTime(date)}</span>
        </div>
      </div>
    `;
  } else {
    row.innerHTML = `
      <div class="bh-bubble-wrap">
        <div class="bh-bubble">${escapeHTML(text)}</div>
        <div class="bh-msg-time">${formatTime(date)}</div>
      </div>
    `;
  }

  messagesInner.insertBefore(row, typingRow);
  scrollToBottom();
}

function appendSystemMessage(text) {
  const messagesInner = document.getElementById('bh-messages-inner');
  const typingRow = document.getElementById('bh-typing-row');

  const div = document.createElement('div');
  div.className = 'bh-system-msg';
  div.textContent = text;

  messagesInner.insertBefore(div, typingRow);
}

function setTyping(visible) {
  const row = document.getElementById('bh-typing-row');
  row.classList.toggle('bh-visible', visible);
  if (visible) scrollToBottom();
}

function appendError(msg) {
  const messagesInner = document.getElementById('bh-messages-inner');
  const typingRow = document.getElementById('bh-typing-row');

  const div = document.createElement('div');
  div.className = 'bh-error-msg';
  div.textContent = `⚠️  ${msg}`;

  messagesInner.insertBefore(div, typingRow);
  scrollToBottom();
}

function scrollToBottom() {
  const messages = document.getElementById('bh-messages');
  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
  });
}

function setLoading(loading) {
  const btn = document.getElementById('bh-send-btn');
  const input = document.getElementById('bh-input');
  btn.disabled = loading;
  input.disabled = loading;
}

function autoGrowTextarea(el) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

// ── OPEN / CLOSE ─────────────────────────────────────────────
let isOpen = false;

function toggleChat() {
  isOpen ? closeChat() : openChat();
}

function openChat() {
  isOpen = true;
  const win = document.getElementById('bh-chat-window');
  const launcher = document.getElementById('bh-launcher');
  const badge = document.getElementById('bh-unread-badge');

  win.classList.add('bh-visible');
  win.setAttribute('aria-hidden', 'false');
  launcher.classList.add('bh-open');
  launcher.setAttribute('aria-expanded', 'true');

  badge.classList.remove('bh-visible');

  setTimeout(() => document.getElementById('bh-input').focus(), 250);
  scrollToBottom();
}

function closeChat() {
  isOpen = false;
  const win = document.getElementById('bh-chat-window');
  const launcher = document.getElementById('bh-launcher');

  win.classList.remove('bh-visible');
  win.setAttribute('aria-hidden', 'true');
  launcher.classList.remove('bh-open');
  launcher.setAttribute('aria-expanded', 'false');
}

// ── CORE SEND FLOW ───────────────────────────────────────────
async function handleSend() {
  const input = document.getElementById('bh-input');
  const rawText = input.value;
  const text = sanitizeInput(rawText);

  if (!text) return;

  input.value = '';
  autoGrowTextarea(input);
  input.focus();

  const now = new Date();
  appendMessage('user', text, now);

  setLoading(true);
  setTyping(true);

  try {
    const reply = await sendMessage(text, session.sessionId);
    setTyping(false);
    appendMessage('bot', reply, new Date());
  } catch (err) {
    setTyping(false);
    appendError(err.message || 'Something went wrong. Please try again.');
    console.error('[BotHive] Send error:', err);
  } finally {
    setLoading(false);
    validateSendButton();
  }
}

function validateSendButton() {
  const input = document.getElementById('bh-input');
  const btn = document.getElementById('bh-send-btn');
  if (!input.disabled) {
    btn.disabled = sanitizeInput(input.value).length === 0;
  }
}

// ── LAUNCHER SUBTITLE ────────────────────────────────────────
function updateLauncherSubtitle() {
  const el = document.getElementById('bh-launcher-subtitle');
  if (!el) return;
  const now = new Date();
  const day = now.toLocaleDateString([], { weekday: 'long' });
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  el.textContent = `${day}, ${time}`;
}

// ── EVENT BINDING ────────────────────────────────────────────
function bindEvents() {
  const launcher = document.getElementById('bh-launcher');
  const sendBtn = document.getElementById('bh-send-btn');
  const input = document.getElementById('bh-input');

  launcher.addEventListener('click', toggleChat);
  sendBtn.addEventListener('click', handleSend);

  // Dismiss pill → collapse to orange circle
  const dismissBtn = document.getElementById('bh-launcher-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('bh-launcher').classList.add('bh-dismissed');
    });
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  input.addEventListener('input', () => {
    autoGrowTextarea(input);
    validateSendButton();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });
}

// ── INIT ─────────────────────────────────────────────────────
let session;

function initWidget() {
  buildDOM();
  session = SessionManager.load();
  bindEvents();
  updateLauncherSubtitle();
  validateSendButton();
  // Welcome screen always shown on load — history is dashboard-only
}

// ── BOOTSTRAP ────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}

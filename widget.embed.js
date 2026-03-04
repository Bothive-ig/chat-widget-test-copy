/**
 * ============================================================
 *  BotHive AI — Embeddable Chat Widget
 *  widget.embed.js | Version 3.0.0
 *
 *  Single-file IIFE. Drop one <script> tag anywhere.
 *  Usage:
 *    <script src="widget.embed.js" data-bot-id="YOUR_BOT_ID"></script>
 *
 *  Config is loaded automatically from the BotHive API
 *  using the bot ID provided in the data-bot-id attribute.
 * ============================================================
 */
(function () {
  'use strict';

  // ── BOOTSTRAP ─────────────────────────────────────────────
  // Capture currentScript synchronously (not available after async)
  const SCRIPT = document.currentScript;
  const BOT_ID = SCRIPT && SCRIPT.dataset.botId;
  const CONFIG_API = 'https://ufvxiycrokjdegmmgglx.supabase.co/functions/v1/get-widget-config';

  if (!BOT_ID) {
    console.error('[BotHive] Missing data-bot-id on script tag.');
    return;
  }

  fetch(`${CONFIG_API}?id=${encodeURIComponent(BOT_ID)}`)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (config) { initWidget(config); })
    .catch(function (err) {
      console.error('BotHive config load failed', err);
    });

  // ── WIDGET INIT ───────────────────────────────────────────
  function initWidget(apiConfig) {

  // ── CONFIGURATION (mapped from API response) ──────────────
  const cfg = {
    webhookUrl:       apiConfig.webhook_url || '',
    botName:          apiConfig.name || 'Assistant',
    botTagline:       apiConfig.tagline || '',
    welcomeMsg:       apiConfig.welcome_msg || 'Hi! How can I help?',
    placeholder:      apiConfig.placeholder || 'Message...',
    storageKey:       'bh_chat_' + BOT_ID,
    requestTimeoutMs: 20000,
    avatarUrl:        apiConfig.avatar_url || 'agent-avatar.png',
    primaryColor:     apiConfig.primary_color || '#ea580c',
    headerStatus:     apiConfig.header_status || 'Active now',
    quickReplies:     apiConfig.quick_replies || [],
  };

  // ── INLINED CSS ───────────────────────────────────────────
  const CSS = `
    :root{
      --bh-primary:#ea580c;--bh-primary-dark:#c2410c;
      --bh-primary-light:#fff7ed;--bh-primary-lighter:#ffedd5;
      --bh-surface:#ffffff;--bh-surface-2:#fafafa;
      --bh-border:#f0f0f0;--bh-border-strong:#e2e2e2;
      --bh-text-primary:#111827;--bh-text-secondary:#6b7280;--bh-text-tertiary:#9ca3af;
      --bh-error:#ef4444;--bh-error-light:#fef2f2;
      --bh-radius-sm:8px;--bh-radius-md:14px;--bh-radius-lg:18px;--bh-radius-xl:24px;--bh-radius-full:999px;
      --bh-font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    }
    #bh-chat-root *,#bh-chat-root *::before,#bh-chat-root *::after{
      box-sizing:border-box;margin:0;font-family:var(--bh-font);
      -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
    }

    /* ── Launcher ── */
    #bh-launcher{
      position:fixed;bottom:20px;right:20px;z-index:9998;
      height:54px;border-radius:var(--bh-radius-full);
      background:#ffffff;border:none;
      cursor:pointer;display:inline-flex;align-items:center;padding:6px 8px 6px 6px;
      box-shadow:0 2px 8px rgba(0,0,0,0.08),0 8px 32px rgba(0,0,0,0.12);
      transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s ease,background-color 0.2s ease,padding 0.3s ease;
      outline:none;-webkit-tap-highlight-color:transparent;
    }
    #bh-launcher:hover{transform:scale(1.03);box-shadow:0 4px 12px rgba(0,0,0,0.1),0 12px 40px rgba(0,0,0,0.14);}
    #bh-launcher:active{transform:scale(0.97);transition-duration:0.1s;}
    #bh-launcher-icon{
      width:43px;height:43px;border-radius:50%;background:var(--bh-primary);
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;position:relative;transition:background-color 0.2s ease;
    }
    #bh-launcher .bh-icon{
      width:22px;height:22px;fill:none;stroke:#fff;
      stroke-width:2;stroke-linecap:round;stroke-linejoin:round;
      transition:opacity 0.25s ease,transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    #bh-launcher .bh-icon-chat{fill:#fff;stroke:none;opacity:1;transform:scale(1) rotate(0deg);}
    #bh-launcher .bh-icon-close{fill:none;stroke:#fff;position:absolute;opacity:0;transform:scale(0.3) rotate(-90deg);}
    #bh-launcher-content{
      display:flex;flex-direction:column;text-align:left;
      margin:0 8px 0 10px;max-width:200px;overflow:hidden;opacity:1;
      transition:max-width 0.3s cubic-bezier(0.16,1,0.3,1),opacity 0.2s ease,margin 0.25s ease;
    }
    #bh-launcher-title{font-size:13px;font-weight:700;color:var(--bh-primary);white-space:nowrap;letter-spacing:-0.01em;line-height:1.2;}
    #bh-launcher-subtitle{font-size:11px;color:var(--bh-text-secondary);white-space:nowrap;margin-top:3px;line-height:1.2;}
    #bh-launcher-dismiss{
      width:25px;height:25px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      flex-shrink:0;max-width:25px;overflow:hidden;opacity:1;
      transition:max-width 0.3s ease,opacity 0.2s ease,background-color 0.15s ease;
    }
    #bh-launcher-dismiss svg{width:13px;height:13px;stroke:var(--bh-text-tertiary);stroke-width:2.5;stroke-linecap:round;flex-shrink:0;transition:stroke 0.15s ease;}
    #bh-launcher-dismiss:hover{background:rgba(0,0,0,0.07);}
    #bh-launcher-dismiss:hover svg{stroke:var(--bh-text-secondary);}
    #bh-launcher.bh-open{padding:6px;background:#374151;box-shadow:0 2px 8px rgba(0,0,0,0.15),0 8px 32px rgba(0,0,0,0.1);}
    #bh-launcher.bh-dismissed{padding:6px;background:var(--bh-primary);box-shadow:0 2px 8px rgba(234,88,12,0.3),0 8px 32px rgba(234,88,12,0.15);}
    #bh-launcher.bh-dismissed.bh-open{background:#374151;box-shadow:0 2px 8px rgba(0,0,0,0.15),0 8px 32px rgba(0,0,0,0.1);}
    #bh-launcher.bh-open #bh-launcher-content,#bh-launcher.bh-dismissed #bh-launcher-content{max-width:0;opacity:0;margin-left:0;margin-right:0;}
    #bh-launcher.bh-open #bh-launcher-dismiss,#bh-launcher.bh-dismissed #bh-launcher-dismiss{max-width:0;opacity:0;}
    #bh-launcher.bh-open #bh-launcher-icon,#bh-launcher.bh-dismissed #bh-launcher-icon{background:transparent;}
    #bh-launcher.bh-open .bh-icon-chat{opacity:0;transform:scale(0.3) rotate(90deg);}
    #bh-launcher.bh-open .bh-icon-close{opacity:1;transform:scale(1) rotate(0deg);}
    #bh-unread-badge{
      position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;
      border-radius:var(--bh-radius-full);
      background:#ef4444;color:#fff;font-size:11px;font-weight:700;
      display:flex;align-items:center;justify-content:center;
      border:2.5px solid #fff;padding:0 4px;
      opacity:0;transform:scale(0);
      transition:opacity 0.2s ease,transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events:none;
    }
    #bh-unread-badge.bh-visible{opacity:1;transform:scale(1);}

    /* ── Chat window ── */
    #bh-chat-window{
      position:fixed;bottom:92px;right:20px;z-index:9999;
      width:400px;height:640px;max-height:calc(100vh - 108px);
      background:var(--bh-surface);border-radius:var(--bh-radius-xl);
      box-shadow:0 0 0 1px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.05),0 12px 28px rgba(0,0,0,0.08),0 32px 64px rgba(0,0,0,0.14);
      display:flex;flex-direction:column;overflow:hidden;
      opacity:0;transform:translateY(12px) scale(0.96);transform-origin:bottom right;
      pointer-events:none;transition:opacity 0.25s ease,transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    #bh-chat-window.bh-visible{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}
    #bh-chat-window ::-webkit-scrollbar{width:6px;}
    #bh-chat-window ::-webkit-scrollbar-track{background:transparent;}
    #bh-chat-window ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.12);border-radius:var(--bh-radius-full);}
    #bh-chat-window ::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,0.28);}

    /* ── Header ── */
    #bh-header{
      flex-shrink:0;background:#ffffff;
      height:64px;padding:0 12px;
      display:flex;align-items:center;gap:0;
      border-bottom:1px solid #f0f0f0;
    }
    #bh-header-back{
      width:36px;height:36px;border-radius:8px;
      background:transparent;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      transition:background-color 0.15s ease;
    }
    #bh-header-back svg{width:20px;height:20px;stroke:#6b7280;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:stroke 0.15s ease;}
    #bh-header-back:hover{background:#f3f4f6;}
    #bh-header-back:hover svg{stroke:#374151;}
    #bh-header-logo{
      width:36px;height:36px;border-radius:50%;overflow:hidden;
      flex-shrink:0;margin:0 10px;background:#f3f4f6;
    }
    #bh-header-logo img{width:100%;height:100%;object-fit:cover;}
    #bh-header-info{flex:1;display:flex;flex-direction:column;min-width:0;}
    #bh-header-name{
      font-size:15px;font-weight:700;color:#111827;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-0.01em;
    }
    #bh-header-status{
      font-size:12px;color:#6b7280;display:flex;align-items:center;gap:5px;margin-top:2px;
    }
    #bh-header-status::before{
      content:'';width:7px;height:7px;border-radius:50%;
      background:#22c55e;display:inline-block;flex-shrink:0;
    }
    #bh-header-actions{display:flex;gap:4px;align-items:center;margin-left:8px;}
    .bh-header-btn{
      background:transparent;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      width:34px;height:34px;border-radius:8px;padding:0;
      transition:background-color 0.15s ease;flex-shrink:0;
    }
    .bh-header-btn svg{width:17px;height:17px;stroke:#9ca3af;transition:stroke 0.15s ease;}
    .bh-header-btn:hover{background:#f3f4f6;}
    .bh-header-btn:hover svg{stroke:#374151;}


    /* ── Messages ── */
    #bh-messages{flex:1;overflow-y:auto;display:flex;flex-direction:column;scroll-behavior:smooth;background:#ffffff;position:relative;}
    #bh-messages-inner{padding:20px 20px 16px;display:flex;flex-direction:column;flex:1;}

    /* ── Quick replies ── */
    .bh-action-buttons{display:flex;flex-wrap:wrap;gap:6px;padding:4px 16px 12px 16px;}
    .bh-action-btn{
      background:rgba(234,88,12,0.06);border:1px solid rgba(234,88,12,0.15);color:var(--bh-primary);
      padding:7px 14px;border-radius:var(--bh-radius-full);font-size:12.5px;font-weight:500;
      cursor:pointer;transition:background 0.18s ease,color 0.18s ease,transform 0.15s ease,box-shadow 0.15s ease,border-color 0.18s ease;
      white-space:nowrap;letter-spacing:-0.005em;line-height:1.3;
    }
    .bh-action-btn:hover{
      background:var(--bh-primary);color:#fff;border-color:var(--bh-primary);transform:translateY(-1px);
      box-shadow:0 3px 10px rgba(234,88,12,0.25);
    }
    .bh-action-btn:active{transform:translateY(0) scale(0.97);box-shadow:inset 0 2px 6px rgba(0,0,0,0.12);}
    .bh-action-btn:focus-visible{outline:2px solid var(--bh-primary);outline-offset:2px;}

    /* ── Message rows ── */
    .bh-msg-row{display:flex;gap:0;margin-bottom:16px;animation:bh-msg-in 0.25s cubic-bezier(0.16,1,0.3,1) both;}
    .bh-msg-row.bh-user{justify-content:flex-end;}
    .bh-msg-avatar{width:28px;height:28px;border-radius:50%;overflow:hidden;flex-shrink:0;align-self:flex-end;margin-right:8px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;}
    .bh-msg-avatar img{width:100%;height:100%;object-fit:cover;}
    .bh-msg-row.bh-user .bh-msg-avatar{display:none;}
    .bh-bubble-wrap{display:flex;flex-direction:column;max-width:80%;min-width:0;align-self:flex-start;align-items:flex-start;}
    .bh-msg-row.bh-user .bh-bubble-wrap{align-self:flex-end;align-items:flex-end;}
    .bh-bubble{
      padding:16px 20px;border-radius:20px;font-size:14px;line-height:1.5;
      color:#111827;background:#f3f4f6;
      word-break:break-word;word-wrap:break-word;overflow-wrap:anywhere;
      box-shadow:0 2px 8px rgba(0,0,0,0.06);letter-spacing:-0.006em;
    }
    .bh-msg-row.bh-bot .bh-bubble{border-bottom-left-radius:6px;}
    .bh-msg-row.bh-user .bh-bubble{
      background:var(--bh-primary);color:#FFFFFF;padding:10px 16px;
      box-shadow:0 1px 3px rgba(255,122,26,0.2);
    }
    .bh-msg-time{
      font-size:10px;color:var(--bh-text-tertiary);margin-top:5px;padding:0 4px;
      opacity:0.5;transition:opacity 0.15s ease;line-height:1;
    }
    .bh-msg-row:hover .bh-msg-time{opacity:0.85;}
    .bh-msg-meta{display:flex;align-items:center;gap:5px;margin-top:6px;padding:0 2px;}
    .bh-msg-meta-avatar{width:16px;height:16px;border-radius:50%;object-fit:cover;flex-shrink:0;opacity:0.85;}
    .bh-msg-meta-name{font-size:11px;color:var(--bh-text-tertiary);font-weight:500;}
    .bh-msg-meta-sep{font-size:11px;color:var(--bh-text-tertiary);opacity:0.6;}
    .bh-msg-meta .bh-msg-time{opacity:1;margin-top:0;padding:0;font-size:11px;}

    /* ── Typing indicator ── */
    #bh-typing-row{display:none;align-items:flex-end;gap:8px;animation:bh-msg-in 0.3s ease both;}
    #bh-typing-row.bh-visible{display:flex;}
    .bh-typing-bubble{
      background:#f3f4f6;border-radius:var(--bh-radius-lg);border-bottom-left-radius:4px;
      padding:12px 16px;display:flex;gap:4px;align-items:center;
      box-shadow:0 1px 3px rgba(0,0,0,0.06);
    }
    .bh-typing-bubble span{
      width:7px;height:7px;border-radius:50%;background:var(--bh-text-tertiary);display:inline-block;
      animation:bh-typing-dot 1.4s ease-in-out infinite;
    }
    .bh-typing-bubble span:nth-child(2){animation-delay:0.2s;}
    .bh-typing-bubble span:nth-child(3){animation-delay:0.4s;}

    /* ── Error / System ── */
    .bh-error-msg{
      font-size:13px;color:var(--bh-error);background:var(--bh-error-light);
      border:1px solid #fecaca;border-radius:var(--bh-radius-sm);
      padding:8px 12px;text-align:center;animation:bh-msg-in 0.2s ease both;
    }
    .bh-system-msg{
      text-align:center;font-size:11px;color:var(--bh-text-tertiary);
      display:flex;align-items:center;gap:10px;padding:4px 0;
    }
    .bh-system-msg::before,.bh-system-msg::after{content:'';flex:1;height:1px;background:var(--bh-border);}

    /* ── Footer ── */
    #bh-footer{
      flex-shrink:0;background:var(--bh-surface);border-top:1px solid var(--bh-border);
      padding:12px 12px 0;display:flex;flex-direction:column;
    }
    .bh-input-wrapper{
      display:flex;align-items:flex-end;gap:4px;
      border:1px solid var(--bh-border-strong);border-radius:var(--bh-radius-full);
      padding:6px 6px 6px 8px;background:var(--bh-surface);
      transition:border-color 0.2s ease,box-shadow 0.2s ease;
    }
    .bh-input-icons-left{display:flex;align-items:center;gap:0;flex-shrink:0;}
    .bh-input-icon-btn{
      width:32px;height:32px;border-radius:50%;background:transparent;border:none;
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition:background 0.15s ease;flex-shrink:0;
    }
    .bh-input-icon-btn:hover{background:#f3f4f6;}
    .bh-input-icon-btn svg{width:17px;height:17px;stroke:#9ca3af;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    .bh-input-wrapper:focus-within{border-color:var(--bh-primary);box-shadow:0 0 0 3px rgba(234,88,12,0.1);}
    #bh-input{
      flex:1;resize:none;border:none;padding:7px 0;font-size:14px;line-height:1.5;
      color:var(--bh-text-primary);background:transparent;outline:none;
      min-height:40px;max-height:100px;overflow-y:auto;font-family:var(--bh-font);
      letter-spacing:-0.006em;
    }
    #bh-input::placeholder{color:var(--bh-text-tertiary);}
    #bh-input::-webkit-scrollbar{width:0;}
    #bh-send-btn{
      width:36px;height:36px;border-radius:50%;background:var(--bh-surface-2);border:none;
      cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;
      transition:all 0.2s ease;outline:none;-webkit-tap-highlight-color:transparent;
      align-self:flex-end;margin-bottom:0;
    }
    #bh-send-btn:not(:disabled){background:var(--bh-primary);}
    #bh-send-btn:not(:disabled) svg{stroke:#fff;}
    #bh-send-btn:hover:not(:disabled){background:var(--bh-primary-dark);transform:scale(1.05);}
    #bh-send-btn:active:not(:disabled){transform:scale(0.95);}
    #bh-send-btn:disabled{opacity:0.4;cursor:default;}
    #bh-send-btn svg{width:18px;height:18px;transition:stroke 0.15s ease;}
    #bh-branding{
      text-align:center;font-size:11px;color:var(--bh-text-tertiary);
      padding:8px 0;background:var(--bh-surface);
    }
    #bh-branding a{color:var(--bh-text-secondary);text-decoration:none;font-weight:600;transition:color 0.15s ease;}
    #bh-branding a:hover{color:var(--bh-primary);text-decoration:underline;}
    #bh-branding a:focus-visible{outline:2px solid var(--bh-primary);outline-offset:2px;border-radius:2px;}

    /* ── Scroll-to-bottom button ── */
    #bh-scroll-btn{
      position:absolute;bottom:16px;right:16px;
      width:32px;height:32px;border-radius:50%;
      background:#374151;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
      opacity:0;transform:translateY(8px) scale(0.9);
      transition:opacity 0.2s ease,transform 0.2s ease;
      pointer-events:none;z-index:10;
    }
    #bh-scroll-btn.bh-visible{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}
    #bh-scroll-btn svg{stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}

    /* ── Animations ── */
    @keyframes bh-typing-dot{0%,44%,100%{transform:translateY(0);opacity:0.5;}22%{transform:translateY(-7px);opacity:1;}}
    @keyframes bh-msg-in{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
    @keyframes bh-fade-in{from{opacity:0;}to{opacity:1;}}

    /* ── Mobile ── */
    @media(max-width:480px){
      #bh-chat-window{bottom:0;right:0;left:0;top:0;width:100%;max-width:100%;height:100%;max-height:100%;border-radius:0;}
      #bh-launcher{bottom:16px;right:16px;}
    }
  `;

  // ── UTILS ────────────────────────────────────────────────
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

  // ── SESSION MANAGER ──────────────────────────────────────
  const SessionManager = (() => {
    function generateUUID() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    }
    function load() {
      try {
        const raw = localStorage.getItem(cfg.storageKey);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && p.sessionId) return { sessionId: p.sessionId };
        }
      } catch (e) { /* ignore */ }
      return { sessionId: generateUUID() };
    }
    function save(s) {
      try { localStorage.setItem(cfg.storageKey, JSON.stringify({ sessionId: s.sessionId })); } catch (e) { /* ignore */ }
    }
    function clear() {
      try { localStorage.removeItem(cfg.storageKey); } catch (e) { /* ignore */ }
    }
    return { load, save, clear };
  })();

  // ── API CLIENT ───────────────────────────────────────────
  async function sendMessage(message, sessionId) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.requestTimeoutMs);

    let response;
    try {
      response = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sanitizeInput(message),
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
      throw new Error('Network error. Please check your connection.');
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) throw new Error(`Server error (${response.status}). Please try again.`);

    let data;
    try { data = await response.json(); } catch { throw new Error('Unexpected response format.'); }

    if (typeof data.reply !== 'string' || !data.reply.trim()) {
      throw new Error('No reply received from the assistant.');
    }
    return data.reply;
  }

  // ── DOM BUILDER ──────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('bh-widget-css')) return;
    const style = document.createElement('style');
    style.id = 'bh-widget-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildDOM() {
    if (document.getElementById('bh-chat-root')) return;

    const quickBtnsHtml = cfg.quickReplies.map(btn =>
      `<button class="bh-action-btn" onclick="window.__bhSendQuick(${JSON.stringify(btn.message)})">${escapeHTML(btn.label)}</button>`
    ).join('');

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
          <span id="bh-launcher-title">Chat with ${escapeHTML(cfg.botName)}</span>
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
      <div id="bh-chat-window" role="dialog" aria-label="Chat with ${escapeHTML(cfg.botName)}" aria-hidden="true">

        <!-- Header -->
        <div id="bh-header">
          <button id="bh-header-back" aria-label="Close chat" onclick="const e=new MouseEvent('click',{bubbles:true});document.getElementById('bh-launcher').dispatchEvent(e);">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div id="bh-header-logo" aria-hidden="true">
            <img src="${cfg.avatarUrl}" alt="${escapeHTML(cfg.botName)}">
          </div>
          <div id="bh-header-info">
            <div id="bh-header-name">${escapeHTML(cfg.botName)}</div>
            <div id="bh-header-status">${escapeHTML(cfg.headerStatus)}</div>
          </div>
          <div id="bh-header-actions">
            <button class="bh-header-btn" aria-label="Options">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="5" r="1" fill="#9ca3af" stroke="#9ca3af"></circle>
                <circle cx="12" cy="12" r="1" fill="#9ca3af" stroke="#9ca3af"></circle>
                <circle cx="12" cy="19" r="1" fill="#9ca3af" stroke="#9ca3af"></circle>
              </svg>
            </button>
            <button class="bh-header-btn" aria-label="Close chat" onclick="const e=new MouseEvent('click',{bubbles:true});document.getElementById('bh-launcher').dispatchEvent(e);">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages (scrollable — profile area is first item inside) -->
        <div id="bh-messages" role="log" aria-live="polite" aria-label="Conversation">

          <!-- Message content wrapper -->
          <div id="bh-messages-inner">

            <!-- Welcome message + quick reply buttons -->
            <div id="bh-welcome-container">
              <div class="bh-msg-row bh-bot">
                <div class="bh-msg-avatar" aria-hidden="true">
                  <img src="${cfg.avatarUrl}" alt="">
                </div>
                <div class="bh-bubble-wrap">
                  <div class="bh-bubble">${escapeHTML(cfg.welcomeMsg)}</div>
                  <div class="bh-msg-meta" aria-hidden="true">
                    <span class="bh-msg-meta-name">${escapeHTML(cfg.botName)}</span>
                    <span class="bh-msg-meta-sep">·</span>
                    <span class="bh-msg-time">Just now</span>
                  </div>
                </div>
              </div>
              <div class="bh-action-buttons">${quickBtnsHtml}</div>
            </div>

            <!-- Typing indicator -->
            <div id="bh-typing-row" aria-label="Assistant is typing">
              <div class="bh-msg-avatar" aria-hidden="true">
                <img src="${cfg.avatarUrl}" alt="${escapeHTML(cfg.botName)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
              </div>
              <div class="bh-typing-bubble" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
            </div>

          </div><!-- /#bh-messages-inner -->

          <!-- Scroll-to-bottom button -->
          <button id="bh-scroll-btn" aria-label="Scroll to latest message">
            <svg viewBox="0 0 24 24" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </button>

        </div><!-- /#bh-messages -->

        <!-- Footer -->
        <div id="bh-footer">
          <div class="bh-input-wrapper">
            <div class="bh-input-icons-left" aria-hidden="true">
              <button class="bh-input-icon-btn" aria-label="Attach file" tabindex="-1">
                <svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <button class="bh-input-icon-btn" aria-label="Emoji" tabindex="-1">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
              </button>
              <button class="bh-input-icon-btn" aria-label="More options" tabindex="-1">
                <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </button>
            </div>
            <textarea
              id="bh-input"
              placeholder="${escapeHTML(cfg.placeholder)}"
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

  // ── UI HELPERS ───────────────────────────────────────────
  function appendMessage(role, text, date) {
    date = date || new Date();
    const messagesInner = document.getElementById('bh-messages-inner');
    const typingRow = document.getElementById('bh-typing-row');

    const row = document.createElement('div');
    row.className = `bh-msg-row bh-${role}`;

    if (role === 'bot') {
      row.innerHTML = `
        <div class="bh-msg-avatar" aria-hidden="true"><img src="${cfg.avatarUrl}" alt=""></div>
        <div class="bh-bubble-wrap">
          <div class="bh-bubble">${escapeHTML(text)}</div>
          <div class="bh-msg-meta" aria-hidden="true">
            <span class="bh-msg-meta-name">${escapeHTML(cfg.botName)}</span>
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
    div.textContent = '\u26a0\ufe0f  ' + msg;
    messagesInner.insertBefore(div, typingRow);
    scrollToBottom();
  }

  function scrollToBottom() {
    const messages = document.getElementById('bh-messages');
    requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
  }

  function setLoading(loading) {
    const btn = document.getElementById('bh-send-btn');
    const input = document.getElementById('bh-input');
    btn.disabled = loading;
    input.disabled = loading;
  }

  function autoGrowTextarea(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function validateSendButton() {
    const input = document.getElementById('bh-input');
    const btn = document.getElementById('bh-send-btn');
    if (!input.disabled) btn.disabled = sanitizeInput(input.value).length === 0;
  }

  // ── OPEN / CLOSE ─────────────────────────────────────────
  let isOpen = false;

  function toggleChat() { isOpen ? closeChat() : openChat(); }

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

  // ── CORE SEND FLOW ───────────────────────────────────────
  let session;

  async function sendQuickReply(text) {
    text = sanitizeInput(text);
    if (!text) return;

    appendMessage('user', text, new Date());
    setLoading(true);
    setTyping(true);

    try {
      const reply = await sendMessage(text, session.sessionId);
      setTyping(false);
      appendMessage('bot', reply, new Date());
    } catch (err) {
      setTyping(false);
      appendError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      validateSendButton();
    }
  }

  // Expose for inline onclick handlers
  window.__bhSendQuick = sendQuickReply;

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
    } finally {
      setLoading(false);
      validateSendButton();
    }
  }

  // ── LAUNCHER SUBTITLE ────────────────────────────────────
  function updateLauncherSubtitle() {
    const el = document.getElementById('bh-launcher-subtitle');
    if (!el) return;
    const now = new Date();
    const day = now.toLocaleDateString([], { weekday: 'long' });
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    el.textContent = day + ', ' + time;
  }

  // ── EVENT BINDING ────────────────────────────────────────
  function bindEvents() {
    document.getElementById('bh-launcher').addEventListener('click', toggleChat);
    document.getElementById('bh-send-btn').addEventListener('click', handleSend);

    // Dismiss pill → collapse to orange circle
    const dismissBtn = document.getElementById('bh-launcher-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('bh-launcher').classList.add('bh-dismissed');
      });
    }

    const input = document.getElementById('bh-input');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    input.addEventListener('input', () => {
      autoGrowTextarea(input);
      validateSendButton();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    const messages = document.getElementById('bh-messages');
    const scrollBtn = document.getElementById('bh-scroll-btn');
    messages.addEventListener('scroll', () => {
      const nearBottom = messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80;
      scrollBtn.classList.toggle('bh-visible', !nearBottom);
    });
    scrollBtn.addEventListener('click', () => scrollToBottom());
  }

  // ── INIT ─────────────────────────────────────────────────
  function injectColorOverride() {
    const style = document.createElement('style');
    style.textContent = '#bh-chat-root{--bh-primary:' + cfg.primaryColor + ';}';
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    buildDOM();
    injectColorOverride();
    session = SessionManager.load();
    bindEvents();
    updateLauncherSubtitle();
    validateSendButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  } // end initWidget

})();

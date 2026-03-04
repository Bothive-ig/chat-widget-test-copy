# BotHive AI — Chat Widget Project Guide

## Project Overview

Embeddable chat widget for BotHive AI. Single `<script>` tag deployment. Communicates exclusively with an n8n webhook — no direct Supabase access from the frontend.

## Design Philosophy

The widget must feel premium, minimal, and globally competitive. No cramped layouts. No heavy UI. Every pixel matters — generous padding, smooth animations, and Intercom-level polish. When in doubt, choose the cleaner, more spacious option.

## Performance Rule

`widget.embed.js` must remain a lightweight single-file embed. No external dependencies — zero. No heavy libraries (no React, no jQuery, no CSS frameworks). Pure vanilla JS + inlined CSS. The embed should stay under 30 KB minified. Embeddable widgets die when they get bloated.

## Security Note

No secrets in frontend code — ever. The webhook URL is intentionally public-facing; it's designed to receive messages from any browser. Rate limiting, authentication, and abuse prevention are handled server-side in n8n, not in the widget. Never store API keys, tokens, or credentials in widget.embed.js or widget.js.

## File Structure

```
widget.embed.js    — IIFE single-file embed (CSS inlined as string). This is the PRIMARY file.
widget.css         — External stylesheet (must stay in sync with widget.embed.js CSS string)
widget.js          — Modular JS version (must stay in sync with widget.embed.js logic)
index-4.html       — Test/demo page, loads widget.embed.js via <script> tag
agent-avatar.png   — Bot avatar image used in header, profile area, and message meta
```

## Critical Rule: Dual-File Sync

**Every CSS change must be applied to BOTH files:**
1. `widget.css` — formatted, readable version
2. `widget.embed.js` — minified CSS string inside the `const CSS` template literal (line ~35)

**Every JS logic change must be applied to BOTH files:**
1. `widget.embed.js` — primary IIFE
2. `widget.js` — modular version (mirrors the same logic)

Forgetting to sync is the #1 source of bugs.

## Architecture

```
Widget loads
  → read sessionId from localStorage (generate UUID if missing)
  → ALWAYS show welcome screen (intentional — fresh start every page load)
  → sessionId persists so n8n can correlate messages server-side

User sends message
  → POST to n8n webhook: { message, sessionId, timestamp }
  → n8n handles Supabase storage (invisible to widget)
  → n8n returns { reply }
  → widget appends reply to UI

Page reload
  → welcome screen again (no history restore — by design)
  → sessionId still in localStorage for n8n correlation
```

**Frontend NEVER touches Supabase.** Supabase is backend-only (analytics + dashboard for business owners).

## Widget Configuration

Set `window.BotHiveConfig` before the script tag:
```javascript
window.BotHiveConfig = {
  webhookUrl: 'https://mii19.app.n8n.cloud/webhook-test/widgetreply2',
  botName:    'Tara',
  botTagline: 'How can I help you today?',
  welcomeMsg: 'Hi! ...',
  placeholder: 'Message...',
  storageKey: 'bh_chat_session',
  requestTimeoutMs: 20000,
};
```

## Session Management

- `SessionManager.load()` — returns `{ sessionId }` only (no history array)
- `SessionManager.save(s)` — persists only `{ sessionId }` to localStorage
- No `restoreHistory()` — deleted by design
- `handleSend()` — no `session.history.push()` calls, no history saving
- localStorage key: `bh_chat_session` (configurable via `storageKey`)

## Quick Reply Buttons

Buttons ("Get Started", "Book a Demo", "See Pricing") use `window.__bhSendQuick(text)` which sends the message directly without populating the input bar first. The function is exposed on `window` because the IIFE scope prevents inline `onclick` handlers from accessing internal functions.

## CSS Design Tokens (Current Values)

```css
--bh-primary: #ea580c        /* Orange — brand color */
--bh-primary-dark: #c2410c
--bh-primary-light: #fff7ed
--bh-surface: #ffffff
--bh-surface-2: #fafafa
--bh-border: #f0f0f0
--bh-border-strong: #e2e2e2
--bh-text-primary: #111827
--bh-text-secondary: #6b7280
--bh-text-tertiary: #9ca3af
--bh-radius-sm: 8px
--bh-radius-md: 14px
--bh-radius-lg: 18px
--bh-radius-xl: 24px          /* Chat window corners */
--bh-radius-full: 999px
--bh-widget-width: 400px
--bh-widget-height: 640px
```

## Chat Bubble Styles (Current Values)

```css
/* Bubble wrapper */
.bh-bubble-wrap { max-width: 88%; }

/* All bubbles */
.bh-bubble {
  padding: 16px 20px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.006em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* Bot bubble — gray with bottom-left tail */
.bh-msg-row.bh-bot .bh-bubble {
  color: #111827;
  background: #f3f4f6;
  border-bottom-left-radius: 6px;
}

/* User bubble — orange, fully rounded pill (no tail) */
.bh-msg-row.bh-user .bh-bubble {
  background: var(--bh-primary);
  color: #fff;
}

/* Message row spacing */
.bh-msg-row { margin-bottom: 16px; }
```

## Known Pitfall: CSS Specificity

The global reset uses `#bh-chat-root *` which has specificity (1,0,0). Class selectors like `.bh-bubble` have specificity (0,1,0). If you ever add `padding: 0` or similar resets back to `#bh-chat-root *`, it will silently override all bubble/component padding. This was the root cause of a long debugging session.

**Current reset (safe — no padding:0):**
```css
#bh-chat-root *, #bh-chat-root *::before, #bh-chat-root *::after {
  box-sizing: border-box;
  margin: 0;
  font-family: var(--bh-font);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

## Typing Indicator

Background is `#f3f4f6` (matches bot bubbles). Was previously `var(--bh-surface)` (#fff) which was invisible against the white messages background.

## Chat Window Shadow

4-layer shadow for depth:
```css
box-shadow:
  0 0 0 1px rgba(0,0,0,0.06),
  0 4px 12px rgba(0,0,0,0.05),
  0 12px 28px rgba(0,0,0,0.08),
  0 32px 64px rgba(0,0,0,0.14);
```

## n8n Webhook Integration

- Endpoint: configurable via `webhookUrl`
- Request: `POST { message, sessionId, timestamp }`
- Response: `{ reply: "string" }`
- Timeout: 20s (configurable via `requestTimeoutMs`)

### n8n Code Node — Voiceflow Slate Parser

For parsing Voiceflow responses in n8n before returning to widget:
```javascript
const items = $input.all();
let messages = [];
for (const item of items) {
  const payload = item.json.payload;
  if (payload?.message) {
    messages.push(payload.message);
  }
  if (payload?.slate?.content) {
    const lines = [];
    payload.slate.content.forEach(block => {
      const line = block.children
        .map(child => child.text || '')
        .join('');
      if (line.trim()) lines.push(line);
    });
    if (lines.length) messages.push(lines.join('\n'));
  }
}
const clean = messages.join('\n\n')
  .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
  .replace(/^[-•]\s*/gm, '- ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
return [{ json: { message: clean } }];
```

## Mobile Breakpoint

At `max-width: 480px`:
- Chat window goes full-screen (all edges 0, no border-radius)
- Launcher moves to `bottom: 16px; right: 16px`
- Profile avatar shrinks to 48px

## Testing Checklist

1. Open widget → welcome screen always shows
2. Click quick reply → sends directly (not via input bar)
3. Send message → appears in UI, gets bot reply from n8n
4. Refresh page → welcome screen again (no restored history)
5. Check localStorage → only `{ sessionId: "uuid" }`, no history
6. Check Network tab → only n8n webhook requests, zero Supabase
7. Hard refresh (Cmd+Shift+R) after CSS changes — browser caches aggressively on `file://`

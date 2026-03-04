# BotHive AI Chat Widget

Production-ready embeddable chat widget for BotHive AI agency clients.

---

## Files

| File | Purpose |
|------|---------|
| `widget.bundle.js` | **Single-file embed** — everything inlined, drop one `<script>` tag. Use this for client installs. |
| `widget.js` | Modular JS (loads `widget.css` separately) — use for development / customisation. |
| `widget.css` | Stylesheet for modular version. |
| `index.html` | Demo page for testing the widget locally. |

---

## Quick Start (Client Install)

**Step 1** — Open `widget.bundle.js` and set your n8n webhook URL at the top:

```js
var CONFIG = {
  WEBHOOK_URL: 'https://YOUR_N8N_INSTANCE/webhook/YOUR_WEBHOOK_ID',
  ...
};
```

**Step 2** — Host `widget.bundle.js` on your CDN or client's server.

**Step 3** — Add this single line to the client's website, just before `</body>`:

```html
<script src="https://yourcdn.com/widget.bundle.js"></script>
```

Done. The widget appears automatically.

---

## n8n Webhook Setup

Your n8n workflow must accept:

**Incoming payload (from widget → n8n):**
```json
{
  "message":   "Is your emergency line available 24/7?",
  "sessionId": "a3f7b2d1-...",
  "timestamp": "2024-01-15T14:23:01.000Z"
}
```

**Response from n8n → widget** (Respond to Webhook node):
```json
{
  "reply": "Yes, we're available 24/7 for plumbing emergencies! Call us or fill out the form and we'll respond within minutes."
}
```

The widget expects exactly `{ "reply": "..." }` — if your n8n node returns a different shape, wrap it in a Set node.

---

## Configuration Options

All options are at the top of `widget.bundle.js`:

```js
var CONFIG = {
  WEBHOOK_URL:   'https://...',         // Required — your n8n webhook
  BOT_NAME:      'BotHive AI',          // Display name in header
  BOT_SUBTITLE:  'Typically replies instantly',
  BRAND_TEXT:    'Powered by BotHive AI',
  BRAND_URL:     'https://itsbothive.com',
  SESSION_KEY:   'bothive_session_id',  // localStorage key for session ID
  HISTORY_KEY:   'bothive_chat_history',// localStorage key for chat history
  TIMEOUT_MS:    15000,                 // Request timeout (ms)
};
```

To white-label per client, change `BOT_NAME`, `BRAND_TEXT`, and `BRAND_URL`.

---

## Features

- ✅ Floating chat bubble, bottom-right
- ✅ Smooth open/close animation
- ✅ Real-time message bubbles (user + bot)
- ✅ Typing indicator (3 animated dots)
- ✅ Session persistence via `localStorage`
- ✅ Full conversation history restored on page reload
- ✅ Unique session ID per visitor, sent with every request
- ✅ Loading state — send button disabled while waiting
- ✅ Error handling with user-friendly messages
- ✅ Network timeout (15s default, configurable)
- ✅ Enter to send, Shift+Enter for new line
- ✅ Auto-scroll to latest message
- ✅ Auto-resize textarea
- ✅ Unread message badge (when widget is closed)
- ✅ XSS protection — all content HTML-escaped
- ✅ Input sanitisation — length capped, whitespace collapsed
- ✅ Fully responsive — full-screen on mobile
- ✅ Accessible — ARIA labels, keyboard navigation, Escape to close
- ✅ Zero external dependencies
- ✅ No conflicts with host page styles (scoped CSS)

---

## Security Notes

- All user and bot text is HTML-escaped before DOM insertion — XSS safe.
- No API tokens are exposed client-side. Keep auth in your n8n webhook.
- Session IDs are random UUIDs, not tied to PII.
- Chat history in `localStorage` is plaintext — do not store sensitive data in bot replies.

---

## Local Testing

```bash
# Serve the demo page on localhost
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` and click the chat bubble.

To test without a live n8n instance, temporarily replace `sendToWebhook` with a mock:

```js
async function sendToWebhook(message, sessionId) {
  await new Promise(r => setTimeout(r, 1000)); // simulate delay
  return "Thanks for reaching out! This is a test reply.";
}
```

---

## Customising Colors

Edit the CSS variables block in `widget.css` (or in the CSS string inside `widget.bundle.js`):

```css
--bh-primary:       #2563EB;  /* Main blue — change to client brand color */
--bh-primary-dark:  #1D4ED8;  /* Hover state */
--bh-primary-light: #EFF6FF;  /* Bot avatar background */
```

---

*BotHive AI — itsbothive.com*

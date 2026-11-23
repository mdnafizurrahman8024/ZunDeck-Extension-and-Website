# ZunDeck Publishing & Multi-Platform Deployment Guide

This guide provides comprehensive, step-by-step instructions for previewing, deploying, and submitting **ZunDeck** across the web and official browser extension stores.

---

## 1. Local Development & Free-Port Live Preview

ZunDeck includes a zero-dependency local live preview server with automatic port collision resolution (`START_PORT = 4173`, scanning up to `4250`).

### Starting the Server
```bash
npm run dev
# or
npm start
```

- **Default Local URL:** `http://localhost:4173/apps/web/index.html`
- **Auto-Port Collision Handling:** If port `4173` is occupied, the server automatically scans and binds to the next available free port (e.g. `4174`, `4210`), writing the active port into `.zundeck-dev-port` (gitignored).
- **Hot-Reload Friendly:** Serves both `apps/web/` and shared `core/` modules directly via native ES6 modules.

---

## 2. Load Unpacked in Google Chrome & Microsoft Edge

To test or use the **ZunDeck Manifest V3 Side Panel Extension** locally:

### In Google Chrome:
1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** (top-right toggle switch).
3. Click the **Load unpacked** button (top-left).
4. Select either:
   - For active development: `apps/extension/` inside this project repository.
   - For production release build: `dist/zundeck-chrome-edge/` (after running `npm run build`).
5. Click the puzzle icon in the Chrome toolbar and pin **ZunDeck**.
6. Click the ZunDeck icon to open the **Chrome Side Panel**.

### In Microsoft Edge:
1. Open Edge and navigate to `edge://extensions/`.
2. Toggle on **Developer mode** in the left sidebar.
3. Click **Load unpacked** and select `dist/zundeck-chrome-edge/` (or `apps/extension/`).
4. Pin the extension to access the Edge side panel.

---

## 3. Deploy Free Web Companion to GitHub Pages or Cloudflare Pages ($0)

The standalone Web Companion (`dist/zundeck-web/`) can be hosted anywhere completely free of charge.

### Option A: GitHub Pages ($0 Free)
1. Build the production web artifact:
   ```bash
   npm run build
   ```
2. In your GitHub repository settings:
   - Navigate to **Settings** &rarr; **Pages**.
   - Under **Build and deployment**, choose **Deploy from a branch**.
   - Select branch `main` or `gh-pages` and folder `/` or `/dist/zundeck-web`.
3. Your Web Companion is live at `https://<username>.github.io/<repo>/`!

### Option B: Cloudflare Pages ($0 Free)
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) &rarr; **Workers & Pages**.
2. Click **Create Application** &rarr; **Pages** &rarr; **Upload Assets**.
3. Drag and drop the `dist/zundeck-web/` folder or upload `dist/zundeck-web.zip`.
4. Your site will instantly be live on Cloudflare's global edge CDN with free SSL.

### Option C: Netlify Drop ($0 Free)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop `dist/zundeck-web/` into the browser window.
3. Your portfolio companion is live within seconds.

---

## 4. Submitting to Browser Extension Stores

Run `npm run build` to generate the pre-packaged, validated `.zip` archives inside `dist/`.

### 1. Microsoft Edge Add-ons ($0 Free Developer Account)
- **Developer Portal:** [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge)
- **Account Fee:** **$0 (100% Free)**
- **Upload File:** `dist/zundeck-chrome-edge.zip`
- **Submission Steps:**
  1. Register for a free Microsoft Developer account.
  2. Click **Create new extension**.
  3. Upload `dist/zundeck-chrome-edge.zip`.
  4. Provide description, screenshots (1280x800), and privacy policy URL.
  5. Submit for certification (typical review time: 24–48 hours).

### 2. Mozilla Firefox Add-ons / AMO ($0 Free Developer Account)
- **Developer Portal:** [addons.mozilla.org](https://addons.mozilla.org/developers/)
- **Account Fee:** **$0 (100% Free)**
- **Upload File:** `dist/zundeck-firefox.zip`
- **Submission Steps:**
  1. Log in to your Firefox Account on AMO.
  2. Click **Submit a New Add-on** &rarr; **On this site**.
  3. Upload `dist/zundeck-firefox.zip`. AMO will automatically validate the `browser_specific_settings.gecko.id`.
  4. Provide extension details and submit (typical automated + manual review: 1–2 business days).

### 3. Google Chrome Web Store ($5 One-Time Registration Fee)
- **Developer Portal:** [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- **Account Fee:** **$5 one-time registration fee** (Google account fee)
- **Upload File:** `dist/zundeck-chrome-edge.zip`
- **Submission Steps:**
  1. Pay the one-time $5 developer fee.
  2. Click **Add new item**.
  3. Upload `dist/zundeck-chrome-edge.zip`.
  4. In the **Privacy** tab:
     - Justify permissions: `sidePanel` (UI display), `storage`/`unlimitedStorage` (offline local database), `activeTab` (scroll-harvesting on explicit click), `scripting` (content script injection).
     - Single purpose: "AI-assisted academic portfolio, ATS CV/resume studio, and scholarship application assistant."
  5. Provide store assets (128px icon, 1280x800 promotional screenshot).
  6. Submit for review (typical review time: 1–3 business days).

---

## 5. Security & Privacy Guarantees for Store Reviewers

ZunDeck was engineered from the ground up for strict store compliance and zero security debt:

1. **Least-Privilege Permissions:**
   - Zero `<all_urls>` or broad host wildcards.
   - Zero cookie or browsing history interception.
   - Script injection occurs strictly via `activeTab` on explicit user interaction.

2. **Strict Content Security Policy (CSP):**
   - Blocks `unsafe-inline`, `unsafe-eval`, and third-party script tags.
   - Local styles, vector fonts, and icons only.

3. **100% Client-Side Private Vault Architecture (BYOK):**
   - User API keys (Gemini, GitHub PAT, etc.) are stored strictly inside local browser storage via `vault-storage.js`.
   - Never transmitted to any proxy, telemetry service, or remote server.
   - Every file undergoes pre-push security scanning (`secret-scanner.js`) before publication or backup export.

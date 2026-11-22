# Security & Privacy Policy

## 100% Client-Side, BYOK, Zero-Telemetry Privacy Guarantee

ZunDeck is architected from the ground up as a **local-first, privacy-respecting workstation**. Your portfolio data, CV drafts, academic transcripts, and personal credentials belong entirely to you.

---

### Core Guarantees

1. **Zero Telemetry & Zero Tracking**:
   - ZunDeck does not include Google Analytics, Meta Pixel, Mixpanel, or any third-party event trackers.
   - We do not log keystrokes, page visits, IP addresses, or document exports.

2. **Bring Your Own Key (BYOK)**:
   - When AI acceleration is used (e.g., Gemini API, OpenAI), all API keys remain strictly on your local machine (`localStorage` or in-memory session).
   - Keys are never routed through any intermediary proxy server or cloud logging infrastructure.

3. **100% Client-Side Execution**:
   - Portfolio HTML generation, ATS CV compilation, Markdown parsing, JSON validation, and image compression occur directly in your browser or local Node runtime.
   - Your data never leaves your computer unless you explicitly choose to publish to GitHub Pages or Netlify using your own authenticated token.

4. **Repository Hygiene**:
   - Private files (`CV_Nafiz.pdf`, `*.zundeck.json`, `user-vault/`, `local-backups/`, `.env*`) are strictly blocked by `.gitignore`.
   - Never commit sensitive documents, tokens, or private research notes to version control.

---

### Reporting Vulnerabilities

If you discover any security or data leak concern in ZunDeck, please open an issue on the repository or contact the maintainer directly at `mdnafizurrahman8024@gmail.com`.

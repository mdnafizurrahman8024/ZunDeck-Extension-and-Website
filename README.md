<div align="center">
  <img src="apps/web/assets/zundeck-logo.png" alt="ZunDeck Logo" height="110" />
  <h1>ZunDeck</h1>
  <p><strong>Open-Source AI Portfolio • ATS CV &amp; Resume • SOP Studio • Progressive Scroll-Capture • Vibe Coding Agent • 1-Click Free GitHub Deploy</strong></p>

  <p>
    <a href="https://github.com/mdnafizurrahman8024/ZunDeck-Extension-and-Website"><img src="https://img.shields.io/badge/Release-v1.0.0-0d9488.svg" alt="Release v1.0.0" /></a>
    <a href="https://github.com/mdnafizurrahman8024/ZunDeck-Extension-and-Website/actions"><img src="https://img.shields.io/badge/Tests-67%20Passed-10b981.svg" alt="Tests" /></a>
    <a href="https://github.com/mdnafizurrahman8024/ZunDeck-Extension-and-Website/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
    <a href="https://developer.chrome.com/docs/extensions/mv3/"><img src="https://img.shields.io/badge/Manifest%20V3-Chrome%20%7C%20Edge%20%7C%20Firefox-0284c7.svg" alt="Manifest V3" /></a>
    <a href="https://pages.github.com/"><img src="https://img.shields.io/badge/Deploy-GitHub%20Pages%20($0)-16a34a.svg" alt="Free Deploy" /></a>
  </p>
</div>

---

**ZunDeck** is a zero-dependency, local-first academic portfolio workstation, ATS CV/resume studio, and scholarship application assistant. It empowers researchers, clinician-scientists, software engineers, and graduate candidates to curate a single source of professional truth (`ZunProfileV1`) and deploy it bidirectionally across web portfolios, vector PDFs, Word documents, and live GitHub Pages for **$0**.

---

## Key Studio Capabilities

| Studio Mode | Description | Key Features |
| :--- | :--- | :--- |
| **Portfolio Studio** | 30 Role-Based Templates + Custom Canvas | Academic Flagship, Tech & AI, Executive Corporate, interactive DOI links, responsive viewports (1440px, 980px, 390px). |
| **CV & Resume Studio** | 30 ATS-Engineered Templates + Multi-CV Switcher | Vector PDF print, editable Word (`.docx`), dynamic vector QR SVG codes, and ATS Robot X-Ray linear parsing inspector. |
| **SOP & Letters Studio** | Academic & Corporate Writing Engine | SOP (PhD/MS), Motivation Letter, Cover Letter, Cold Email to PI with Word limits, zero-fabrication verification, and `.docx` export. |
| **Side Panel Extension** | Chrome & Edge Manifest V3 Shell | Store-compliant least-privilege permissions, strict CSP firewall, pre-push secret scanner, and real-time live preview. |
| **Visual No-Code Editor** | Drag-and-Drop & Live Split-Screen | 2-second debounced auto-save, badge picker, DOI/ORCID auto-filler, location map coordinates, and pop-out preview. |
| **Media & Docs Manager** | Multi-File Uploader & Drive Embedder | Drag-and-drop reordering, consent image compression with original undo, and non-error Google Drive, Slides & Docs inline embeds. |
| **Smart Harvester** | Progressive Scroll-Capture Engine | Ad & noise boiler filtering, site-aware parsers (LinkedIn, Scholar, ORCID, GitHub), and batch staging review. |
| **Vibe Coding Agent** | Safe 3-Layer AI Agent & BYOK Vault | English & Bengali intent parser, Gemini API multimodal vision, 25+ prompt library, 7 user guides, and 30-checkpoint undo timeline. |
| **1-Click Auto-Deploy** | Free GitHub Pages Publishing Engine | Generates static bundles (`index.html`, `cv.html`, `robots.txt`, `sitemap.xml`), pre-push secret security gate, and 1-click commit rollback. |

---

## Quick Start (Local Live Preview)

ZunDeck runs out of the box on any system with Node.js installed. It requires **zero external build dependencies or npm install bloat**.

```bash
# 1. Clone the repository
git clone https://github.com/mdnafizurrahman8024/ZunDeck-Extension-and-Website.git
cd ZunDeck-Extension-and-Website

# 2. Launch the dev server (auto-selects next free port if 4173 is occupied)
npm run dev
# or
npm start
```

Open your browser at `http://localhost:4173` (or the port indicated in your console) to launch the **Live Preview Workbench & Free Web Companion**.

---

## Loading the Browser Extension (Unpacked)

### Google Chrome & Microsoft Edge (Manifest V3)
1. Open `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the [`apps/extension/`](apps/extension) folder (or [`dist/zundeck-chrome-edge/`](dist/zundeck-chrome-edge) after building).
4. Pin **ZunDeck** to your toolbar and click its icon to open the **Side Panel**.

---

## Production Build & Multi-Browser Packaging

To generate production-ready packages for all major browsers and static web hosts:

```bash
npm run build
```

The script outputs cleanly into the gitignored `dist/` directory:
- `dist/zundeck-chrome-edge/` & `dist/zundeck-chrome-edge.zip` &mdash; Store-ready for Chrome Web Store & Microsoft Edge Add-ons.
- `dist/zundeck-firefox/` & `dist/zundeck-firefox.zip` &mdash; AMO-compatible Firefox Manifest V3 extension.
- `dist/zundeck-web/` & `dist/zundeck-web.zip` &mdash; Standalone Free Web Companion static site ready for GitHub Pages, Cloudflare Pages, or Netlify Drop.

For complete store submission steps, see the [Publishing & Deployment Guide](docs/PUBLISH-GUIDE.md).

---

## Verification & Security Audits

```bash
# Run comprehensive 14-point master pre-flight check
npm run check

# Run complete repository architecture, syntax, and security audit
npm run audit

# Run entire test suite (67 unit tests)
npm test
```

---

## Privacy Architecture (BYOK & Vault Firewall)

- **100% Client-Side:** All profile data, notes, and documents reside locally in your browser (IndexedDB and local storage).
- **Bring Your Own Key (BYOK):** API keys (Google Gemini API, GitHub PAT) are saved strictly inside the private vault ([`vault-storage.js`](core/storage/vault-storage.js)). They are **never** committed to Git, transmitted to third-party telemetry, or included in exported backup bundles.
- **Pre-Push Security Shield:** Built-in secret scanner ([`secret-scanner.js`](core/security/secret-scanner.js)) inspects every generated bundle file before it touches GitHub.

---

## Repository Structure

```text
ZunDeck-Extension-and-Website/
├── core/                        # Portable business logic & engines
│   ├── ai/                      # BYOK client, Vibe coding agent & multimodal matcher
│   ├── data/                    # Mother showcase adapter & fallback JSON
│   ├── deploy/                  # 1-Click GitHub Pages deployer & bundle generator
│   ├── engines/                 # Portfolio, CV, ATS X-Ray & Letter studios
│   ├── exporters/               # Vector PDF, OpenXML Word (.docx) & QR generators
│   ├── media/                   # Consent image optimizer & original blob tracker
│   ├── parsers/                 # Noise filters, CV parsers & Google Drive embedders
│   ├── schema/                  # ZunProfileV1 unified profile schema & normalizers
│   ├── security/                # Secret scanner, XSS sanitizer & CSS sanitizer
│   ├── storage/                 # Auto-save engine, private vault & checkpoint timeline
│   ├── templates/               # 31 Portfolio templates + 30 CV/Resume templates
│   └── ui/                      # Visual editors, deploy panel, guides & UI controllers
├── apps/
│   ├── web/                     # Live Preview Workbench & Free Web Companion
│   └── extension/               # Chrome & Edge Manifest V3 Side Panel extension
├── dist/                        # Production build artifacts (gitignored)
├── docs/                        # Publishing guides, brand icons & documentation
├── scripts/                     # Dev server, build packager & verify scripts
└── tests/                       # Complete automated unit tests & full audit suite
```

---

## Author & Acknowledgements

Developed by **[Md. Nafizur Rahman](https://github.com/mdnafizurrahman8024)** &bull; University of Rajshahi.

Licensed under the [MIT License](LICENSE).

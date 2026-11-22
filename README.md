# ZunDeck

> **AI Portfolio • ATS CV & Resume • SOP Studio • Scroll Capture • Vibe Coding • 1-Click Free Deploy**

ZunDeck is a lightweight, zero-dependency, local-first portfolio workstation and multi-document studio. It empowers researchers, software engineers, clinicians, students, and executives to curate a single source of professional truth (`ZunProfileV1`) and compile it bidirectionally into high-impact academic portfolios, ATS-optimized CVs, and targeted Statements of Purpose (SOP).

---

## Highlights

- **30 Role-Based Portfolio Templates + Custom Canvas**: Academic, Tech, and Corporate archetypes with full customization.
- **#1 Recommended Flagship Academic Showcase**: Faithful, modern architecture mirroring the live research portfolio at [mdnafizurrahman8024.github.io](https://mdnafizurrahman8024.github.io/).
- **Zero Heavy Build Dependencies**: Runs instantaneously on any system (smooth on 8 GB RAM) using native modern JavaScript (ES Modules) and pure CSS.
- **Auto-Port Live Dev Server**: Smart static server with automatic free-port fallback (`4173` &rarr; `4250`) on port collisions.
- **100% Client-Side & BYOK**: Zero telemetry, zero cloud lock-in, client-side rendering, and privacy-first local storage.
- **Responsive Across All Viewports**: Tested for laptop (`1440px`), tablet & phone desktop mode (`980px`), and mobile phones (`390px` / `375px`).

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/mdnafizurrahman8024/ZunDeck.git
cd ZunDeck

# Launch the live preview server (starts at 4173 or auto-increments if busy)
npm run dev
```

Visit `http://localhost:4173` (or the active port displayed in terminal) to access the Live Preview Workbench.

---

## Project Structure

```text
ZunDeck/
├── core/                  # Unified business logic & portable engines
│   ├── schema/            # ZunProfileV1 unified data schema & validators
│   ├── data/              # Mother showcase adapter & offline fallback
│   ├── templates/         # 30 template definitions + Custom Canvas catalog
│   ├── engines/           # Portfolio renderer & auto-SEO generator
│   ├── exporters/         # HTML/PDF/JSON exporter hooks
│   ├── storage/           # LocalStorage & file persistence
│   ├── security/          # XSS sanitizers & BYOK credential vaults
│   ├── media/             # Image optimization & CDN resolvers
│   ├── ai/                # Prompt builders & AI assistant connectors
│   ├── deploy/            # 1-click GitHub Pages & Netlify publish helpers
│   ├── parsers/           # BibTeX, JSON & markdown converters
│   └── ui/                # Shared theme tokens & UI components
├── apps/
│   ├── web/               # Live Preview Workbench & Free Web Companion
│   └── extension/         # Manifest V3 browser extension (Part 4)
├── scripts/               # Zero-dependency Node dev server & verification
├── tests/                 # Unit tests for schema, server, and engines
├── docs/                  # Architecture & design documentation
└── .vscode/               # One-click VS Code tasks
```

---

## License

MIT © Md. Nafizur Rahman

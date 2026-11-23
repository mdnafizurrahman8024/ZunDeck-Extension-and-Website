import { escapeHtml } from '../security/sanitizer.js';
import {
  PROMPT_LIBRARY,
  PROMPT_CATEGORIES,
  getPromptsByCategory,
  searchPrompts,
  generateStructuredPrompt
} from '../ai/prompt-library.js';

export {
  PROMPT_LIBRARY,
  PROMPT_CATEGORIES,
  getPromptsByCategory,
  searchPrompts,
  generateStructuredPrompt
};

export const USER_GUIDES = [
  {
    id: 'guide-gemini-api',
    number: '01',
    title: 'Setting up Free Gemini API Key & Multi-Provider BYOK AI',
    badge: 'AI Setup',
    icon: 'fa-solid fa-key',
    summary: 'Connect your own private API key for Google Gemini (100% free), Anthropic Claude, OpenAI, DeepSeek, Groq, or OpenRouter in seconds.',
    steps: [
      'Choose your preferred AI provider in ZunDeck <strong>BYOK AI Settings</strong> (Google Gemini, Anthropic Claude, OpenAI, DeepSeek, Groq, OpenRouter, xAI, Mistral, or Custom/Ollama).',
      'For free instant access: Visit <strong>aistudio.google.com</strong>, click <em>"Get API Key"</em>, and copy your Google Gemini key.',
      'Paste your API key into the ZunDeck Private Vault dialog.',
      'Click <strong>"Fetch Live Models"</strong> to query current models, or choose from high-performance presets (Gemini 2.5 Pro/Flash, Claude 3.7 Sonnet, GPT-4o, DeepSeek-V3/R1).',
      'Click <strong>"Test Connection"</strong> to verify live latency and token generation, then save to your encrypted local vault.'
    ]
  },
  {
    id: 'guide-github-token',
    number: '02',
    title: 'Creating a Fine-Grained GitHub Token Safely',
    badge: '1-Click Deploy',
    icon: 'fa-brands fa-github',
    summary: 'Grant least-privilege repository permissions so ZunDeck can deploy your portfolio directly to GitHub Pages.',
    steps: [
      'Go to GitHub → <strong>Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens</strong>.',
      'Click <strong>"Generate new token"</strong> and name it <code>ZunDeck Portfolio Deploy</code>.',
      'Under <strong>Repository Access</strong>, select <strong>"Only select repositories"</strong> and choose your target repository.',
      'Under <strong>Permissions</strong>, grant <strong>Contents: Read & Write</strong> and <strong>Pages: Read & Write</strong> only.',
      'Paste the token into ZunDeck Vault. Our Secret Scanner verifies that no permissions exceed least privilege.'
    ]
  },
  {
    id: 'guide-scroll-capture',
    number: '03',
    title: 'Clean Progressive Scroll-Capture Without Noise',
    badge: 'Extension Harvester',
    icon: 'fa-solid fa-arrows-up-down',
    summary: 'Harvest verified publications and experiences from LinkedIn, Scholar, and ORCID with zero robotic rate limits.',
    steps: [
      'Open your target profile page (LinkedIn, Google Scholar, ORCID, or university faculty directory).',
      'Click the <strong>ZunDeck Side Panel</strong> icon in your browser toolbar.',
      'Switch to the <strong>Harvester</strong> tab and click <strong>"Start Scroll Capture"</strong>.',
      'Scroll down the page naturally with your mouse. ZunDeck automatically strips sponsored ads, cookie banners, and "...see more" buttons.',
      'Click <strong>"Review Staged"</strong>, inspect the extracted items in the drawer, choose <strong>"Append to Existing"</strong>, and confirm merge.'
    ]
  },
  {
    id: 'guide-google-drive',
    number: '04',
    title: 'Setting Google Drive Files to Anyone with Link',
    badge: 'Media & Docs',
    icon: 'fa-brands fa-google-drive',
    summary: 'Ensure uploaded certificates, PDFs, and slide decks preview cleanly inline without Google login errors.',
    steps: [
      'In Google Drive, right-click your PDF or presentation file and select <strong>Share → Share</strong>.',
      'Under General Access, change from <strong>"Restricted"</strong> to <strong>"Anyone with the link"</strong>.',
      'Ensure the role is set to <strong>"Viewer"</strong>.',
      'Copy the link and paste it into ZunDeck Documents Manager.',
      'ZunDeck automatically converts <code>/view</code> or <code>/edit</code> URLs into responsive <code>/preview</code> embed iframes.'
    ]
  },
  {
    id: 'guide-cv-templates',
    number: '05',
    title: 'Choosing Portfolio vs. Europass & ATS CV Templates',
    badge: 'Templates',
    icon: 'fa-solid fa-file-invoice',
    summary: 'Select the optimal layout for graduate admissions, tech hiring, or European academic appointments.',
    steps: [
      'Use <strong>Academic Flagship (cv-acad-flagship)</strong> for US/UK/Canada graduate applications with detailed research, publications, and DOIs.',
      'Use <strong>Europass Clean (cv-acad-europass)</strong> for European institutions requiring the official CEFR language self-assessment grid.',
      'Use <strong>Tech & AI Minimalist (cv-tech-minimalist)</strong> for industry tech roles requiring 1-page compact layout and GitHub project metrics.',
      'Run the <strong>ATS Robot X-Ray</strong> tool in the header to simulate automated parsing and ensure a 95+ score.'
    ]
  },
  {
    id: 'guide-pdf-word-export',
    number: '06',
    title: 'Exporting Vector PDF, Word (.docx) & Free GitHub Pages',
    badge: 'Export & Deploy',
    icon: 'fa-solid fa-cloud-arrow-up',
    summary: 'Export pixel-perfect vector print documents or publish live to the web with zero recurring hosting costs.',
    steps: [
      'To export vector PDF: Click the <strong>Print / PDF</strong> icon in the header. Select destination <em>"Save as PDF"</em> with <em>Margins: None</em> and <em>Background graphics: Checked</em>.',
      'To export editable Word: Click <strong>"Word (.docx)"</strong> to download an OpenXML package with native tables and styles.',
      'To publish live website: Click <strong>"Export HTML"</strong> for an offline portable bundle, or click <strong>"Deploy to GitHub Pages"</strong> for free HTTPS hosting.'
    ]
  },
  {
    id: 'guide-vibe-prompts',
    number: '07',
    title: 'Writing Effective Structured Vibe Coding Prompts',
    badge: 'Vibe Coding',
    icon: 'fa-solid fa-terminal',
    summary: 'Harness 5-point structured prompts in English or Bengali to tweak visual layout, motion physics, and ATS content safely.',
    steps: [
      'Use the 5-point structure: <strong>Role</strong>, <strong>Objective</strong>, <strong>Commands</strong>, <strong>Design Specs</strong>, and <strong>Security Rules</strong>.',
      'Try the built-in <strong>"Prompt with AI"</strong> assistant inside Vibe Studio to interactively turn simple requests into production prompts.',
      'Every change automatically generates an <strong>Undo Checkpoint</strong> snapshot so you can test bold layouts with 1-click rollback.',
      'Use Bengali or English freely: ZunDeck understands localized commands and applies safe JSON tool calls.'
    ]
  }
];

export function renderGuideAndPromptsHtml(activeTab = 'prompts') {
  return `
    <div class="guide-prompts-root">
      <!-- Header Tabs -->
      <div class="gp-nav-bar" role="tablist">
        <button type="button" class="gp-nav-tab ${activeTab === 'prompts' ? 'active' : ''}" data-gp-tab="prompts">
          <i class="fa-solid fa-terminal"></i>
          <span>Vibe Prompt Library (${PROMPT_LIBRARY.length} Structured Pro Prompts)</span>
        </button>
        <button type="button" class="gp-nav-tab ${activeTab === 'manual' ? 'active' : ''}" data-gp-tab="manual">
          <i class="fa-solid fa-book-open"></i>
          <span>Interactive User Manual (${USER_GUIDES.length} Guides)</span>
        </button>
      </div>

      <!-- Tab 1: Prompt Library -->
      <div class="gp-tab-pane ${activeTab === 'prompts' ? 'active' : ''}" id="gp-pane-prompts">
        <div class="gp-filter-bar">
          <div class="gp-search-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="input-search-prompts" class="gp-search-input" placeholder="Search 30+ structured pro prompts (AMR, Bento, ATS CV, SOP, Widgets)...">
          </div>
          <div class="gp-category-chips" id="gp-prompt-categories">
            ${PROMPT_CATEGORIES.map((cat, i) => `
              <button type="button" class="gp-chip ${i === 0 ? 'active' : ''}" data-cat="${cat.id}">
                ${escapeHtml(cat.label)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="gp-cards-grid" id="gp-prompts-list">
          ${renderPromptsListHtml(PROMPT_LIBRARY)}
        </div>
      </div>

      <!-- Tab 2: User Manual -->
      <div class="gp-tab-pane ${activeTab === 'manual' ? 'active' : ''}" id="gp-pane-manual">
        <div class="gp-manual-intro">
          <h3 class="gp-manual-heading">ZunDeck Complete System Manual</h3>
          <p class="gp-manual-sub">Clear, step-by-step guides to master your academic portfolio, ATS CV studio, and free deployments.</p>
        </div>

        <div class="gp-guides-accordion" id="gp-guides-list">
          ${renderGuidesAccordionHtml(USER_GUIDES)}
        </div>
      </div>
    </div>
  `;
}

export function renderPromptsListHtml(prompts = []) {
  if (!prompts.length) {
    return `<div class="gp-empty-state">No matching prompts found. Try a different search keyword.</div>`;
  }

  return prompts.map((item, idx) => `
    <div class="gp-prompt-card" data-idx="${idx}" data-category="${item.category}">
      <div class="gp-card-header">
        <span class="gp-category-tag">${escapeHtml(item.categoryLabel)}</span>
        <div class="gp-card-actions">
          <button type="button" class="btn-copy-prompt" data-copy-prompt="${idx}" title="Copy full structured prompt to clipboard">
            <i class="fa-solid fa-copy"></i> Copy
          </button>
          <button type="button" class="btn-use-prompt" data-use-prompt="${idx}" title="Send directly to Vibe Agent">
            <i class="fa-solid fa-arrow-turn-down"></i> Use Prompt
          </button>
        </div>
      </div>
      <h4 class="gp-prompt-title">${escapeHtml(item.title)}</h4>
      <p class="gp-prompt-sub">${escapeHtml(item.summary || '')}</p>
      <div class="gp-prompt-preview">
        <pre class="gp-code-block">${escapeHtml(item.prompt)}</pre>
      </div>
    </div>
  `).join('');
}

export function renderGuidesAccordionHtml(guides = []) {
  return guides.map((guide, idx) => `
    <details class="gp-guide-accordion-item" ${idx === 0 ? 'open' : ''}>
      <summary class="gp-guide-summary">
        <div class="gp-summary-left">
          <span class="gp-guide-num">${guide.number}</span>
          <i class="${guide.icon} gp-guide-icon"></i>
          <div>
            <h4 class="gp-guide-title">${escapeHtml(guide.title)}</h4>
            <span class="gp-guide-badge">${escapeHtml(guide.badge)}</span>
          </div>
        </div>
        <i class="fa-solid fa-chevron-down gp-summary-arrow"></i>
      </summary>
      <div class="gp-guide-content">
        <p class="gp-guide-overview">${escapeHtml(guide.summary)}</p>
        <ol class="gp-guide-steps">
          ${guide.steps.map((st) => `<li>${st}</li>`).join('')}
        </ol>
      </div>
    </details>
  `).join('');
}

export class GuideAndPromptsController {
  constructor(options = {}) {
    this.container = options.container || null;
    this.activeTab = options.activeTab || 'prompts';
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.onSelectPrompt = typeof options.onSelectPrompt === 'function' ? options.onSelectPrompt : () => {};
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = renderGuideAndPromptsHtml(this.activeTab);
    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Tab switcher
    this.container.querySelectorAll('.gp-nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.getAttribute('data-gp-tab');
        this.render();
      });
    });

    // Category filter chips
    this.container.querySelectorAll('.gp-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.container.querySelectorAll('.gp-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeCategory = chip.getAttribute('data-cat');
        this.filterPrompts();
      });
    });

    // Search input
    const searchInp = this.container.querySelector('#input-search-prompts');
    searchInp?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.filterPrompts();
    });

    // Delegated click handler
    this.container.addEventListener('click', async (e) => {
      // Use prompt in vibe
      const btnUse = e.target.closest('[data-use-prompt]');
      if (btnUse) {
        const idx = parseInt(btnUse.getAttribute('data-use-prompt'), 10);
        const item = PROMPT_LIBRARY[idx];
        if (item) {
          this.onSelectPrompt(item.prompt);
        }
        return;
      }

      // Copy prompt to clipboard
      const btnCopy = e.target.closest('[data-copy-prompt]');
      if (btnCopy) {
        const idx = parseInt(btnCopy.getAttribute('data-copy-prompt'), 10);
        const item = PROMPT_LIBRARY[idx];
        if (item && item.prompt) {
          try {
            await navigator.clipboard.writeText(item.prompt);
            const origHtml = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            btnCopy.classList.add('copied');
            setTimeout(() => {
              btnCopy.innerHTML = origHtml;
              btnCopy.classList.remove('copied');
            }, 1800);
          } catch {
            // Fallback for older browsers
          }
        }
      }
    });
  }

  filterPrompts() {
    const listEl = this.container?.querySelector('#gp-prompts-list');
    if (!listEl) return;

    const filtered = PROMPT_LIBRARY.filter((p) => {
      const matchesCat = this.activeCategory === 'all' || p.category === this.activeCategory;
      const matchesQuery = !this.searchQuery ||
        p.title.toLowerCase().includes(this.searchQuery) ||
        p.summary.toLowerCase().includes(this.searchQuery) ||
        p.prompt.toLowerCase().includes(this.searchQuery) ||
        p.categoryLabel.toLowerCase().includes(this.searchQuery);
      return matchesCat && matchesQuery;
    });

    listEl.innerHTML = renderPromptsListHtml(filtered);
  }
}

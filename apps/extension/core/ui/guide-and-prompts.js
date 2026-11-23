import { escapeHtml } from '../security/sanitizer.js';

export const USER_GUIDES = [
  {
    id: 'guide-gemini-api',
    number: '01',
    title: 'Setting up Free Gemini API Key',
    badge: 'AI Setup',
    icon: 'fa-solid fa-key',
    summary: 'Get 100% free multimodal Google Gemini API access in under 60 seconds with zero credit card required.',
    steps: [
      'Visit Google AI Studio at <strong>aistudio.google.com</strong> and sign in with your Google Account.',
      'Click <strong>"Get API Key"</strong> in the top-left sidebar and select <strong>"Create API key in new project"</strong>.',
      'Copy the generated key (starts with <code>AIzaSy...</code>).',
      'Open ZunDeck → <strong>Vibe Coding Settings</strong>, paste your key, and click <strong>"Test Connection"</strong>.',
      'Your key is saved strictly in your local encrypted browser vault and is never sent to third-party proxies.'
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
    title: 'Writing Effective Vibe Coding Prompts',
    badge: 'Vibe Coding',
    icon: 'fa-solid fa-terminal',
    summary: 'Harness natural language instructions in English or Bengali to tweak your visual layout safely.',
    steps: [
      'Be specific about the section and aesthetic: e.g., <em>"Change accent color to Emerald and make cards 2 columns"</em>.',
      'Ask for content refinements based on real facts: e.g., <em>"Make my research summary more concise for graduate reviewers"</em>.',
      'Use Bengali freely: e.g., <em>"থিমের ব্যাকগ্রাউন্ড ডার্ক করো এবং ফন্ট ইন্টার করো"</em>.',
      'Every change automatically generates an <strong>Undo Checkpoint</strong> so you can revert anytime with 1 click.'
    ]
  }
];

export const PROMPT_LIBRARY = [
  // 1. Design & Theme Vibe
  {
    category: 'design',
    categoryLabel: 'Design & Theme Vibe',
    title: 'Emerald Academic Aesthetic',
    prompt: 'Change accent color to Emerald (#10b981), switch theme to dark, and set card layout to 2 columns.'
  },
  {
    category: 'design',
    categoryLabel: 'Design & Theme Vibe',
    title: 'Teal Minimalist Layout',
    prompt: 'Switch portfolio template to Clean Minimalist with deep teal accent (#0d9488) and slate dark background.'
  },
  {
    category: 'design',
    categoryLabel: 'Design & Theme Vibe',
    title: 'Corporate Executive Polish',
    prompt: 'Switch portfolio template to Corporate Executive with navy blue accent (#2563eb) and 3-column card grid.'
  },
  {
    category: 'design',
    categoryLabel: 'Design & Theme Vibe',
    title: 'Bengali Dark Theme Tweak',
    prompt: 'থিম ডার্ক মোডে পরিবর্তন করো এবং বাটনগুলোর অ্যাকসেন্ট কালার নীলে (#3b82f6) রূপান্তর করো।'
  },
  {
    category: 'design',
    categoryLabel: 'Design & Theme Vibe',
    title: 'Clean Monospace Code Accent',
    prompt: 'Set typography pairing to JetBrains Mono with warm amber highlights (#f59e0b) for a hacker portfolio vibe.'
  },

  // 2. Academic & Research Polish
  {
    category: 'academic',
    categoryLabel: 'Academic & Research Polish',
    title: 'Highlight First-Author Publications',
    prompt: 'Review my publications and ensure first-author journal papers are prominently ordered at the top of the section.'
  },
  {
    category: 'academic',
    categoryLabel: 'Academic & Research Polish',
    title: 'Refine Research Appointments',
    prompt: 'Refine my research experience bullet points to emphasize molecular virology, pathogen surveillance, and data pipelines.'
  },
  {
    category: 'academic',
    categoryLabel: 'Academic & Research Polish',
    title: 'Add Computational Skills',
    prompt: 'Add technical skills: Nextflow, BLAST+, Biopython, GeoPandas, Nextstrain, and Linux Bash Scripting.'
  },
  {
    category: 'academic',
    categoryLabel: 'Academic & Research Polish',
    title: 'Academic Bio Refinement',
    prompt: 'Rewrite my bio summary into 2 impactful paragraphs highlighting veterinary epidemiology and computational biology.'
  },
  {
    category: 'academic',
    categoryLabel: 'Academic & Research Polish',
    title: 'Add Research Grant Item',
    prompt: 'Add an award item: Dean\'s Research Fellowship Grant for Rabies Molecular Surveillance ($2,500 USD).'
  },

  // 3. Corporate ATS Impact
  {
    category: 'corporate',
    categoryLabel: 'Corporate ATS Impact',
    title: 'Action-Verb Bullet Refinement',
    prompt: 'Transform my project bullets using the Google XYZ formula: Accomplished [X], as measured by [Y], by doing [Z].'
  },
  {
    category: 'corporate',
    categoryLabel: 'Corporate ATS Impact',
    title: 'Tailor for Bioinformatics Analyst',
    prompt: 'Create a tailored CV profile named "Bioinformatics Analyst" emphasizing Python, NGS sequencing, and statistical modeling.'
  },
  {
    category: 'corporate',
    categoryLabel: 'Corporate ATS Impact',
    title: 'Compact 1-Page ATS CV',
    prompt: 'Switch active CV template to cv-tech-minimalist and limit visible publications to top 3 for a crisp 1-page resume.'
  },
  {
    category: 'corporate',
    categoryLabel: 'Corporate ATS Impact',
    title: 'Emphasize Leadership & Outputs',
    prompt: 'Update my role badge to "Lead Clinical Researcher & Full-Stack Developer" and refine project descriptions for tech recruiters.'
  },
  {
    category: 'corporate',
    categoryLabel: 'Corporate ATS Impact',
    title: 'Highlight Soft & Domain Skills',
    prompt: 'Add domain skills: One Health Cross-Sectoral Communication, Scientific Grant Writing, and Stakeholder Reporting.'
  },

  // 4. SOP & Cold Email
  {
    category: 'letters',
    categoryLabel: 'SOP & Cold Email',
    title: 'PhD SOP Methodology Scaffold',
    prompt: 'Draft an SOP body paragraph bridging my undergraduate veterinary clinical training with future PhD research in viral genomics.'
  },
  {
    category: 'letters',
    categoryLabel: 'SOP & Cold Email',
    title: 'Prospective PI Cold Email',
    prompt: 'Draft a concise 200-word cold email to a prospective laboratory PI expressing specific interest in their upcoming zoonotic outbreak project.'
  },
  {
    category: 'letters',
    categoryLabel: 'SOP & Cold Email',
    title: 'Motivation Letter for Scholarship',
    prompt: 'Draft a targeted motivation letter for the Erasmus Mundus Master Scholarship highlighting my One Health research contributions in Bangladesh.'
  },
  {
    category: 'letters',
    categoryLabel: 'SOP & Cold Email',
    title: 'Cover Letter for Research Associate',
    prompt: 'Draft a professional cover letter for a Research Associate opening, citing my published papers in Veterinary Microbiology.'
  },
  {
    category: 'letters',
    categoryLabel: 'SOP & Cold Email',
    title: 'Post-Interview Follow-Up Note',
    prompt: 'Draft a polite, professional 100-word follow-up email thanking the interview committee and reiterating my lab sequencing experience.'
  },

  // 5. Custom Layout Tweaks
  {
    category: 'layout',
    categoryLabel: 'Custom Layout Tweaks',
    title: 'Set Initial Items to 5 (See All)',
    prompt: 'Configure seeAllLimit to 5 items so research appointments and publications display a clean See All expander button.'
  },
  {
    category: 'layout',
    categoryLabel: 'Custom Layout Tweaks',
    title: 'Inject Scoped Custom CSS',
    prompt: 'Add scoped custom CSS to give cards a subtle border-left accent line matching the primary color.'
  },
  {
    category: 'layout',
    categoryLabel: 'Custom Layout Tweaks',
    title: 'Toggle Section Visibility',
    prompt: 'In my active CV profile, hide the volunteer section and keep education, research, publications, and certifications visible.'
  },
  {
    category: 'layout',
    categoryLabel: 'Custom Layout Tweaks',
    title: 'Compact Mobile Viewport Tweak',
    prompt: 'Optimize card grid padding to 12px and ensure hero avatar is center-aligned on mobile devices.'
  },
  {
    category: 'layout',
    categoryLabel: 'Custom Layout Tweaks',
    title: 'Switch to Europass Academic View',
    prompt: 'Switch active CV template to cv-acad-europass and ensure language proficiencies and research activities are prioritized.'
  }
];

export function renderGuideAndPromptsHtml(activeTab = 'prompts') {
  return `
    <div class="guide-prompts-root">
      <!-- Header Tabs -->
      <div class="gp-nav-bar" role="tablist">
        <button type="button" class="gp-nav-tab ${activeTab === 'prompts' ? 'active' : ''}" data-gp-tab="prompts">
          <i class="fa-solid fa-terminal"></i>
          <span>Vibe Prompt Library (${PROMPT_LIBRARY.length})</span>
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
            <input type="text" id="input-search-prompts" class="gp-search-input" placeholder="Search 25+ curated prompts...">
          </div>
          <div class="gp-category-chips" id="gp-prompt-categories">
            <button type="button" class="gp-chip active" data-cat="all">All Prompts</button>
            <button type="button" class="gp-chip" data-cat="design">Design &amp; Theme</button>
            <button type="button" class="gp-chip" data-cat="academic">Academic &amp; Research</button>
            <button type="button" class="gp-chip" data-cat="corporate">Corporate ATS</button>
            <button type="button" class="gp-chip" data-cat="letters">SOP &amp; Letters</button>
            <button type="button" class="gp-chip" data-cat="layout">Layout Tweaks</button>
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
        <button type="button" class="btn-use-prompt" data-use-prompt="${idx}" title="Click to insert into Vibe Agent chat">
          <i class="fa-solid fa-arrow-turn-down"></i> Use Prompt
        </button>
      </div>
      <h4 class="gp-prompt-title">${escapeHtml(item.title)}</h4>
      <p class="gp-prompt-text">"${escapeHtml(item.prompt)}"</p>
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

    // Use prompt buttons
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-use-prompt]');
      if (btn) {
        const idx = parseInt(btn.getAttribute('data-use-prompt'), 10);
        const item = PROMPT_LIBRARY[idx];
        if (item) {
          this.onSelectPrompt(item.prompt);
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
        p.prompt.toLowerCase().includes(this.searchQuery) ||
        p.categoryLabel.toLowerCase().includes(this.searchQuery);
      return matchesCat && matchesQuery;
    });

    listEl.innerHTML = renderPromptsListHtml(filtered);
  }
}

import { escapeHtml, sanitizeUrl } from '../security/index.js';

export const LINK_PLATFORMS = [
  {
    key: 'scholar',
    label: 'Google Scholar',
    icon: 'fa-brands fa-google-scholar',
    color: '#4285f4',
    category: 'academic',
    placeholder: 'https://scholar.google.com/citations?user=...'
  },
  {
    key: 'orcid',
    label: 'ORCID',
    icon: 'fa-brands fa-orcid',
    color: '#a6ce39',
    category: 'academic',
    placeholder: 'https://orcid.org/0000-0000-0000-0000'
  },
  {
    key: 'researchgate',
    label: 'ResearchGate',
    icon: 'fa-brands fa-researchgate',
    color: '#00ccbb',
    category: 'academic',
    placeholder: 'https://www.researchgate.net/profile/...'
  },
  {
    key: 'osf',
    label: 'OSF Protocol',
    icon: 'fa-solid fa-flask',
    color: '#2185d0',
    category: 'academic',
    placeholder: 'https://doi.org/10.17605/OSF.IO/...'
  },
  {
    key: 'pubmed',
    label: 'PubMed',
    icon: 'fa-solid fa-book-medical',
    color: '#3277b3',
    category: 'academic',
    placeholder: 'https://pubmed.ncbi.nlm.nih.gov/?term=...'
  },
  {
    key: 'scopus',
    label: 'Scopus Author ID',
    icon: 'fa-solid fa-atom',
    color: '#ff6c00',
    category: 'academic',
    placeholder: 'https://www.scopus.com/authid/detail.uri?authorId=...'
  },
  {
    key: 'github',
    label: 'GitHub',
    icon: 'fa-brands fa-github',
    color: '#24292f',
    category: 'code',
    placeholder: 'https://github.com/username'
  },
  {
    key: 'kaggle',
    label: 'Kaggle',
    icon: 'fa-brands fa-kaggle',
    color: '#20beff',
    category: 'code',
    placeholder: 'https://www.kaggle.com/username'
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'fa-brands fa-linkedin',
    color: '#0a66c2',
    category: 'social',
    placeholder: 'https://linkedin.com/in/username'
  },
  {
    key: 'googleSites',
    label: 'Google Sites',
    icon: 'fa-solid fa-globe',
    color: '#0f9d58',
    category: 'academic',
    placeholder: 'https://sites.google.com/view/username'
  },
  {
    key: 'personalWebsite',
    label: 'Personal Website',
    icon: 'fa-solid fa-link',
    color: '#0d9488',
    category: 'web',
    placeholder: 'https://username.github.io'
  },
  {
    key: 'gmail',
    label: 'Gmail / Email',
    icon: 'fa-solid fa-envelope',
    color: '#ea4335',
    category: 'contact',
    placeholder: 'mailto:name@example.com'
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: 'fa-brands fa-whatsapp',
    color: '#25d366',
    category: 'contact',
    placeholder: 'https://wa.me/number'
  },
  {
    key: 'twitterX',
    label: 'X / Twitter',
    icon: 'fa-brands fa-x-twitter',
    color: '#1da1f2',
    category: 'social',
    placeholder: 'https://x.com/username'
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'fa-brands fa-facebook',
    color: '#1877f2',
    category: 'social',
    placeholder: 'https://facebook.com/username'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'fa-brands fa-instagram',
    color: '#e4405f',
    category: 'social',
    placeholder: 'https://instagram.com/username'
  }
];

export function getLinkPlatform(key) {
  return LINK_PLATFORMS.find((p) => p.key === key) || null;
}

export function normalizeLinks(rawLinks) {
  if (!rawLinks || typeof rawLinks !== 'object') return {};
  const normalized = { ...rawLinks };
  if (!Array.isArray(normalized.custom)) {
    normalized.custom = [];
  }
  return normalized;
}

export function renderLinksEditorHtml(links = {}, visibilityConfig = {}) {
  const norm = normalizeLinks(links);

  const platformsHtml = LINK_PLATFORMS.map((p, idx) => {
    const val = norm[p.key] || '';
    const showInPortfolio = visibilityConfig[`portfolio_${p.key}`] !== false;
    const showInCv = visibilityConfig[`cv_${p.key}`] !== false;

    return `
      <div class="link-item-row" data-drag-item="link" data-link-key="${p.key}" draggable="true">
        <div class="drag-handle" data-drag-handle="true" title="Drag to reorder">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>
        <div class="link-icon-badge" style="color: ${p.color};">
          <i class="${p.icon}"></i>
        </div>
        <div class="link-field-wrap">
          <label class="link-label" for="link-${p.key}">${escapeHtml(p.label)}</label>
          <input type="url" id="link-${p.key}" class="form-input link-url-input"
            data-link-field="${p.key}"
            value="${escapeHtml(val)}"
            placeholder="${escapeHtml(p.placeholder)}">
        </div>
        <div class="link-visibility-toggles">
          <label class="toggle-pill" title="Show on Portfolio">
            <input type="checkbox" data-vis-target="portfolio" data-vis-key="${p.key}" ${showInPortfolio ? 'checked' : ''}>
            <span>Port</span>
          </label>
          <label class="toggle-pill" title="Show on CV / Resume">
            <input type="checkbox" data-vis-target="cv" data-vis-key="${p.key}" ${showInCv ? 'checked' : ''}>
            <span>CV</span>
          </label>
        </div>
        <div class="link-actions">
          <button type="button" class="btn-icon-subtle" data-action="move-up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" class="btn-icon-subtle" data-action="move-down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
        </div>
      </div>
    `;
  }).join('\n');

  // Custom Links
  const customList = Array.isArray(norm.custom) ? norm.custom : [];
  const customLinksHtml = customList.map((custom, cIdx) => {
    return `
      <div class="link-item-row custom-link-row" data-drag-item="custom-link" data-custom-index="${cIdx}" draggable="true">
        <div class="drag-handle" data-drag-handle="true">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>
        <div class="link-icon-badge custom-icon-badge">
          <i class="${escapeHtml(custom.icon || 'fa-solid fa-globe')}"></i>
        </div>
        <div class="link-field-wrap custom-fields">
          <input type="text" class="form-input custom-label-input" placeholder="Title (e.g., Blog)" value="${escapeHtml(custom.label || '')}" data-custom-label="${cIdx}">
          <input type="url" class="form-input custom-url-input" placeholder="https://..." value="${escapeHtml(custom.url || '')}" data-custom-url="${cIdx}">
        </div>
        <div class="link-actions">
          <button type="button" class="btn-icon-danger" data-action="delete-custom-link" data-index="${cIdx}" title="Delete Link">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('\n');

  return `
    <div class="links-hub-manager">
      <div class="links-hub-header">
        <span class="hub-title"><i class="fa-solid fa-share-nodes"></i> Social &amp; Research Links Hub</span>
        <span class="hub-sub">Configure links once; toggle independent visibility for Web Portfolio vs. ATS CV</span>
      </div>
      <div class="links-list-container" id="standard-links-container">
        ${platformsHtml}
      </div>
      <div class="custom-links-section">
        <div class="custom-links-header">
          <span>Custom Portals &amp; Links</span>
          <button type="button" class="btn-sm btn-outline" id="btn-add-custom-link">
            <i class="fa-solid fa-plus"></i> Add Link
          </button>
        </div>
        <div class="custom-links-container" id="custom-links-container">
          ${customLinksHtml || '<p class="empty-hint">No custom links added yet.</p>'}
        </div>
      </div>
    </div>
  `.trim();
}

import { PORTFOLIO_CATALOG, getTemplateById } from '../../core/templates/portfolio-catalog.js';
import { fetchLiveMotherShowcase, getMotherShowcaseFallback } from '../../core/data/mother-showcase.js';
import { renderPortfolioHtml } from '../../core/engines/portfolio-engine.js';

let activeProfile = getMotherShowcaseFallback();
let activeTemplateId = 'acad-flagship';
let activeViewport = 'laptop';
let activeCategory = 'all';
let activeTheme = 'dark';
let searchQuery = '';

const dom = {
  templateList: document.getElementById('template-items-container'),
  previewIframe: document.getElementById('preview-iframe'),
  deviceWrapper: document.getElementById('device-wrapper'),
  labelActiveTemplate: document.getElementById('label-active-template'),
  labelActiveSize: document.getElementById('label-active-size'),
  syncLabel: document.getElementById('sync-status-label'),
  searchInput: document.getElementById('catalog-search'),
  catTabs: document.querySelectorAll('.cat-tab'),
  viewportBtns: document.querySelectorAll('.viewport-btn'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  btnPopout: document.getElementById('btn-popout'),
  btnExportHtml: document.getElementById('btn-export-html'),
  btnRefresh: document.getElementById('btn-refresh-preview')
};

function renderCatalog() {
  const filtered = PORTFOLIO_CATALOG.filter((tpl) => {
    const matchesCat = activeCategory === 'all' || tpl.category === activeCategory;
    const matchesSearch = !searchQuery ||
      tpl.name.toLowerCase().includes(searchQuery) ||
      tpl.badge.toLowerCase().includes(searchQuery) ||
      tpl.description.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  dom.templateList.innerHTML = filtered.map((tpl) => {
    const isActive = tpl.id === activeTemplateId;
    return `
      <div class="template-card ${isActive ? 'active' : ''}" data-id="${tpl.id}" role="button" tabindex="0">
        <div class="tpl-header">
          <span class="tpl-badge ${tpl.isRecommended ? 'rec' : ''}">${tpl.badge}</span>
          ${tpl.isRecommended ? `<span style="font-size: 0.65rem; color: #f59e0b; font-weight: 700;">★ TOP PICK</span>` : ''}
        </div>
        <div class="tpl-title">${tpl.name}</div>
        <div class="tpl-desc">${tpl.description}</div>
      </div>
    `;
  }).join('');

  dom.templateList.querySelectorAll('.template-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      selectTemplate(id);
    });
  });
}

function selectTemplate(templateId) {
  activeTemplateId = templateId;
  const tpl = getTemplateById(templateId);
  dom.labelActiveTemplate.textContent = tpl.name;
  renderCatalog();
  updatePreview();
}

function setViewport(viewport) {
  activeViewport = viewport;
  dom.viewportBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-viewport') === viewport);
  });

  dom.deviceWrapper.className = `preview-device-wrapper viewport-${viewport}`;
  if (viewport === 'laptop') {
    dom.labelActiveSize.textContent = '1440 × auto';
  } else if (viewport === 'tablet') {
    dom.labelActiveSize.textContent = '980 × auto (Tablet / Phone Desktop)';
  } else if (viewport === 'mobile') {
    dom.labelActiveSize.textContent = '390 × 844 (Mobile)';
  }
}

function updatePreview() {
  if (!activeProfile) return;
  const markup = renderPortfolioHtml(activeProfile, {
    templateId: activeTemplateId,
    theme: activeTheme
  });
  dom.previewIframe.srcdoc = markup;
}

function exportCurrentHtml() {
  const markup = renderPortfolioHtml(activeProfile, {
    templateId: activeTemplateId,
    theme: activeTheme
  });
  const blob = new Blob([markup], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeTemplateId}-portfolio.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPopout() {
  const markup = renderPortfolioHtml(activeProfile, {
    templateId: activeTemplateId,
    theme: activeTheme
  });
  const newWin = window.open('', '_blank');
  if (newWin) {
    newWin.document.open();
    newWin.document.write(markup);
    newWin.document.close();
  }
}

function initEventListeners() {
  dom.catTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      dom.catTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.getAttribute('data-category');
      renderCatalog();
    });
  });

  dom.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderCatalog();
  });

  dom.viewportBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      setViewport(btn.getAttribute('data-viewport'));
    });
  });

  dom.btnThemeToggle.addEventListener('click', () => {
    activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', activeTheme);
    updatePreview();
  });

  dom.btnExportHtml.addEventListener('click', exportCurrentHtml);
  dom.btnPopout.addEventListener('click', openPopout);
  dom.btnRefresh.addEventListener('click', updatePreview);
}

async function init() {
  renderCatalog();
  updatePreview();
  initEventListeners();

  try {
    const liveProfile = await fetchLiveMotherShowcase(3000);
    if (liveProfile) {
      activeProfile = liveProfile;
      dom.syncLabel.textContent = 'Mother Live Sync Active';
      updatePreview();
    }
  } catch {
    dom.syncLabel.textContent = 'Offline Fallback Snapshot';
  }
}

init();

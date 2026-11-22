import { PORTFOLIO_CATALOG, getTemplateById } from '../../core/templates/portfolio-catalog.js';
import { CV_CATALOG, getCvTemplateById } from '../../core/templates/cv-catalog.js';
import { fetchLiveMotherShowcase, getMotherShowcaseFallback } from '../../core/data/mother-showcase.js';
import { renderPortfolioHtml } from '../../core/engines/portfolio-engine.js';
import { renderCvHtml } from '../../core/engines/cv-engine.js';
import { generateDocxBlob } from '../../core/exporters/docx-exporter.js';
import { printCv } from '../../core/exporters/pdf-print-exporter.js';
import { runAtsXRay } from '../../core/engines/ats-xray.js';
import { getCvProfiles, syncCvToMaster, pullMasterToCv } from '../../core/engines/cv-profile-manager.js';

let activeProfile = getMotherShowcaseFallback();
let studioMode = 'portfolio'; // 'portfolio' | 'cv'
let activePortfolioTemplateId = 'acad-flagship';
let activeCvTemplateId = 'cv-acad-flagship';
let activeCvProfileId = 'cv-acad-flagship-profile';
let showQr = true;
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
  categoryTabsContainer: document.getElementById('category-tabs'),
  viewportBtns: document.querySelectorAll('.viewport-btn'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  btnPopout: document.getElementById('btn-popout'),
  btnExportHtml: document.getElementById('btn-export-html'),
  btnRefresh: document.getElementById('btn-refresh-preview'),
  tabModePortfolio: document.getElementById('tab-mode-portfolio'),
  tabModeCv: document.getElementById('tab-mode-cv'),
  cvHeaderTools: document.getElementById('cv-header-tools'),
  selectCvProfile: document.getElementById('select-cv-profile'),
  btnToggleQr: document.getElementById('btn-toggle-qr'),
  btnToggleXray: document.getElementById('btn-toggle-xray'),
  btnPrintPdf: document.getElementById('btn-print-pdf'),
  btnExportDocx: document.getElementById('btn-export-docx'),
  btnSyncToMaster: document.getElementById('btn-sync-to-master'),
  btnPullFromMaster: document.getElementById('btn-pull-from-master'),
  xrayModal: document.getElementById('xray-modal'),
  btnCloseXray: document.getElementById('btn-close-xray'),
  xrayScoreBadge: document.getElementById('xray-score-badge'),
  xrayChecksList: document.getElementById('xray-checks-list'),
  xrayWarningsList: document.getElementById('xray-warnings-list'),
  xrayRawText: document.getElementById('xray-raw-text')
};

function renderCategoryTabs() {
  if (studioMode === 'portfolio') {
    dom.categoryTabsContainer.innerHTML = `
      <button type="button" class="cat-tab ${activeCategory === 'all' ? 'active' : ''}" data-category="all">All (31)</button>
      <button type="button" class="cat-tab ${activeCategory === 'academic' ? 'active' : ''}" data-category="academic">Academic (10)</button>
      <button type="button" class="cat-tab ${activeCategory === 'tech' ? 'active' : ''}" data-category="tech">Tech &amp; AI (10)</button>
      <button type="button" class="cat-tab ${activeCategory === 'corporate' ? 'active' : ''}" data-category="corporate">Corporate (10)</button>
      <button type="button" class="cat-tab ${activeCategory === 'custom' ? 'active' : ''}" data-category="custom">Custom (1)</button>
    `;
  } else {
    dom.categoryTabsContainer.innerHTML = `
      <button type="button" class="cat-tab ${activeCategory === 'all' ? 'active' : ''}" data-category="all">All (30)</button>
      <button type="button" class="cat-tab ${activeCategory === 'academic' ? 'active' : ''}" data-category="academic">Academic CVs (10)</button>
      <button type="button" class="cat-tab ${activeCategory === 'corporate' ? 'active' : ''}" data-category="corporate">Corporate (10)</button>
      <button type="button" class="cat-tab ${activeCategory === 'tech' ? 'active' : ''}" data-category="tech">Tech &amp; Data (10)</button>
    `;
  }

  dom.categoryTabsContainer.querySelectorAll('.cat-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      dom.categoryTabsContainer.querySelectorAll('.cat-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.getAttribute('data-category');
      renderCatalog();
    });
  });
}

function renderCvProfileDropdown() {
  const profiles = getCvProfiles(activeProfile);
  dom.selectCvProfile.innerHTML = profiles.map((p) => `
    <option value="${p.id}" ${p.id === activeCvProfileId ? 'selected' : ''}>
      ${p.name}
    </option>
  `).join('');
}

function renderCatalog() {
  const catalog = studioMode === 'portfolio' ? PORTFOLIO_CATALOG : CV_CATALOG;
  const activeId = studioMode === 'portfolio' ? activePortfolioTemplateId : activeCvTemplateId;

  const filtered = catalog.filter((tpl) => {
    const matchesCat = activeCategory === 'all' || tpl.category === activeCategory;
    const matchesSearch = !searchQuery ||
      tpl.name.toLowerCase().includes(searchQuery) ||
      tpl.badge.toLowerCase().includes(searchQuery) ||
      tpl.description.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  dom.templateList.innerHTML = filtered.map((tpl) => {
    const isActive = tpl.id === activeId;
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
  if (studioMode === 'portfolio') {
    activePortfolioTemplateId = templateId;
    const tpl = getTemplateById(templateId);
    dom.labelActiveTemplate.textContent = tpl.name;
  } else {
    activeCvTemplateId = templateId;
    const tpl = getCvTemplateById(templateId);
    dom.labelActiveTemplate.textContent = tpl.name;
  }
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

  if (studioMode === 'portfolio') {
    const markup = renderPortfolioHtml(activeProfile, {
      templateId: activePortfolioTemplateId,
      theme: activeTheme
    });
    dom.previewIframe.srcdoc = markup;
  } else {
    const cvProfiles = getCvProfiles(activeProfile);
    const activeCvProf = cvProfiles.find((p) => p.id === activeCvProfileId) || cvProfiles[0];
    const markup = renderCvHtml(activeProfile, {
      templateId: activeCvTemplateId,
      showQr,
      includedSections: activeCvProf?.includedSections
    });
    dom.previewIframe.srcdoc = markup;
  }
}

function switchStudioMode(mode) {
  studioMode = mode;
  activeCategory = 'all';

  if (mode === 'portfolio') {
    dom.tabModePortfolio.classList.add('active');
    dom.tabModeCv.classList.remove('active');
    dom.cvHeaderTools.style.display = 'none';
    dom.btnExportHtml.style.display = 'inline-flex';
    dom.btnSyncToMaster.style.display = 'none';
    dom.btnPullFromMaster.style.display = 'none';
    const tpl = getTemplateById(activePortfolioTemplateId);
    dom.labelActiveTemplate.textContent = tpl.name;
  } else {
    dom.tabModePortfolio.classList.remove('active');
    dom.tabModeCv.classList.add('active');
    dom.cvHeaderTools.style.display = 'flex';
    dom.btnExportHtml.style.display = 'none';
    dom.btnSyncToMaster.style.display = 'inline-flex';
    dom.btnPullFromMaster.style.display = 'inline-flex';
    renderCvProfileDropdown();
    const tpl = getCvTemplateById(activeCvTemplateId);
    dom.labelActiveTemplate.textContent = tpl.name;
  }

  renderCategoryTabs();
  renderCatalog();
  updatePreview();
}

function exportCurrentDocument() {
  if (studioMode === 'portfolio') {
    const markup = renderPortfolioHtml(activeProfile, {
      templateId: activePortfolioTemplateId,
      theme: activeTheme
    });
    const blob = new Blob([markup], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePortfolioTemplateId}-portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    exportDocx();
  }
}

function exportDocx() {
  const buf = generateDocxBlob(activeProfile);
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeCvTemplateId}-${(activeProfile.identity?.shortName || 'CV')}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPopout() {
  const markup = studioMode === 'portfolio'
    ? renderPortfolioHtml(activeProfile, { templateId: activePortfolioTemplateId, theme: activeTheme })
    : renderCvHtml(activeProfile, { templateId: activeCvTemplateId, showQr });

  const newWin = window.open('', '_blank');
  if (newWin) {
    newWin.document.open();
    newWin.document.write(markup);
    newWin.document.close();
  }
}

function openAtsXRayModal() {
  const report = runAtsXRay(activeProfile);
  dom.xrayScoreBadge.textContent = `${report.score}/100 ATS Score`;

  dom.xrayChecksList.innerHTML = report.checks.map((chk) => `
    <div class="xray-check-row">
      <i class="fa-solid ${chk.pass ? 'fa-circle-check xray-check-pass' : 'fa-circle-xmark xray-check-fail'} xray-check-icon"></i>
      <div>
        <strong>${chk.label}</strong>
        <div style="font-size: 0.72rem; color: var(--text-muted);">${chk.message}</div>
      </div>
    </div>
  `).join('');

  if (report.warnings.length) {
    dom.xrayWarningsList.innerHTML = report.warnings.map((w) => `
      <div class="xray-warning-box"><i class="fa-solid fa-triangle-exclamation"></i> ${w}</div>
    `).join('');
  } else {
    dom.xrayWarningsList.innerHTML = `
      <div style="font-size: 0.75rem; color: #10b981;"><i class="fa-solid fa-check"></i> Zero structural parsing warnings detected.</div>
    `;
  }

  dom.xrayRawText.textContent = report.rawText;
  dom.xrayModal.style.display = 'flex';
  dom.xrayModal.setAttribute('aria-hidden', 'false');
}

function closeAtsXRayModal() {
  dom.xrayModal.style.display = 'none';
  dom.xrayModal.setAttribute('aria-hidden', 'true');
}

function initEventListeners() {
  dom.tabModePortfolio.addEventListener('click', () => switchStudioMode('portfolio'));
  dom.tabModeCv.addEventListener('click', () => switchStudioMode('cv'));

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

  dom.btnExportHtml.addEventListener('click', exportCurrentDocument);
  dom.btnPopout.addEventListener('click', openPopout);
  dom.btnRefresh.addEventListener('click', updatePreview);

  // CV Studio tools
  dom.selectCvProfile.addEventListener('change', (e) => {
    activeCvProfileId = e.target.value;
    const cvProfiles = getCvProfiles(activeProfile);
    const prof = cvProfiles.find((p) => p.id === activeCvProfileId);
    if (prof && prof.templateId) {
      activeCvTemplateId = prof.templateId;
      const tpl = getCvTemplateById(activeCvTemplateId);
      dom.labelActiveTemplate.textContent = tpl.name;
      renderCatalog();
    }
    updatePreview();
  });

  dom.btnToggleQr.addEventListener('click', () => {
    showQr = !showQr;
    dom.btnToggleQr.classList.toggle('active', showQr);
    updatePreview();
  });

  dom.btnToggleXray.addEventListener('click', openAtsXRayModal);
  dom.btnCloseXray.addEventListener('click', closeAtsXRayModal);
  dom.xrayModal.addEventListener('click', (e) => {
    if (e.target === dom.xrayModal) closeAtsXRayModal();
  });

  dom.btnPrintPdf.addEventListener('click', () => {
    printCv(dom.previewIframe);
  });

  dom.btnExportDocx.addEventListener('click', exportDocx);

  dom.btnSyncToMaster.addEventListener('click', () => {
    syncCvToMaster(activeProfile, activeCvProfileId);
    alert('Changes synchronized to master portfolio successfully!');
  });

  dom.btnPullFromMaster.addEventListener('click', () => {
    pullMasterToCv(activeProfile, activeCvProfileId);
    updatePreview();
    alert('Latest master portfolio data pulled into CV profile!');
  });
}

async function init() {
  renderCategoryTabs();
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

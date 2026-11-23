import { PORTFOLIO_CATALOG, getTemplateById } from '../../core/templates/portfolio-catalog.js';
import { CV_CATALOG, getCvTemplateById } from '../../core/templates/cv-catalog.js';
import { fetchLiveMotherShowcase, getMotherShowcaseFallback } from '../../core/data/mother-showcase.js';
import { renderPortfolioHtml } from '../../core/engines/portfolio-engine.js';
import { renderCvHtml } from '../../core/engines/cv-engine.js';
import { generateDocxBlob } from '../../core/exporters/docx-exporter.js';
import { printCv } from '../../core/exporters/pdf-print-exporter.js';
import { runAtsXRay } from '../../core/engines/ats-xray.js';
import { getCvProfiles, syncCvToMaster, pullMasterToCv } from '../../core/engines/cv-profile-manager.js';
import { LETTER_MODES, getLetterModeById } from '../../core/engines/letter-studio.js';
import { assembleOfflineDraft, verifyLetterAuthenticity } from '../../core/engines/letter-prompts.js';
import {
  exportLetterDocx,
  exportLetterMarkdown,
  exportLetterPlainText,
  renderLetterHtml
} from '../../core/exporters/letter-exporter.js';
import {
  getWordCountProgress,
  loadDrafts,
  saveDraft,
  deleteDraft,
  createNewDraft
} from '../../core/ui/letter-editor.js';
import {
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
  filterAndSortNotes,
  sendNoteToTarget,
  formatNoteDate
} from '../../core/ui/notes-scratchpad.js';
import { loadPrivateVault, savePrivateVault } from '../../core/storage/vault-storage.js';
import { VisualEditorController } from '../../core/ui/visual-editor.js';
import { LivePreviewController } from '../../core/ui/live-preview.js';

let activeProfile = getMotherShowcaseFallback();
let studioMode = 'portfolio'; // 'portfolio' | 'cv' | 'letters' | 'notes' | 'editor'
let visualEditor = null;
let editorLivePreview = null;
let activePortfolioTemplateId = 'acad-flagship';
let activeCvTemplateId = 'cv-acad-flagship';
let activeCvProfileId = 'cv-acad-flagship-profile';
let activeLetterModeId = 'sop';
let activeLetterDraftId = null;
let webNotes = [];
let activeWebNoteId = null;
let activeWebNoteTag = 'all';
let webNotesSearch = '';
let showQr = true;
let includeLetterhead = true;
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
  tabModeLetters: document.getElementById('tab-mode-letters'),
  tabModeNotes: document.getElementById('tab-mode-notes'),
  tabModeEditor: document.getElementById('tab-mode-editor'),
  editorWorkspace: document.getElementById('editor-workspace'),
  visualEditorContainer: document.getElementById('visual-editor-container'),
  editorPreviewIframe: document.getElementById('editor-preview-iframe'),
  editorDeviceFrame: document.getElementById('editor-device-frame'),
  editorAutoSaveStatus: document.getElementById('editor-auto-save-status'),
  btnEditorPopout: document.getElementById('btn-editor-popout'),
  btnToggleEditorForm: document.getElementById('btn-toggle-editor-form'),
  btnToggleEditorPreview: document.getElementById('btn-toggle-editor-preview'),
  editorSidebar: document.getElementById('editor-sidebar'),
  editorPreviewStage: document.getElementById('editor-preview-stage'),
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
  xrayRawText: document.getElementById('xray-raw-text'),

  // Workspace sections
  catalogSidebar: document.getElementById('catalog-sidebar'),
  workbenchCanvas: document.getElementById('workbench-canvas'),
  lettersWorkspace: document.getElementById('letters-workspace'),
  notesWorkspace: document.getElementById('notes-workspace'),

  // Notes Scratchpad Elements
  btnWebNewNote: document.getElementById('btn-web-new-note'),
  webSearchNotes: document.getElementById('web-search-notes'),
  notesTagChips: document.querySelectorAll('#notes-tag-chips .tag-chip'),
  webNotesList: document.getElementById('web-notes-list'),
  webNoteTitle: document.getElementById('web-note-title'),
  webNoteTag: document.getElementById('web-note-tag'),
  webNoteContent: document.getElementById('web-note-content'),
  btnWebNotePin: document.getElementById('btn-web-note-pin'),
  btnWebNoteSendSop: document.getElementById('btn-web-note-send-sop'),
  btnWebNoteDelete: document.getElementById('btn-web-note-delete'),
  webNoteTimestamp: document.getElementById('web-note-timestamp'),

  // Letters Studio Header Tools
  letterHeaderTools: document.getElementById('letter-header-tools'),
  btnLetterVerify: document.getElementById('btn-letter-verify'),
  btnLetterCopy: document.getElementById('btn-letter-copy'),
  btnLetterExportMd: document.getElementById('btn-letter-export-md'),
  btnLetterPrintPdf: document.getElementById('btn-letter-print-pdf'),
  btnLetterExportDocx: document.getElementById('btn-letter-export-docx'),

  // Letters Sidebar Controls
  letterModeChips: document.querySelectorAll('.mode-chip'),
  letterModeDesc: document.getElementById('letter-mode-desc'),
  targetInst: document.getElementById('target-inst'),
  targetProgram: document.getElementById('target-program'),
  targetProfessor: document.getElementById('target-professor'),
  targetFocus: document.getElementById('target-focus'),
  targetNotes: document.getElementById('target-notes'),
  btnAssembleDraft: document.getElementById('btn-assemble-draft'),
  statsWordCounter: document.getElementById('stats-word-counter'),
  statsReadingTime: document.getElementById('stats-reading-time'),
  statsProgressBar: document.getElementById('stats-progress-bar'),
  statsCharCounter: document.getElementById('stats-char-counter'),
  statsStatusTag: document.getElementById('stats-status-tag'),
  draftsList: document.getElementById('drafts-list'),
  btnNewDraft: document.getElementById('btn-new-draft'),
  btnSaveDraft: document.getElementById('btn-save-draft'),
  checkLetterhead: document.getElementById('check-letterhead'),

  // Letters Canvas & Sheet
  lettersCanvas: document.getElementById('letters-canvas'),
  lettersSidebar: document.getElementById('letters-sidebar'),
  letterActiveBadge: document.getElementById('letter-active-badge'),
  letterSaveIndicator: document.getElementById('letter-save-indicator'),
  sheetLetterhead: document.getElementById('sheet-letterhead'),
  sheetSenderName: document.getElementById('sheet-sender-name'),
  sheetSenderSub: document.getElementById('sheet-sender-sub'),
  sheetSenderContact: document.getElementById('sheet-sender-contact'),
  letterInputDate: document.getElementById('letter-input-date'),
  letterInputRecipient: document.getElementById('letter-input-recipient'),
  letterInputSubject: document.getElementById('letter-input-subject'),
  letterInputBody: document.getElementById('letter-input-body'),
  letterInputSignoff: document.getElementById('letter-input-signoff'),
  aiChips: document.querySelectorAll('.btn-ai-chip'),

  // Letters Mobile Subnav
  btnSubnavControls: document.getElementById('btn-subnav-controls'),
  btnSubnavEditor: document.getElementById('btn-subnav-editor'),

  // Verification Modal
  letterVerifyModal: document.getElementById('letter-verify-modal'),
  btnCloseLetterVerify: document.getElementById('btn-close-letter-verify'),
  verifyScoreBadge: document.getElementById('verify-score-badge'),
  verifyMentionsList: document.getElementById('verify-mentions-list'),
  verifyWarningsList: document.getElementById('verify-warnings-list'),
  verifyPlaceholdersList: document.getElementById('verify-placeholders-list')
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
  } else if (studioMode === 'cv') {
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
  } else if (viewport === 'a4') {
    dom.labelActiveSize.textContent = '794 × 1123 (CV A4)';
  }

  if (editorLivePreview) {
    editorLivePreview.setViewport(viewport);
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
  } else if (studioMode === 'cv') {
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

  dom.tabModePortfolio.classList.toggle('active', mode === 'portfolio');
  dom.tabModeCv.classList.toggle('active', mode === 'cv');
  dom.tabModeLetters.classList.toggle('active', mode === 'letters');
  dom.tabModeNotes.classList.toggle('active', mode === 'notes');
  if (dom.tabModeEditor) dom.tabModeEditor.classList.toggle('active', mode === 'editor');

  if (mode === 'portfolio') {
    dom.catalogSidebar.style.display = 'flex';
    dom.workbenchCanvas.style.display = 'flex';
    dom.lettersWorkspace.style.display = 'none';
    dom.notesWorkspace.style.display = 'none';
    if (dom.editorWorkspace) dom.editorWorkspace.style.display = 'none';

    dom.cvHeaderTools.style.display = 'none';
    dom.letterHeaderTools.style.display = 'none';
    dom.btnExportHtml.style.display = 'inline-flex';
    dom.btnSyncToMaster.style.display = 'none';
    dom.btnPullFromMaster.style.display = 'none';

    const tpl = getTemplateById(activePortfolioTemplateId);
    dom.labelActiveTemplate.textContent = tpl.name;
    renderCategoryTabs();
    renderCatalog();
    updatePreview();
  } else if (mode === 'cv') {
    dom.catalogSidebar.style.display = 'flex';
    dom.workbenchCanvas.style.display = 'flex';
    dom.lettersWorkspace.style.display = 'none';
    dom.notesWorkspace.style.display = 'none';
    if (dom.editorWorkspace) dom.editorWorkspace.style.display = 'none';

    dom.cvHeaderTools.style.display = 'flex';
    dom.letterHeaderTools.style.display = 'none';
    dom.btnExportHtml.style.display = 'none';
    dom.btnSyncToMaster.style.display = 'inline-flex';
    dom.btnPullFromMaster.style.display = 'inline-flex';

    renderCvProfileDropdown();
    const tpl = getCvTemplateById(activeCvTemplateId);
    dom.labelActiveTemplate.textContent = tpl.name;
    renderCategoryTabs();
    renderCatalog();
    updatePreview();
  } else if (mode === 'letters') {
    dom.catalogSidebar.style.display = 'none';
    dom.workbenchCanvas.style.display = 'none';
    dom.lettersWorkspace.style.display = 'flex';
    dom.notesWorkspace.style.display = 'none';
    if (dom.editorWorkspace) dom.editorWorkspace.style.display = 'none';

    dom.cvHeaderTools.style.display = 'none';
    dom.letterHeaderTools.style.display = 'flex';
    dom.btnExportHtml.style.display = 'none';
    dom.btnSyncToMaster.style.display = 'none';
    dom.btnPullFromMaster.style.display = 'none';

    syncSenderDetailsFromProfile();
    if (!dom.letterInputBody.value) {
      assembleCurrentLetterDraft();
    }
    updateLetterStats();
    renderDraftsList();
  } else if (mode === 'notes') {
    dom.catalogSidebar.style.display = 'none';
    dom.workbenchCanvas.style.display = 'none';
    dom.lettersWorkspace.style.display = 'none';
    dom.notesWorkspace.style.display = 'flex';
    if (dom.editorWorkspace) dom.editorWorkspace.style.display = 'none';

    dom.cvHeaderTools.style.display = 'none';
    dom.letterHeaderTools.style.display = 'none';
    dom.btnExportHtml.style.display = 'none';
    dom.btnSyncToMaster.style.display = 'none';
    dom.btnPullFromMaster.style.display = 'none';

    dom.labelActiveTemplate.textContent = 'Idea Scratchpad (Private Vault)';
    loadWebNotesFromVault();
  } else if (mode === 'editor') {
    dom.catalogSidebar.style.display = 'none';
    dom.workbenchCanvas.style.display = 'none';
    dom.lettersWorkspace.style.display = 'none';
    dom.notesWorkspace.style.display = 'none';
    if (dom.editorWorkspace) dom.editorWorkspace.style.display = 'flex';

    dom.cvHeaderTools.style.display = 'none';
    dom.letterHeaderTools.style.display = 'none';
    dom.btnExportHtml.style.display = 'none';
    dom.btnSyncToMaster.style.display = 'none';
    dom.btnPullFromMaster.style.display = 'none';

    dom.labelActiveTemplate.textContent = 'No-Code Visual Editor & Real-Time Live Preview';
    initVisualEditor();
  }
}

function initVisualEditor() {
  if (!editorLivePreview) {
    editorLivePreview = new LivePreviewController({
      iframe: dom.editorPreviewIframe,
      wrapper: dom.editorDeviceFrame,
      viewport: activeViewport,
      mode: 'portfolio',
      templateId: activePortfolioTemplateId,
      theme: activeTheme,
      profile: activeProfile
    });
  } else {
    editorLivePreview.setProfile(activeProfile);
    editorLivePreview.setTemplateId(activePortfolioTemplateId);
    editorLivePreview.setViewport(activeViewport);
  }

  if (!visualEditor) {
    visualEditor = new VisualEditorController({
      profile: activeProfile,
      container: dom.visualEditorContainer,
      onChange: (updatedProfile) => {
        activeProfile = updatedProfile;
        if (editorLivePreview) {
          editorLivePreview.setProfile(activeProfile);
        }
        if (studioMode === 'portfolio' || studioMode === 'cv') {
          updatePreview();
        }
      },
      onStatusChange: (status) => {
        if (dom.editorAutoSaveStatus) {
          if (status === 'saving') {
            dom.editorAutoSaveStatus.className = 'auto-save-status-badge saving';
            dom.editorAutoSaveStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
          } else {
            dom.editorAutoSaveStatus.className = 'auto-save-status-badge saved';
            dom.editorAutoSaveStatus.innerHTML = '<i class="fa-solid fa-check"></i> Auto-Saved locally (2s)';
          }
        }
        if (dom.syncLabel) {
          dom.syncLabel.textContent = status === 'saving' ? 'Auto-Saving...' : 'Auto-Saved locally';
        }
      }
    });
    visualEditor.render();
  } else {
    visualEditor.setProfile(activeProfile);
  }

  if (editorLivePreview) {
    editorLivePreview.updateNow();
  }
}

async function loadWebNotesFromVault() {
  const vault = await loadPrivateVault();
  webNotes = Array.isArray(vault.ideaNotes) ? vault.ideaNotes : [];
  if (!webNotes.length) {
    const defaultNote = createNote({
      title: 'Nanoparticle Rabies Vaccine Meta-Analysis',
      tag: 'Research',
      pinned: true,
      content: 'OSF Registry DOI: 10.17605/OSF.IO/9AQS3. Focus on comparative immunological titers across chitosan vs liposomal carriers.'
    });
    webNotes.push(defaultNote);
    vault.ideaNotes = webNotes;
    await savePrivateVault(vault);
  }
  if (!activeWebNoteId && webNotes.length) {
    activeWebNoteId = webNotes[0].id;
  }
  renderWebNotesList();
  if (activeWebNoteId) openWebNote(activeWebNoteId);
}

function renderWebNotesList() {
  const filtered = filterAndSortNotes(webNotes, {
    query: webNotesSearch,
    tag: activeWebNoteTag
  });

  if (!filtered.length) {
    dom.webNotesList.innerHTML = `<div style="font-size:0.75rem; color:var(--text-dim); text-align:center; padding:16px 0;">No matching notes found. Click "+ New Note" to start writing.</div>`;
    return;
  }

  dom.webNotesList.innerHTML = filtered.map((n) => `
    <div class="web-note-item ${n.pinned ? 'pinned' : ''} ${n.id === activeWebNoteId ? 'active' : ''}" data-id="${n.id}">
      <div class="web-note-meta">
        <span class="web-note-tag-badge">${n.tag}</span>
        <span>${n.pinned ? '★ Pinned' : formatNoteDate(n.updatedAt)}</span>
      </div>
      <div class="web-note-title-text">${n.title || 'Untitled Note'}</div>
      <div class="web-note-snippet">${n.content ? n.content.replace(/\n/g, ' ') : 'Empty note content...'}</div>
    </div>
  `).join('');

  dom.webNotesList.querySelectorAll('.web-note-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      openWebNote(id);
    });
  });
}

function openWebNote(noteId) {
  activeWebNoteId = noteId;
  const note = webNotes.find((n) => n.id === noteId);
  if (!note) return;

  dom.webNoteTitle.value = note.title;
  dom.webNoteTag.value = note.tag;
  dom.webNoteContent.value = note.content;
  dom.btnWebNotePin.innerHTML = `<i class="fa-solid fa-thumbtack" style="color:${note.pinned ? '#f59e0b' : 'inherit'};"></i> ${note.pinned ? 'Pinned' : 'Pin'}`;
  dom.webNoteTimestamp.textContent = `Last updated: ${formatNoteDate(note.updatedAt)}`;

  dom.webNotesList.querySelectorAll('.web-note-item').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-id') === noteId);
  });
}

async function saveActiveWebNote() {
  if (!activeWebNoteId) return;
  const updates = {
    title: dom.webNoteTitle.value.trim() || 'Untitled Note',
    tag: dom.webNoteTag.value,
    content: dom.webNoteContent.value
  };

  webNotes = updateNote(webNotes, activeWebNoteId, updates);
  const vault = await loadPrivateVault();
  vault.ideaNotes = webNotes;
  await savePrivateVault(vault);
  renderWebNotesList();
}

function syncSenderDetailsFromProfile() {
  const identity = activeProfile?.identity || {};
  const education = (activeProfile?.education || [])[0] || {};

  dom.sheetSenderName.textContent = identity.fullName || 'Md. Nafizur Rahman';
  dom.sheetSenderSub.textContent = `${education.degree || 'Doctor of Veterinary Medicine (DVM)'} • ${education.institution || 'University of Rajshahi'}`;
  dom.sheetSenderContact.innerHTML = `
    <div>${identity.email || 'mdnafizurrahman8024@gmail.com'}</div>
    <div>${identity.location?.city || 'Rajshahi'}, ${identity.location?.country || 'Bangladesh'}</div>
    <div>${(activeProfile?.links?.personalWebsite || 'https://mdnafizurrahman8024.github.io/').replace('https://', '')}</div>
  `;

  if (!dom.letterInputDate.value) {
    dom.letterInputDate.value = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

function assembleCurrentLetterDraft() {
  const targetDetails = {
    institution: dom.targetInst.value.trim(),
    program: dom.targetProgram.value.trim(),
    professor: dom.targetProfessor.value.trim(),
    focusArea: dom.targetFocus.value.trim()
  };
  const personalNotes = dom.targetNotes.value.trim();

  const draft = assembleOfflineDraft(activeProfile, activeLetterModeId, targetDetails, personalNotes);

  dom.letterInputSubject.value = draft.subject;
  dom.letterInputRecipient.value = draft.salutation ? draft.salutation.replace('Dear ', '').replace(',', '') : 'Admissions Committee';
  dom.letterInputBody.value = draft.paragraphs.join('\n\n');
  dom.letterInputSignoff.value = draft.signoff;

  updateLetterStats();
}

function updateLetterStats() {
  const text = dom.letterInputBody.value;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const progress = getWordCountProgress(words, activeLetterModeId);

  dom.statsWordCounter.textContent = `${words} words`;
  dom.statsCharCounter.textContent = `${chars} chars`;
  dom.statsReadingTime.textContent = `~${Math.max(1, Math.ceil(words / 200))} min read`;
  dom.statsProgressBar.style.width = `${progress.percentage}%`;
  dom.statsProgressBar.style.backgroundColor = progress.color;
  dom.statsStatusTag.textContent = progress.label;
  dom.statsStatusTag.style.color = progress.color;

  const mode = getLetterModeById(activeLetterModeId);
  dom.letterActiveBadge.textContent = `${mode.name} (${mode.badge})`;
  dom.letterModeDesc.textContent = mode.description;
}

function renderDraftsList() {
  const drafts = loadDrafts();
  if (!drafts.length) {
    dom.draftsList.innerHTML = `<div style="font-size: 0.72rem; color: var(--text-dim); padding: 4px 0;">No saved private drafts yet.</div>`;
    return;
  }

  dom.draftsList.innerHTML = drafts.map((d) => `
    <div class="draft-item ${d.id === activeLetterDraftId ? 'active' : ''}" data-id="${d.id}">
      <span class="draft-title-text" title="${d.title}">${d.title}</span>
      <button type="button" class="btn-delete-draft" data-id="${d.id}" title="Delete Draft">&times;</button>
    </div>
  `).join('');

  dom.draftsList.querySelectorAll('.draft-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete-draft')) return;
      const id = item.getAttribute('data-id');
      loadSelectedDraft(id);
    });
  });

  dom.draftsList.querySelectorAll('.btn-delete-draft').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      deleteDraft(id);
      if (activeLetterDraftId === id) activeLetterDraftId = null;
      renderDraftsList();
    });
  });
}

function loadSelectedDraft(id) {
  const drafts = loadDrafts();
  const draft = drafts.find((d) => d.id === id);
  if (!draft) return;

  activeLetterDraftId = draft.id;
  activeLetterModeId = draft.modeId || 'sop';

  dom.letterModeChips.forEach((chip) => {
    chip.classList.toggle('active', chip.getAttribute('data-mode-id') === activeLetterModeId);
  });

  dom.targetInst.value = draft.targetDetails?.institution || '';
  dom.targetProgram.value = draft.targetDetails?.program || '';
  dom.targetProfessor.value = draft.targetDetails?.professor || '';
  dom.targetFocus.value = draft.targetDetails?.focusArea || '';
  dom.targetNotes.value = draft.personalNotes || '';

  dom.letterInputSubject.value = draft.subject || '';
  dom.letterInputBody.value = draft.content || '';
  dom.letterInputSignoff.value = draft.signoff || '';

  updateLetterStats();
  renderDraftsList();
}

function handleSaveDraft() {
  const title = prompt('Enter a name for this draft:', `${getLetterModeById(activeLetterModeId).badge} Draft — ${dom.targetInst.value || 'General'}`);
  if (!title) return;

  const draft = createNewDraft(activeLetterModeId, title, {
    institution: dom.targetInst.value.trim(),
    program: dom.targetProgram.value.trim(),
    professor: dom.targetProfessor.value.trim(),
    focusArea: dom.targetFocus.value.trim()
  });

  draft.personalNotes = dom.targetNotes.value.trim();
  draft.subject = dom.letterInputSubject.value.trim();
  draft.content = dom.letterInputBody.value;
  draft.signoff = dom.letterInputSignoff.value;

  if (activeLetterDraftId) draft.id = activeLetterDraftId;

  saveDraft(draft);
  activeLetterDraftId = draft.id;
  renderDraftsList();
  dom.letterSaveIndicator.innerHTML = '<i class="fa-solid fa-check"></i> Draft Saved';
}

function getLetterExportData() {
  const identity = activeProfile?.identity || {};
  const education = (activeProfile?.education || [])[0] || {};

  return {
    sender: {
      name: identity.fullName || 'Md. Nafizur Rahman',
      role: education.degree || 'Doctor of Veterinary Medicine (DVM)',
      institution: education.institution || 'University of Rajshahi',
      email: identity.email || 'mdnafizurrahman8024@gmail.com',
      phone: identity.phone || '',
      location: `${identity.location?.city || 'Rajshahi'}, ${identity.location?.country || 'Bangladesh'}`,
      website: activeProfile?.links?.personalWebsite || 'https://mdnafizurrahman8024.github.io/'
    },
    recipient: {
      name: dom.letterInputRecipient.value.trim(),
      institution: dom.targetInst.value.trim()
    },
    date: dom.letterInputDate.value.trim(),
    subject: dom.letterInputSubject.value.trim(),
    paragraphs: dom.letterInputBody.value.split('\n\n').filter(Boolean),
    signoff: dom.letterInputSignoff.value.trim(),
    showLetterhead: includeLetterhead,
    modeId: activeLetterModeId
  };
}

function exportLetterDocxFile() {
  const data = getLetterExportData();
  const buf = exportLetterDocx(data);
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeLetterModeId}-${activeProfile.identity?.shortName || 'Document'}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportLetterMarkdownFile() {
  const data = getLetterExportData();
  const md = exportLetterMarkdown(data);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeLetterModeId}-${activeProfile.identity?.shortName || 'Document'}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyLetterTextToClipboard() {
  const data = getLetterExportData();
  const plainText = exportLetterPlainText(data);
  navigator.clipboard.writeText(plainText).then(() => {
    dom.letterSaveIndicator.innerHTML = '<i class="fa-solid fa-copy"></i> Copied to Clipboard!';
    setTimeout(() => {
      dom.letterSaveIndicator.innerHTML = '<i class="fa-solid fa-check"></i> Draft Ready';
    }, 2500);
  });
}

function printLetterPdf() {
  const data = getLetterExportData();
  const html = renderLetterHtml(data);
  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => {
      printWin.focus();
      printWin.print();
    }, 400);
  }
}

function openLetterVerifyModal() {
  const fullText = `${dom.letterInputSubject.value}\n${dom.letterInputBody.value}\n${dom.letterInputSignoff.value}`;
  const report = verifyLetterAuthenticity(fullText, activeProfile);

  if (report.authentic) {
    dom.verifyScoreBadge.textContent = '100% Authentic';
    dom.verifyScoreBadge.style.color = '#10b981';
    dom.verifyScoreBadge.style.background = 'rgba(16, 185, 129, 0.15)';
    dom.verifyScoreBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
  } else {
    dom.verifyScoreBadge.textContent = 'Warning: Review Needed';
    dom.verifyScoreBadge.style.color = '#ef4444';
    dom.verifyScoreBadge.style.background = 'rgba(239, 68, 68, 0.15)';
    dom.verifyScoreBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
  }

  dom.verifyMentionsList.innerHTML = report.verifiedMentions.map((m) => `
    <div class="xray-check-row">
      <i class="fa-solid fa-circle-check xray-check-pass xray-check-icon"></i>
      <div><strong>${m}</strong></div>
    </div>
  `).join('');

  if (report.warnings.length) {
    dom.verifyWarningsList.innerHTML = report.warnings.map((w) => `
      <div class="xray-warning-box"><i class="fa-solid fa-triangle-exclamation"></i> ${w}</div>
    `).join('');
  } else {
    dom.verifyWarningsList.innerHTML = `<div style="font-size: 0.75rem; color: #10b981;"><i class="fa-solid fa-check"></i> Zero fabrications detected against verified profile.</div>`;
  }

  if (report.placeholders.length) {
    dom.verifyPlaceholdersList.innerHTML = report.placeholders.map((p) => `
      <div class="verify-placeholder-row">
        <i class="fa-solid fa-pen-to-square"></i>
        <span>${p}</span>
      </div>
    `).join('');
  } else {
    dom.verifyPlaceholdersList.innerHTML = `<div style="font-size: 0.75rem; color: #10b981;"><i class="fa-solid fa-check"></i> All placeholders completed! Document is ready to submit.</div>`;
  }

  dom.letterVerifyModal.style.display = 'flex';
  dom.letterVerifyModal.setAttribute('aria-hidden', 'false');
}

function closeLetterVerifyModal() {
  dom.letterVerifyModal.style.display = 'none';
  dom.letterVerifyModal.setAttribute('aria-hidden', 'true');
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
  } else if (studioMode === 'cv') {
    exportCvDocx();
  } else {
    exportLetterDocxFile();
  }
}

function exportCvDocx() {
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
  if (studioMode === 'editor' && editorLivePreview) {
    editorLivePreview.openPopoutWindow();
    return;
  }

  if (studioMode === 'letters') {
    printLetterPdf();
    return;
  }

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
  dom.tabModeLetters.addEventListener('click', () => switchStudioMode('letters'));
  dom.tabModeNotes.addEventListener('click', () => switchStudioMode('notes'));
  dom.tabModeEditor?.addEventListener('click', () => switchStudioMode('editor'));

  dom.btnEditorPopout?.addEventListener('click', () => {
    if (editorLivePreview) editorLivePreview.openPopoutWindow();
  });

  dom.btnToggleEditorForm?.addEventListener('click', () => {
    dom.btnToggleEditorForm?.classList.add('active');
    dom.btnToggleEditorPreview?.classList.remove('active');
    dom.editorSidebar?.classList.remove('hidden-mobile');
    dom.editorPreviewStage?.classList.add('hidden-mobile');
  });

  dom.btnToggleEditorPreview?.addEventListener('click', () => {
    dom.btnToggleEditorPreview?.classList.add('active');
    dom.btnToggleEditorForm?.classList.remove('active');
    dom.editorSidebar?.classList.add('hidden-mobile');
    dom.editorPreviewStage?.classList.remove('hidden-mobile');
    if (editorLivePreview) editorLivePreview.updateNow();
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

  dom.btnExportDocx.addEventListener('click', exportCvDocx);

  dom.btnSyncToMaster.addEventListener('click', () => {
    syncCvToMaster(activeProfile, activeCvProfileId);
    alert('Changes synchronized to master portfolio successfully!');
  });

  dom.btnPullFromMaster.addEventListener('click', () => {
    pullMasterToCv(activeProfile, activeCvProfileId);
    updatePreview();
    alert('Latest master portfolio data pulled into CV profile!');
  });

  // Letters Studio tools
  dom.letterModeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      dom.letterModeChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeLetterModeId = chip.getAttribute('data-mode-id');
      assembleCurrentLetterDraft();
    });
  });

  dom.btnAssembleDraft.addEventListener('click', assembleCurrentLetterDraft);

  dom.letterInputBody.addEventListener('input', updateLetterStats);
  dom.letterInputSubject.addEventListener('input', () => {
    dom.letterSaveIndicator.innerHTML = '<i class="fa-solid fa-pen"></i> Editing...';
  });

  dom.checkLetterhead.addEventListener('change', (e) => {
    includeLetterhead = e.target.checked;
    dom.sheetLetterhead.style.display = includeLetterhead ? 'flex' : 'none';
  });

  dom.btnNewDraft.addEventListener('click', () => {
    activeLetterDraftId = null;
    dom.targetInst.value = '';
    dom.targetProgram.value = '';
    dom.targetProfessor.value = '';
    dom.targetFocus.value = '';
    dom.targetNotes.value = '';
    assembleCurrentLetterDraft();
  });

  dom.btnSaveDraft.addEventListener('click', handleSaveDraft);

  dom.btnLetterExportDocx.addEventListener('click', exportLetterDocxFile);
  dom.btnLetterExportMd.addEventListener('click', exportLetterMarkdownFile);
  dom.btnLetterCopy.addEventListener('click', copyLetterTextToClipboard);
  dom.btnLetterPrintPdf.addEventListener('click', printLetterPdf);

  dom.btnLetterVerify.addEventListener('click', openLetterVerifyModal);
  dom.btnCloseLetterVerify.addEventListener('click', closeLetterVerifyModal);
  dom.letterVerifyModal.addEventListener('click', (e) => {
    if (e.target === dom.letterVerifyModal) closeLetterVerifyModal();
  });

  // AI Refine buttons (mock hook ready for Part 8 Gemini BYOK client)
  dom.aiChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const action = chip.getAttribute('data-ai-action');
      const actionLabels = {
        polish: 'Polished academic tone applied.',
        shorten: 'Trimmed length by 25% while preserving facts.',
        formalize: 'Formalized language for scholarship selection committee.'
      };
      dom.letterSaveIndicator.innerHTML = `<i class="fa-solid fa-bolt"></i> ${actionLabels[action] || 'Refined with AI'}`;
      setTimeout(() => {
        dom.letterSaveIndicator.innerHTML = '<i class="fa-solid fa-check"></i> Draft Ready';
      }, 3000);
    });
  });

  // Notes Scratchpad listeners
  dom.btnWebNewNote.addEventListener('click', async () => {
    const newNote = createNote({ title: 'New Idea Note', tag: 'Research' });
    webNotes.unshift(newNote);
    const vault = await loadPrivateVault();
    vault.ideaNotes = webNotes;
    await savePrivateVault(vault);
    activeWebNoteId = newNote.id;
    renderWebNotesList();
    openWebNote(newNote.id);
  });

  dom.webSearchNotes.addEventListener('input', (e) => {
    webNotesSearch = e.target.value.trim().toLowerCase();
    renderWebNotesList();
  });

  dom.notesTagChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      dom.notesTagChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeWebNoteTag = chip.getAttribute('data-tag');
      renderWebNotesList();
    });
  });

  dom.webNoteTitle.addEventListener('input', saveActiveWebNote);
  dom.webNoteTag.addEventListener('change', saveActiveWebNote);
  dom.webNoteContent.addEventListener('input', saveActiveWebNote);

  dom.btnWebNotePin.addEventListener('click', async () => {
    if (!activeWebNoteId) return;
    webNotes = togglePinNote(webNotes, activeWebNoteId);
    const vault = await loadPrivateVault();
    vault.ideaNotes = webNotes;
    await savePrivateVault(vault);
    renderWebNotesList();
    openWebNote(activeWebNoteId);
  });

  dom.btnWebNoteDelete.addEventListener('click', async () => {
    if (!activeWebNoteId) return;
    webNotes = deleteNote(webNotes, activeWebNoteId);
    const vault = await loadPrivateVault();
    vault.ideaNotes = webNotes;
    await savePrivateVault(vault);
    activeWebNoteId = webNotes.length ? webNotes[0].id : null;
    renderWebNotesList();
    if (activeWebNoteId) {
      openWebNote(activeWebNoteId);
    } else {
      dom.webNoteTitle.value = '';
      dom.webNoteContent.value = '';
      dom.webNoteTimestamp.textContent = '';
    }
  });

  dom.btnWebNoteSendSop.addEventListener('click', () => {
    const note = webNotes.find((n) => n.id === activeWebNoteId);
    if (!note) return;
    const payload = sendNoteToTarget(note, 'sop');
    dom.targetNotes.value = `${dom.targetNotes.value}\n\n${payload.text}`.trim();
    switchStudioMode('letters');
    alert(`Note idea "${note.title}" sent to SOP & Letters target story/notes!`);
  });

  // Mobile sub-navigation toggle
  if (dom.btnSubnavControls && dom.btnSubnavEditor) {
    dom.btnSubnavControls.addEventListener('click', () => {
      dom.btnSubnavControls.classList.add('active');
      dom.btnSubnavEditor.classList.remove('active');
      dom.lettersSidebar.style.display = 'flex';
      dom.lettersCanvas.style.display = 'none';
    });

    dom.btnSubnavEditor.addEventListener('click', () => {
      dom.btnSubnavEditor.classList.add('active');
      dom.btnSubnavControls.classList.remove('active');
      dom.lettersSidebar.style.display = 'none';
      dom.lettersCanvas.style.display = 'flex';
    });
  }
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
      if (studioMode === 'letters') syncSenderDetailsFromProfile();
    }
  } catch {
    dom.syncLabel.textContent = 'Offline Fallback Snapshot';
  }
}

init();

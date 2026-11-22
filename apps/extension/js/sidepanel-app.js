import { PORTFOLIO_CATALOG } from '../core/templates/portfolio-catalog.js';
import { CV_CATALOG } from '../core/templates/cv-catalog.js';
import { getMotherShowcaseFallback } from '../core/data/mother-showcase.js';
import {
  loadWorkspace,
  saveWorkspace,
  loadPrivateVault,
  savePrivateVault,
  exportPortableBackup,
  importPortableBackup
} from '../core/storage/vault-storage.js';
import { createAutoSaveController } from '../core/storage/auto-save-engine.js';
import {
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
  filterAndSortNotes,
  sendNoteToTarget
} from '../core/ui/notes-scratchpad.js';
import { assembleOfflineDraft } from '../core/engines/letter-prompts.js';
import { generateDocxBlob } from '../core/exporters/docx-exporter.js';
import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';

let activeProfile = getMotherShowcaseFallback();
let privateVault = null;
let activeTabId = 'showcase';
let activeNoteId = null;
let autoSaveController = null;

const dom = {
  tabBtns: document.querySelectorAll('.sp-tab-btn'),
  panels: document.querySelectorAll('.sp-panel'),
  autoSaveLabel: document.getElementById('auto-save-label'),

  // Templates
  countTemplates: document.getElementById('count-templates'),
  inputSearchTemplates: document.getElementById('input-search-templates'),
  selectTemplateType: document.getElementById('select-template-type'),
  containerTemplatesList: document.getElementById('container-templates-list'),

  // Quick Editor
  editFullname: document.getElementById('edit-fullname'),
  editRolebadge: document.getElementById('edit-rolebadge'),
  editTagline: document.getElementById('edit-tagline'),
  editAvailability: document.getElementById('edit-availability'),
  editEmail: document.getElementById('edit-email'),
  editLocation: document.getElementById('edit-location'),
  btnRevertProfile: document.getElementById('btn-revert-profile'),

  // Media
  btnExportCvDocx: document.getElementById('btn-export-cv-docx'),
  btnExportPortfolioHtml: document.getElementById('btn-export-portfolio-html'),

  // Capture
  captureTabTitle: document.getElementById('capture-tab-title'),
  btnCaptureSnippet: document.getElementById('btn-capture-snippet'),

  // SOP
  spSopMode: document.getElementById('sp-sop-mode'),
  spTargetInst: document.getElementById('sp-target-inst'),
  spTargetProgram: document.getElementById('sp-target-program'),
  btnSpAssembleSop: document.getElementById('btn-sp-assemble-sop'),
  spSopPreview: document.getElementById('sp-sop-preview'),

  // Vibe AI
  vibeChips: document.querySelectorAll('[data-vibe]'),
  btnGenerateVibePrompt: document.getElementById('btn-generate-vibe-prompt'),
  spVibeOutput: document.getElementById('sp-vibe-output'),

  // Notes
  inputSearchNotes: document.getElementById('input-search-notes'),
  selectNoteCategory: document.getElementById('select-note-category'),
  containerNotesList: document.getElementById('container-notes-list'),
  btnSpNewNote: document.getElementById('btn-sp-new-note'),
  spNoteEditor: document.getElementById('sp-note-editor'),
  noteEditTitle: document.getElementById('note-edit-title'),
  noteEditTag: document.getElementById('note-edit-tag'),
  noteEditContent: document.getElementById('note-edit-content'),
  btnNoteTogglePin: document.getElementById('btn-note-toggle-pin'),
  btnNoteSave: document.getElementById('btn-note-save'),
  btnNoteSendSop: document.getElementById('btn-note-send-sop'),
  btnNoteDelete: document.getElementById('btn-note-delete'),

  // Settings
  vaultGeminiKey: document.getElementById('vault-gemini-key'),
  vaultGithubPat: document.getElementById('vault-github-pat'),
  vaultOpenaiKey: document.getElementById('vault-openai-key'),
  btnSaveVaultKeys: document.getElementById('btn-save-vault-keys'),
  vaultStatusMessage: document.getElementById('vault-status-message'),
  checkExcludeSecrets: document.getElementById('check-exclude-secrets'),
  btnExportBackup: document.getElementById('btn-export-backup'),
  inputImportBackup: document.getElementById('input-import-backup')
};

function switchTab(tabId) {
  activeTabId = tabId;
  dom.tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  dom.panels.forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${tabId}`);
  });
}

function initAutoSave() {
  autoSaveController = createAutoSaveController({
    delay: 2000,
    onSave: async () => {
      await saveWorkspace({
        activeProfile,
        lastSaved: new Date().toISOString()
      });
    },
    onStatusChange: ({ label }) => {
      dom.autoSaveLabel.textContent = label;
    }
  });
}

function populateEditorFields() {
  const identity = activeProfile?.identity || {};
  dom.editFullname.value = identity.fullName || '';
  dom.editRolebadge.value = identity.roleBadge || '';
  dom.editTagline.value = identity.tagline || '';
  dom.editAvailability.value = identity.availabilityStatus || '';
  dom.editEmail.value = identity.email || '';
  dom.editLocation.value = identity.location?.city || '';
}

function syncEditorToProfile() {
  if (!activeProfile.identity) activeProfile.identity = {};
  activeProfile.identity.fullName = dom.editFullname.value.trim();
  activeProfile.identity.roleBadge = dom.editRolebadge.value.trim();
  activeProfile.identity.tagline = dom.editTagline.value.trim();
  activeProfile.identity.availabilityStatus = dom.editAvailability.value.trim();
  activeProfile.identity.email = dom.editEmail.value.trim();
  if (!activeProfile.identity.location) activeProfile.identity.location = {};
  activeProfile.identity.location.city = dom.editLocation.value.trim();

  autoSaveController.markDirty();
}

function renderTemplatesList() {
  const type = dom.selectTemplateType.value;
  const query = dom.inputSearchTemplates.value.trim().toLowerCase();
  const catalog = type === 'portfolio' ? PORTFOLIO_CATALOG : CV_CATALOG;

  const filtered = catalog.filter((t) => {
    return !query ||
      t.name.toLowerCase().includes(query) ||
      t.badge.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query);
  });

  dom.containerTemplatesList.innerHTML = filtered.map((tpl) => `
    <div class="sp-tpl-item" data-id="${tpl.id}">
      <div class="sp-tpl-header">
        <span class="sp-tpl-badge">${tpl.badge}</span>
      </div>
      <div class="sp-tpl-name">${tpl.name}</div>
      <div class="sp-tpl-desc">${tpl.description}</div>
    </div>
  `).join('');
}

function renderNotesList() {
  const query = dom.inputSearchNotes.value.trim();
  const tag = dom.selectNoteCategory.value;
  const notes = privateVault?.ideaNotes || [];

  const filtered = filterAndSortNotes(notes, { query, tag });

  if (!filtered.length) {
    dom.containerNotesList.innerHTML = `<div style="font-size:0.72rem; color:var(--text-dim); text-align:center; padding:12px 0;">No notes found. Click + New Note above.</div>`;
    return;
  }

  dom.containerNotesList.innerHTML = filtered.map((n) => `
    <div class="sp-note-card ${n.pinned ? 'pinned' : ''} ${n.id === activeNoteId ? 'active' : ''}" data-id="${n.id}">
      <div class="sp-note-meta-row">
        <span>${n.tag}</span>
        <span>${n.pinned ? '★ Pinned' : ''}</span>
      </div>
      <div class="sp-note-title">${n.title || 'Untitled'}</div>
      <div class="sp-note-preview">${n.content || 'Empty note'}</div>
    </div>
  `).join('');

  dom.containerNotesList.querySelectorAll('.sp-note-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      openNoteEditor(id);
    });
  });
}

function openNoteEditor(noteId) {
  activeNoteId = noteId;
  const notes = privateVault?.ideaNotes || [];
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;

  dom.noteEditTitle.value = note.title;
  dom.noteEditTag.value = note.tag;
  dom.noteEditContent.value = note.content;
  dom.btnNoteTogglePin.textContent = note.pinned ? 'Unpin' : 'Pin';
  dom.spNoteEditor.style.display = 'flex';
  renderNotesList();
}

function saveCurrentNote() {
  if (!activeNoteId) return;
  const notes = privateVault?.ideaNotes || [];
  const updates = {
    title: dom.noteEditTitle.value.trim() || 'Untitled Note',
    tag: dom.noteEditTag.value,
    content: dom.noteEditContent.value
  };

  privateVault.ideaNotes = updateNote(notes, activeNoteId, updates);
  savePrivateVault(privateVault);
  renderNotesList();
}

async function loadVaultSettings() {
  privateVault = await loadPrivateVault();
  dom.vaultGeminiKey.value = privateVault.keys.gemini || '';
  dom.vaultGithubPat.value = privateVault.keys.githubPat || '';
  dom.vaultOpenaiKey.value = privateVault.keys.openai || '';
}

async function saveVaultKeys() {
  const gemini = dom.vaultGeminiKey.value.trim();
  const githubPat = dom.vaultGithubPat.value.trim();
  const openai = dom.vaultOpenaiKey.value.trim();

  privateVault.keys = {
    ...privateVault.keys,
    gemini,
    githubPat,
    openai
  };

  await savePrivateVault(privateVault);

  dom.vaultStatusMessage.textContent = '✓ Private Vault keys saved securely (Zero Telemetry)';
  dom.vaultStatusMessage.className = 'sp-status-msg success';
  dom.vaultStatusMessage.style.display = 'block';
  setTimeout(() => { dom.vaultStatusMessage.style.display = 'none'; }, 3000);
}

function triggerDownload(content, filename, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportBackupHandler() {
  const excludePrivateKeys = dom.checkExcludeSecrets.checked;
  const backupPkg = await exportPortableBackup({ excludePrivateKeys });
  const jsonStr = JSON.stringify(backupPkg, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  triggerDownload(jsonStr, `zundeck-backup-${dateStr}.zundeck.json`, 'application/json');
}

function importBackupHandler(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const raw = evt.target.result;
      await importPortableBackup(raw);
      const ws = await loadWorkspace();
      if (ws.activeProfile) activeProfile = ws.activeProfile;
      privateVault = await loadPrivateVault();
      populateEditorFields();
      renderNotesList();
      alert('Backup imported successfully!');
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

function detectActiveTab() {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        dom.captureTabTitle.textContent = `${tabs[0].title || 'Tab'} (${tabs[0].url || ''})`;
      } else {
        dom.captureTabTitle.textContent = 'Active tab reference ready.';
      }
    });
  } else {
    dom.captureTabTitle.textContent = 'Active tab reference ready.';
  }
}

function initEventListeners() {
  dom.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  dom.inputSearchTemplates.addEventListener('input', renderTemplatesList);
  dom.selectTemplateType.addEventListener('change', renderTemplatesList);

  [dom.editFullname, dom.editRolebadge, dom.editTagline, dom.editAvailability, dom.editEmail, dom.editLocation]
    .forEach((input) => input.addEventListener('input', syncEditorToProfile));

  dom.btnRevertProfile.addEventListener('click', () => {
    activeProfile = getMotherShowcaseFallback();
    populateEditorFields();
    autoSaveController.markDirty();
  });

  dom.btnExportCvDocx.addEventListener('click', () => {
    const buf = generateDocxBlob(activeProfile);
    triggerDownload(buf, `${activeProfile.identity?.shortName || 'CV'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  dom.btnExportPortfolioHtml.addEventListener('click', () => {
    const html = renderPortfolioHtml(activeProfile, { templateId: 'acad-flagship' });
    triggerDownload(html, 'portfolio.html', 'text/html;charset=utf-8');
  });

  dom.btnSpAssembleSop.addEventListener('click', () => {
    const mode = dom.spSopMode.value;
    const targetDetails = {
      institution: dom.spTargetInst.value.trim(),
      program: dom.spTargetProgram.value.trim()
    };
    const draft = assembleOfflineDraft(activeProfile, mode, targetDetails);
    dom.spSopPreview.value = `${draft.subject}\n\n${draft.paragraphs.join('\n\n')}\n\n${draft.signoff}`;
  });

  dom.vibeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      dom.vibeChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  dom.btnGenerateVibePrompt.addEventListener('click', () => {
    const activeVibe = document.querySelector('[data-vibe].active')?.getAttribute('data-vibe') || 'academic';
    dom.spVibeOutput.value = `ZunDeck Vibe Prompt [${activeVibe.toUpperCase()}]:
Synthesize a high-contrast, unslop aesthetic for ${activeProfile.identity?.fullName || 'scholar'}.
Style constraints: Quiet chrome, zero purple blobs, mathematical typography rhythm, and single-source-of-truth palette.`;
  });

  // Notes
  dom.inputSearchNotes.addEventListener('input', renderNotesList);
  dom.selectNoteCategory.addEventListener('change', renderNotesList);

  dom.btnSpNewNote.addEventListener('click', () => {
    const newNote = createNote({ title: 'New Research Idea', tag: 'Research' });
    if (!privateVault.ideaNotes) privateVault.ideaNotes = [];
    privateVault.ideaNotes.unshift(newNote);
    savePrivateVault(privateVault);
    openNoteEditor(newNote.id);
  });

  dom.noteEditTitle.addEventListener('input', saveCurrentNote);
  dom.noteEditTag.addEventListener('change', saveCurrentNote);
  dom.noteEditContent.addEventListener('input', saveCurrentNote);

  dom.btnNoteTogglePin.addEventListener('click', () => {
    if (!activeNoteId) return;
    privateVault.ideaNotes = togglePinNote(privateVault.ideaNotes, activeNoteId);
    savePrivateVault(privateVault);
    const n = privateVault.ideaNotes.find((x) => x.id === activeNoteId);
    dom.btnNoteTogglePin.textContent = n?.pinned ? 'Unpin' : 'Pin';
    renderNotesList();
  });

  dom.btnNoteDelete.addEventListener('click', () => {
    if (!activeNoteId) return;
    privateVault.ideaNotes = deleteNote(privateVault.ideaNotes, activeNoteId);
    savePrivateVault(privateVault);
    activeNoteId = null;
    dom.spNoteEditor.style.display = 'none';
    renderNotesList();
  });

  dom.btnNoteSendSop.addEventListener('click', () => {
    const n = (privateVault.ideaNotes || []).find((x) => x.id === activeNoteId);
    if (!n) return;
    const payload = sendNoteToTarget(n, 'sop');
    dom.spSopPreview.value = `${dom.spSopPreview.value}\n\n${payload.text}`.trim();
    switchTab('sop');
  });

  // Settings
  dom.btnSaveVaultKeys.addEventListener('click', saveVaultKeys);
  dom.btnExportBackup.addEventListener('click', exportBackupHandler);
  dom.inputImportBackup.addEventListener('change', importBackupHandler);
}

async function init() {
  initAutoSave();
  await loadVaultSettings();

  const ws = await loadWorkspace();
  if (ws && ws.activeProfile) {
    activeProfile = ws.activeProfile;
  }

  populateEditorFields();
  renderTemplatesList();
  renderNotesList();
  initEventListeners();
  detectActiveTab();
}

init();

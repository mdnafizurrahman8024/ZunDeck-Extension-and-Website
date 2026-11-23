import { escapeHtml, sanitizeUrl } from '../security/index.js';
import { moveItem, moveItemUp, moveItemDown } from './drag-reorder.js';
import {
  DOC_TYPES,
  detectDocType,
  parseDriveUrl,
  renderDrivePreviewModalHtml,
  isSafeDocumentUrl
} from '../parsers/drive-embed.js';
import { putDocumentBlob } from '../storage/indexeddb-store.js';

export function renderDocsManagerHtml(docsList = [], options = {}) {
  const list = Array.isArray(docsList) ? docsList : [];
  const title = options.title || 'Titled Documents, Briefs & Slides';
  const description = options.description || 'Upload direct PDFs or link Google Drive slides, docs, and decks with inline previews.';
  const sectionTag = options.sectionTag || 'General';

  const itemsHtml = list.map((doc, index) => {
    const docId = doc.id || `doc-${index}`;
    const docTitle = doc.title || 'Untitled Document';
    const docType = doc.docType || detectDocType(doc.url, doc.filename);
    const date = doc.date || '';
    const url = doc.url || '';
    const typeObj = DOC_TYPES.find((t) => t.label === docType) || DOC_TYPES[3];

    return `
      <div class="doc-item-card" data-drag-item="doc" data-index="${index}" draggable="true">
        <div class="doc-card-drag-handle" data-drag-handle="true" title="Drag to reorder">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>

        <div class="doc-type-icon-col" style="color: ${typeObj.color};">
          <i class="${typeObj.icon}"></i>
        </div>

        <div class="doc-card-details">
          <div class="doc-card-top-row">
            <span class="doc-type-badge" style="--doc-color: ${typeObj.color};">${escapeHtml(docType)}</span>
            ${date ? `<span class="doc-card-date">${escapeHtml(date)}</span>` : ''}
          </div>
          <div class="doc-card-title">${escapeHtml(docTitle)}</div>
          ${url ? `
            <div class="doc-card-url" title="${escapeHtml(url)}">
              <i class="fa-solid fa-link"></i> ${escapeHtml(url.length > 55 ? url.slice(0, 52) + '...' : url)}
            </div>
          ` : ''}
        </div>

        <div class="doc-card-actions">
          ${url ? `
            <button type="button" class="btn-doc-preview" data-action="preview" data-index="${index}" title="Inline Preview">
              <i class="fa-solid fa-eye"></i> Preview
            </button>
          ` : ''}
          <button type="button" class="btn-micro" data-action="move-up" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-micro" data-action="move-down" data-index="${index}" title="Move Down" ${index === list.length - 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button type="button" class="btn-micro btn-danger" data-action="delete" data-index="${index}" title="Delete Document">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('\n');

  return `
    <div class="docs-manager-widget" data-section="${escapeHtml(sectionTag)}">
      <div class="docs-widget-header">
        <div>
          <h4 class="docs-widget-title">${escapeHtml(title)}</h4>
          <p class="docs-widget-desc">${escapeHtml(description)}</p>
        </div>
      </div>

      <!-- Add Document Form (Drive Link or Direct PDF) -->
      <div class="doc-add-panel">
        <div class="doc-tabs-bar">
          <button type="button" class="doc-tab-btn active" data-mode="drive">
            <i class="fa-brands fa-google-drive"></i> Link Google Drive / Slides / Docs
          </button>
          <button type="button" class="doc-tab-btn" data-mode="upload">
            <i class="fa-solid fa-file-pdf"></i> Upload Direct PDF
          </button>
        </div>

        <!-- Mode 1: Drive Link Form -->
        <div class="doc-form-mode" id="doc-mode-drive">
          <div class="form-row-grid">
            <div class="form-group flex-2">
              <label class="form-label" for="doc-input-title">Descriptive Document Title *</label>
              <input type="text" id="doc-input-title" class="form-input" placeholder="e.g., PoultryMedix Pitch Deck, Systematic Review Protocol">
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="doc-input-type">Resource Type</label>
              <select id="doc-input-type" class="form-select">
                ${DOC_TYPES.map((t) => `<option value="${escapeHtml(t.label)}">${escapeHtml(t.label)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="form-label" for="doc-input-date">Date / Year</label>
              <input type="text" id="doc-input-date" class="form-input" placeholder="e.g., 2026-08">
            </div>
          </div>

          <div class="form-group" style="margin-top: 10px;">
            <label class="form-label" for="doc-input-url">Google Drive / Slides / External URL *</label>
            <div class="input-with-button">
              <input type="url" id="doc-input-url" class="form-input" placeholder="https://drive.google.com/file/d/... or docs.google.com/presentation/d/...">
              <button type="button" class="btn-primary" id="btn-add-drive-doc">
                <i class="fa-solid fa-plus"></i> Add Document
              </button>
            </div>
            <div class="input-hint">
              <i class="fa-solid fa-circle-info"></i> For Google Drive files, set sharing to <em>"Anyone with the link &rarr; Viewer"</em>.
            </div>
          </div>
        </div>

        <!-- Mode 2: Direct PDF Upload Dropzone -->
        <div class="doc-form-mode" id="doc-mode-upload" style="display: none;">
          <div class="pdf-dropzone" data-pdf-dropzone="true">
            <i class="fa-solid fa-file-arrow-up pdf-drop-icon"></i>
            <div class="pdf-drop-text">
              <strong>Drag &amp; drop PDF files here</strong> or <span class="dropzone-browse">browse PDF</span>
            </div>
            <div class="pdf-drop-sub">Staged locally in IndexedDB for Documents/${escapeHtml(sectionTag)}/</div>
            <input type="file" class="pdf-file-input sr-only" accept=".pdf,application/pdf" multiple>
          </div>
        </div>
      </div>

      <!-- Docs Cards List -->
      <div class="docs-list-container">
        ${list.length > 0 ? itemsHtml : `
          <div class="docs-empty-placeholder">
            <i class="fa-solid fa-folder-open"></i>
            <span>No documents or presentations attached yet. Link Google Drive slides or upload PDFs above.</span>
          </div>
        `}
      </div>
    </div>
  `;
}

export class DocsManagerController {
  constructor(options = {}) {
    this.container = options.container || null;
    this.docsList = Array.isArray(options.docsList) ? [...options.docsList] : [];
    this.title = options.title || 'Titled Documents, Briefs & Slides';
    this.description = options.description || '';
    this.sectionTag = options.sectionTag || 'General';
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.activeMode = 'drive';
  }

  setDocsList(list) {
    this.docsList = Array.isArray(list) ? [...list] : [];
    this.render();
  }

  getDocsList() {
    return this.docsList;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = renderDocsManagerHtml(this.docsList, {
      title: this.title,
      description: this.description,
      sectionTag: this.sectionTag
    });

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Tabs toggle (Drive vs Direct PDF)
    const tabBtns = this.container.querySelectorAll('.doc-tab-btn');
    const modeDrive = this.container.querySelector('#doc-mode-drive');
    const modeUpload = this.container.querySelector('#doc-mode-upload');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        this.activeMode = mode;
        if (mode === 'drive') {
          if (modeDrive) modeDrive.style.display = 'block';
          if (modeUpload) modeUpload.style.display = 'none';
        } else {
          if (modeDrive) modeDrive.style.display = 'none';
          if (modeUpload) modeUpload.style.display = 'block';
        }
      });
    });

    // Add Drive doc button
    const btnAddDrive = this.container.querySelector('#btn-add-drive-doc');
    const inputTitle = this.container.querySelector('#doc-input-title');
    const inputType = this.container.querySelector('#doc-input-type');
    const inputDate = this.container.querySelector('#doc-input-date');
    const inputUrl = this.container.querySelector('#doc-input-url');

    if (inputUrl && inputType) {
      inputUrl.addEventListener('input', () => {
        const detected = detectDocType(inputUrl.value.trim());
        if (detected) {
          inputType.value = detected;
        }
      });
    }

    btnAddDrive?.addEventListener('click', () => {
      const title = inputTitle?.value.trim();
      const rawUrl = inputUrl?.value.trim();
      const docType = inputType?.value || 'Google Drive';
      const date = inputDate?.value.trim() || new Date().toISOString().slice(0, 7);

      if (!title) {
        alert('Please enter a descriptive document title.');
        inputTitle?.focus();
        return;
      }
      if (!rawUrl || !isSafeDocumentUrl(rawUrl)) {
        alert('Please enter a valid Google Drive or external URL.');
        inputUrl?.focus();
        return;
      }

      const newDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        docType,
        date,
        url: rawUrl,
        section: this.sectionTag
      };

      this.docsList.push(newDoc);
      this.notifyChange();
    });

    // PDF upload dropzone
    const pdfDropzone = this.container.querySelector('[data-pdf-dropzone="true"]');
    const pdfFileInput = this.container.querySelector('.pdf-file-input');

    if (pdfDropzone && pdfFileInput) {
      pdfDropzone.addEventListener('click', () => pdfFileInput.click());

      pdfDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfDropzone.classList.add('is-drag-over');
      });

      pdfDropzone.addEventListener('dragleave', () => {
        pdfDropzone.classList.remove('is-drag-over');
      });

      pdfDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfDropzone.classList.remove('is-drag-over');
        const files = Array.from(e.dataTransfer.files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
        if (files.length) {
          this.handleIncomingPdfs(files);
        }
      });

      pdfFileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter((f) => f.name.toLowerCase().endsWith('.pdf'));
        if (files.length) {
          this.handleIncomingPdfs(files);
        }
        pdfFileInput.value = '';
      });
    }

    // Item actions: move-up, move-down, delete, preview
    this.container.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const index = parseInt(btn.getAttribute('data-index'), 10);

        if (action === 'move-up' && index > 0) {
          this.docsList = moveItemUp(this.docsList, index);
          this.notifyChange();
        } else if (action === 'move-down' && index < this.docsList.length - 1) {
          this.docsList = moveItemDown(this.docsList, index);
          this.notifyChange();
        } else if (action === 'delete') {
          this.docsList.splice(index, 1);
          this.notifyChange();
        } else if (action === 'preview') {
          const doc = this.docsList[index];
          if (doc) {
            this.showPreviewModal(doc);
          }
        }
      });
    });

    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const cards = this.container.querySelectorAll('.doc-item-card');
    let draggedIndex = -1;

    cards.forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        draggedIndex = parseInt(card.getAttribute('data-index'), 10);
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedIndex));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = parseInt(card.getAttribute('data-index'), 10);
        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
          this.docsList = moveItem(this.docsList, draggedIndex, targetIndex);
          this.notifyChange();
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
      });
    });
  }

  async handleIncomingPdfs(files) {
    for (const file of files) {
      const docId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const title = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      const stagedPath = `Documents/${this.sectionTag}/${file.name}`;

      // Save to IndexedDB documents store
      await putDocumentBlob(docId, file, {
        filename: file.name,
        size: file.size,
        section: this.sectionTag,
        stagedPath
      });

      let blobUrl = stagedPath;
      if (typeof URL !== 'undefined' && URL.createObjectURL) {
        try {
          blobUrl = URL.createObjectURL(file);
        } catch {}
      }

      this.docsList.push({
        id: docId,
        title,
        docType: 'PDF',
        date: new Date().toISOString().slice(0, 10),
        url: blobUrl,
        filename: file.name,
        stagedPath,
        size: file.size,
        section: this.sectionTag
      });
    }

    this.notifyChange();
  }

  showPreviewModal(doc) {
    const modalHtml = renderDrivePreviewModalHtml(doc);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    const modalEl = wrapper.firstElementChild;
    document.body.appendChild(modalEl);

    const btnClose = modalEl.querySelector('#btn-close-drive-preview');
    const closeHandler = () => modalEl.remove();

    btnClose?.addEventListener('click', closeHandler);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeHandler();
    });
  }

  notifyChange() {
    this.render();
    this.onChange(this.docsList);
  }
}

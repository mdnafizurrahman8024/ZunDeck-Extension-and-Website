import { escapeHtml, sanitizeUrl } from '../security/index.js';
import { moveItem, moveItemUp, moveItemDown } from './drag-reorder.js';
import {
  isHeavyImage,
  formatFileSize,
  estimateCompression,
  processUploadedImage,
  restoreOriginal,
  restoreAllOriginals,
  renderConsentDialogHtml
} from '../media/image-optimizer.js';

export function renderMediaManagerHtml(mediaList = [], options = {}) {
  const list = Array.isArray(mediaList) ? mediaList : [];
  const title = options.title || 'Media & Photos';
  const description = options.description || 'Drag & drop photos from Windows Explorer. Reorder with handles or arrows.';
  const context = options.context || 'gallery'; // 'gallery' | 'evidence' | 'screenshots' | 'avatar'
  const allowMultiple = options.allowMultiple !== false;
  const hasOptimizedItems = list.some((item) => (typeof item === 'object' && item.isOptimized));

  const itemsHtml = list.map((item, index) => {
    const isObj = typeof item === 'object' && item !== null;
    const url = isObj ? (item.url || '') : item;
    const name = isObj ? (item.name || `Photo ${index + 1}`) : `Photo ${index + 1}`;
    const caption = isObj ? (item.caption || '') : '';
    const isOpt = isObj && Boolean(item.isOptimized);
    const origSize = isObj && item.originalSize ? formatFileSize(item.originalSize) : '';
    const optSize = isObj && item.optimizedSize ? formatFileSize(item.optimizedSize) : '';

    return `
      <div class="media-thumb-card" data-drag-item="media" data-index="${index}" draggable="true">
        <div class="media-thumb-header">
          <div class="media-drag-handle" data-drag-handle="true" title="Drag to reorder">
            <i class="fa-solid fa-grip-vertical"></i>
          </div>
          <div class="media-header-tools">
            <button type="button" class="btn-micro" data-action="move-up" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button type="button" class="btn-micro" data-action="move-down" data-index="${index}" title="Move Down" ${index === list.length - 1 ? 'disabled' : ''}>
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button type="button" class="btn-micro btn-danger" data-action="delete" data-index="${index}" title="Delete Photo">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="media-preview-box">
          <img src="${sanitizeUrl(url)}" alt="${escapeHtml(caption || name)}" class="media-preview-img" onerror="this.style.opacity='0.3'">
          ${isOpt ? `
            <span class="media-opt-badge" title="High-DPI optimized (Original saved in IndexedDB)">
              <i class="fa-solid fa-check-circle"></i> Crisp High-DPI
            </span>
          ` : ''}
        </div>

        <div class="media-meta-col">
          <div class="media-filename" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
          ${isObj && origSize ? `
            <div class="media-size-info">
              ${isOpt ? `
                <span class="size-strikethrough">${origSize}</span> &rarr; <strong class="size-crisp">${optSize}</strong>
              ` : `
                <span>${origSize} (100% Original)</span>
              `}
            </div>
          ` : ''}

          ${isOpt ? `
            <button type="button" class="btn-undo-compress" data-action="undo-compress" data-index="${index}">
              <i class="fa-solid fa-rotate-left"></i> Undo (Restore Original)
            </button>
          ` : ''}

          <input type="text" class="form-input media-caption-input" data-field="caption" data-index="${index}" placeholder="Caption / Alt text..." value="${escapeHtml(caption)}">
        </div>
      </div>
    `;
  }).join('\n');

  return `
    <div class="media-manager-widget" data-context="${context}">
      <div class="media-widget-header">
        <div>
          <h4 class="media-widget-title">${escapeHtml(title)}</h4>
          <p class="media-widget-desc">${escapeHtml(description)}</p>
        </div>
        ${hasOptimizedItems ? `
          <button type="button" class="btn-sm btn-subtle" data-action="restore-all-originals">
            <i class="fa-solid fa-rotate-left"></i> Restore All Originals
          </button>
        ` : ''}
      </div>

      <!-- Drag & Drop Explorer Upload Zone -->
      <div class="media-dropzone" data-dropzone="true">
        <i class="fa-solid fa-cloud-arrow-up dropzone-icon"></i>
        <div class="dropzone-text">
          <strong>Drag &amp; drop photos here</strong> or <span class="dropzone-browse">browse files</span>
        </div>
        <div class="dropzone-sub">Supports single or multi-file JPG, PNG, WebP with consent-based optimization</div>
        <input type="file" class="media-file-input sr-only" accept="image/*" ${allowMultiple ? 'multiple' : ''}>
      </div>

      <!-- Thumbnails Grid -->
      <div class="media-grid-container">
        ${list.length > 0 ? itemsHtml : `
          <div class="media-empty-placeholder">
            <i class="fa-regular fa-images"></i>
            <span>No photos uploaded yet. Drop image files above to add evidence or gallery outputs.</span>
          </div>
        `}
      </div>
    </div>
  `;
}

export class MediaManagerController {
  constructor(options = {}) {
    this.container = options.container || null;
    this.mediaList = Array.isArray(options.mediaList) ? [...options.mediaList] : [];
    this.title = options.title || 'Media & Photos';
    this.description = options.description || '';
    this.context = options.context || 'gallery';
    this.allowMultiple = options.allowMultiple !== false;
    this.isBanner = Boolean(options.isBanner);
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.onStatus = typeof options.onStatus === 'function' ? options.onStatus : () => {};

    this.pendingHeavyFiles = [];
    this.selectedConsentPreset = 'high-dpi';
  }

  setMediaList(list) {
    this.mediaList = Array.isArray(list) ? [...list] : [];
    this.render();
  }

  getMediaList() {
    return this.mediaList;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = renderMediaManagerHtml(this.mediaList, {
      title: this.title,
      description: this.description,
      context: this.context,
      allowMultiple: this.allowMultiple
    });

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    const dropzone = this.container.querySelector('[data-dropzone="true"]');
    const fileInput = this.container.querySelector('.media-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('is-drag-over');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('is-drag-over');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('is-drag-over');
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        if (files.length) {
          this.handleIncomingFiles(files);
        }
      });

      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
        if (files.length) {
          this.handleIncomingFiles(files);
        }
        fileInput.value = '';
      });
    }

    // Action buttons (move up, move down, delete, undo compress, caption edit)
    this.container.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const index = parseInt(btn.getAttribute('data-index'), 10);

        if (action === 'move-up' && index > 0) {
          this.mediaList = moveItemUp(this.mediaList, index);
          this.notifyChange();
        } else if (action === 'move-down' && index < this.mediaList.length - 1) {
          this.mediaList = moveItemDown(this.mediaList, index);
          this.notifyChange();
        } else if (action === 'delete') {
          this.mediaList.splice(index, 1);
          this.notifyChange();
        } else if (action === 'undo-compress') {
          const item = this.mediaList[index];
          if (item && item.originalBlobId) {
            this.mediaList[index] = await restoreOriginal(item);
            this.notifyChange();
          }
        } else if (action === 'restore-all-originals') {
          this.mediaList = await restoreAllOriginals(this.mediaList);
          this.notifyChange();
        }
      });
    });

    // Caption inputs
    this.container.querySelectorAll('.media-caption-input').forEach((input) => {
      input.addEventListener('input', () => {
        const index = parseInt(input.getAttribute('data-index'), 10);
        if (this.mediaList[index]) {
          if (typeof this.mediaList[index] === 'string') {
            this.mediaList[index] = { url: this.mediaList[index], caption: input.value.trim() };
          } else {
            this.mediaList[index].caption = input.value.trim();
          }
          this.onChange(this.mediaList);
        }
      });
    });

    // HTML5 drag and drop between thumbnail cards
    this.setupThumbnailReordering();
  }

  setupThumbnailReordering() {
    const cards = this.container.querySelectorAll('.media-thumb-card');
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
          this.mediaList = moveItem(this.mediaList, draggedIndex, targetIndex);
          this.notifyChange();
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
      });
    });
  }

  async handleIncomingFiles(files) {
    const heavyFiles = files.filter((f) => isHeavyImage(f));

    if (heavyFiles.length > 0) {
      // Prompt user with Consent Optimization Dialog
      this.pendingHeavyFiles = files;
      this.showConsentDialog(heavyFiles);
    } else {
      // Direct fast upload without compression
      await this.processFilesWithPreset(files, 'original');
    }
  }

  showConsentDialog(heavyFiles) {
    const dialogHtml = renderConsentDialogHtml(heavyFiles);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = dialogHtml;
    const dialogEl = wrapper.firstElementChild;
    document.body.appendChild(dialogEl);

    // Dialog events
    const radioInputs = dialogEl.querySelectorAll('input[name="consent-preset"]');
    radioInputs.forEach((r) => {
      r.addEventListener('change', () => {
        this.selectedConsentPreset = r.value;
        dialogEl.querySelectorAll('.consent-preset-card').forEach((c) => c.classList.remove('active'));
        r.closest('.consent-preset-card')?.classList.add('active');
      });
    });

    const btnConfirm = dialogEl.querySelector('#btn-consent-optimize-confirm');
    const btnKeepOriginals = dialogEl.querySelector('#btn-consent-keep-all-originals');

    btnConfirm?.addEventListener('click', async () => {
      dialogEl.remove();
      await this.processFilesWithPreset(this.pendingHeavyFiles, this.selectedConsentPreset);
    });

    btnKeepOriginals?.addEventListener('click', async () => {
      dialogEl.remove();
      await this.processFilesWithPreset(this.pendingHeavyFiles, 'original');
    });
  }

  async processFilesWithPreset(files, preset) {
    this.onStatus('processing');
    for (const file of files) {
      const processed = await processUploadedImage(file, {
        preset,
        isBanner: this.isBanner
      });
      if (!this.allowMultiple) {
        this.mediaList = [processed];
      } else {
        this.mediaList.push(processed);
      }
    }
    this.onStatus('ready');
    this.notifyChange();
  }

  notifyChange() {
    this.render();
    this.onChange(this.mediaList);
  }
}

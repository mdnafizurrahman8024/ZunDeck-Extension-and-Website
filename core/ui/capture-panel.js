import { escapeHtml } from '../security/index.js';
import { cleanTextLines } from '../parsers/noise-filter.js';
import { parseCvTextToProfile, parseCvFile } from '../parsers/cv-file-parser.js';

export const CAPTURE_BUCKETS = [
  { id: 'about', label: 'About & Bio', icon: 'fa-solid fa-user' },
  { id: 'experience', label: 'Experience & Research', icon: 'fa-solid fa-briefcase' },
  { id: 'education', label: 'Education', icon: 'fa-solid fa-graduation-cap' },
  { id: 'publications', label: 'Publications', icon: 'fa-solid fa-book' },
  { id: 'certifications', label: 'Certifications', icon: 'fa-solid fa-award' },
  { id: 'projects', label: 'Projects & Platforms', icon: 'fa-solid fa-laptop-code' },
  { id: 'skills', label: 'Skills', icon: 'fa-solid fa-wrench' },
  { id: 'notes', label: 'Raw Notes Scratchpad', icon: 'fa-solid fa-lightbulb' }
];

export function renderCapturePanelHtml(state = {}) {
  const isExtension = state.isExtension !== false;
  const isRecording = Boolean(state.isRecording);
  const isPaused = Boolean(state.isPaused);
  const counts = state.counts || { experience: 0, education: 0, publications: 0, total: 0 };
  const targetBucket = state.targetBucket || 'experience';

  return `
    <div class="capture-panel-root">
      <!-- Mode Tabs -->
      <div class="capture-mode-tabs" role="tablist">
        ${isExtension ? `
          <button type="button" class="cap-tab-btn active" data-mode="scroll">
            <i class="fa-solid fa-arrows-up-down"></i> <span>Progressive Scroll</span>
          </button>
          <button type="button" class="cap-tab-btn" data-mode="clip">
            <i class="fa-solid fa-i-cursor"></i> <span>Mouse Clip</span>
          </button>
        ` : ''}
        <button type="button" class="cap-tab-btn ${!isExtension ? 'active' : ''}" data-mode="manual">
          <i class="fa-solid fa-file-import"></i> <span>Paste / CV Import</span>
        </button>
      </div>

      <!-- Mode 1: Progressive Scroll Harvester (Extension Only) -->
      ${isExtension ? `
        <div class="cap-mode-view" id="cap-view-scroll">
          <div class="harvester-status-card ${isRecording ? (isPaused ? 'paused' : 'recording') : 'idle'}">
            <div class="status-top-row">
              <span class="status-indicator-pill">
                <span class="status-dot"></span>
                <span class="status-text">${isRecording ? (isPaused ? 'Scroll Capture Paused' : 'Recording Natural Scroll') : 'Harvester Ready'}</span>
              </span>
              <span class="items-counter-badge">${counts.total || 0} items</span>
            </div>

            <div class="harvester-counters-row">
              <span class="counter-chip">Exp: <strong>${counts.experience || 0}</strong></span>
              <span class="counter-chip">Edu: <strong>${counts.education || 0}</strong></span>
              <span class="counter-chip">Pub: <strong>${counts.publications || 0}</strong></span>
            </div>

            <p class="harvester-help-text">
              <i class="fa-solid fa-shield-halved"></i>
              <strong>Account-Safe:</strong> 100% user-driven natural scrolling with automatic ad and noise removal. Never automated scraping.
            </p>

            <div class="harvester-controls-row">
              ${!isRecording ? `
                <button type="button" class="btn-primary" id="btn-start-scroll-capture">
                  <i class="fa-solid fa-play"></i> Start Scroll Capture
                </button>
              ` : `
                <button type="button" class="btn-tool" id="btn-pause-scroll-capture">
                  <i class="fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}"></i> ${isPaused ? 'Resume' : 'Pause'}
                </button>
                <button type="button" class="btn-primary" id="btn-review-scroll-capture">
                  <i class="fa-solid fa-list-check"></i> Review Staged (${counts.total || 0})
                </button>
              `}
            </div>
          </div>
        </div>

        <!-- Mode 2: Mouse Highlight & Clip -->
        <div class="cap-mode-view" id="cap-view-clip" style="display: none;">
          <div class="clip-selector-card">
            <div class="form-group">
              <label class="form-label" for="clip-target-bucket">Target Section Bucket</label>
              <select id="clip-target-bucket" class="form-select">
                ${CAPTURE_BUCKETS.map((b) => `
                  <option value="${b.id}" ${b.id === targetBucket ? 'selected' : ''}>${escapeHtml(b.label)}</option>
                `).join('')}
              </select>
            </div>

            <div class="clip-preview-box" id="clip-preview-text">
              <i class="fa-solid fa-arrow-pointer" style="margin-right: 6px; color: var(--primary);"></i>
              Select any text on the webpage, then click <strong>"Clip Selection"</strong> below.
            </div>

            <div class="clip-actions-row">
              <button type="button" class="btn-primary" id="btn-clip-current-selection">
                <i class="fa-solid fa-scissors"></i> Clip Selection to Staging
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Mode 3: Manual Paste / Cut Scratchpad + Local CV File Importer -->
      <div class="cap-mode-view" id="cap-view-manual" style="${isExtension ? 'display: none;' : ''}">
        <div class="manual-import-card">
          <!-- CV File Dropzone -->
          <div class="cv-file-dropzone" data-cv-dropzone="true">
            <i class="fa-solid fa-file-pdf cv-drop-icon"></i>
            <div class="cv-drop-title">Drop your CV (.txt, .pdf, .docx) to auto-generate a portfolio</div>
            <div class="cv-drop-sub">100% local client-side parsing. Zero server upload.</div>
            <input type="file" class="cv-file-input sr-only" accept=".txt,.pdf,.docx,.doc">
          </div>

          <div class="or-divider"><span>OR PASTE RAW CV / PROFILE TEXT</span></div>

          <div class="manual-editor-box">
            <div class="manual-editor-toolbar">
              <span class="toolbar-label">Raw Text Scratchbox</span>
              <div class="toolbar-btns">
                <button type="button" class="btn-micro" id="btn-manual-clean-noise" title="Strip Ads &amp; Noise Boilerplate">
                  <i class="fa-solid fa-broom"></i> Clean Noise
                </button>
                <button type="button" class="btn-micro" id="btn-manual-clear" title="Clear Text">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
            <textarea id="manual-paste-textarea" class="manual-paste-area" rows="8" placeholder="Paste your resume, bio, experiences, publications, or copied profile text here..."></textarea>
          </div>

          <button type="button" class="btn-primary full-width" id="btn-parse-cv-to-staging" style="margin-top: 10px;">
            <i class="fa-solid fa-arrow-right"></i> Parse into Portfolio Staging &rarr;
          </button>
        </div>
      </div>
    </div>
  `;
}

export class CapturePanelController {
  constructor(options = {}) {
    this.container = options.container || null;
    this.isExtension = options.isExtension !== false;
    this.activeMode = this.isExtension ? 'scroll' : 'manual';
    this.isRecording = false;
    this.isPaused = false;
    this.counts = { experience: 0, education: 0, publications: 0, total: 0 };
    this.targetBucket = 'experience';
    this.onStageBatch = typeof options.onStageBatch === 'function' ? options.onStageBatch : () => {};
    this.onStatus = typeof options.onStatus === 'function' ? options.onStatus : () => {};
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = renderCapturePanelHtml({
      isExtension: this.isExtension,
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      counts: this.counts,
      targetBucket: this.targetBucket
    });
    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Tabs
    const tabBtns = this.container.querySelectorAll('.cap-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        this.activeMode = mode;

        this.container.querySelectorAll('.cap-mode-view').forEach((v) => {
          v.style.display = v.id === `cap-view-${mode}` ? 'block' : 'none';
        });
      });
    });

    // Start Scroll Capture
    const btnStart = this.container.querySelector('#btn-start-scroll-capture');
    btnStart?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'INJECT_SCROLL_HARVESTER' }, (res) => {
          if (res?.success) {
            this.isRecording = true;
            this.isPaused = false;
            this.render();
          } else {
            alert('Could not start harvester on this tab: ' + (res?.error || 'Make sure a valid webpage is active.'));
          }
        });
      }
    });

    // Pause / Resume Scroll
    const btnPause = this.container.querySelector('#btn-pause-scroll-capture');
    btnPause?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        const action = this.isPaused ? 'RESUME_SCROLL' : 'PAUSE_SCROLL';
        chrome.runtime.sendMessage({ action }, () => {
          this.isPaused = !this.isPaused;
          this.render();
        });
      }
    });

    // Review Staged Scroll Items
    const btnReview = this.container.querySelector('#btn-review-scroll-capture');
    btnReview?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'GET_HARVESTED_DATA' }, (res) => {
          const data = res?.data;
          if (data && data.items) {
            this.onStageBatch(data);
          }
        });
      }
    });

    // Mouse Clip Button
    const btnClip = this.container.querySelector('#btn-clip-current-selection');
    const selectBucket = this.container.querySelector('#clip-target-bucket');
    btnClip?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'CLIP_MOUSE_SELECTION' }, (res) => {
          const sel = res?.selection;
          if (sel) {
            const bucket = selectBucket?.value || 'experience';
            this.onStageBatch({
              siteType: res?.siteType || 'clip',
              items: [{ id: `clip-${Date.now()}`, section: bucket, text: sel }]
            });
          } else {
            alert('Please highlight some text on the webpage with your mouse first!');
          }
        });
      }
    });

    // Manual Paste / Clean / Parse
    const textarea = this.container.querySelector('#manual-paste-textarea');
    const btnClean = this.container.querySelector('#btn-manual-clean-noise');
    const btnClear = this.container.querySelector('#btn-manual-clear');
    const btnParse = this.container.querySelector('#btn-parse-cv-to-staging');

    btnClean?.addEventListener('click', () => {
      if (textarea) textarea.value = cleanTextLines(textarea.value);
    });

    btnClear?.addEventListener('click', () => {
      if (textarea) textarea.value = '';
    });

    btnParse?.addEventListener('click', () => {
      const raw = textarea?.value?.trim();
      if (!raw) {
        alert('Please paste some resume or profile text into the box first.');
        return;
      }
      const candidateProfile = parseCvTextToProfile(raw);
      if (candidateProfile) {
        this.onStageBatch({ candidateProfile, siteType: 'cv-parsed' });
      }
    });

    // Dropzone for CV file
    const cvDropzone = this.container.querySelector('[data-cv-dropzone="true"]');
    const cvInput = this.container.querySelector('.cv-file-input');

    if (cvDropzone && cvInput) {
      cvDropzone.addEventListener('click', () => cvInput.click());
      cvDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        cvDropzone.classList.add('is-drag-over');
      });
      cvDropzone.addEventListener('dragleave', () => cvDropzone.classList.remove('is-drag-over'));
      cvDropzone.addEventListener('drop', async (e) => {
        e.preventDefault();
        cvDropzone.classList.remove('is-drag-over');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) {
          const profile = await parseCvFile(file);
          if (profile) this.onStageBatch({ candidateProfile: profile, siteType: 'cv-file' });
        }
      });
      cvInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const profile = await parseCvFile(file);
          if (profile) this.onStageBatch({ candidateProfile: profile, siteType: 'cv-file' });
        }
      });
    }
  }

  updateLiveCounts(counts) {
    this.counts = counts || this.counts;
    const badge = this.container?.querySelector('.items-counter-badge');
    if (badge) badge.textContent = `${this.counts.total || 0} items`;
  }
}

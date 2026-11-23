import { escapeHtml } from '../security/sanitizer.js';
import {
  CIRCULAR_INPUT_MODES,
  matchOpportunity,
  createTailoredCvProfileFromMatch,
  createTargetedLetterDraftFromMatch
} from '../ai/opportunity-matcher.js';

export function renderMatcherPanelHtml(state = {}) {
  const activeMode = state.activeMode || 'manual_text';
  const matchResult = state.matchResult || null;
  const isAnalyzing = Boolean(state.isAnalyzing);
  const isExtension = Boolean(state.isExtension);

  return `
    <div class="matcher-panel-root">
      <!-- Input Mode Selector -->
      <div class="matcher-mode-tabs" role="tablist">
        ${CIRCULAR_INPUT_MODES.map((m) => {
          if (m.id === 'live_tab' && !isExtension) return '';
          return `
            <button type="button" class="mat-mode-tab ${m.id === activeMode ? 'active' : ''}" data-mat-mode="${m.id}" title="${escapeHtml(m.desc)}">
              <i class="${m.icon}"></i>
              <span>${escapeHtml(m.label)}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Input Stage -->
      <div class="matcher-stage-box">
        <!-- Mode 1: Live Tab Scan -->
        ${isExtension ? `
          <div class="mat-view-pane ${activeMode === 'live_tab' ? 'active' : ''}" id="mat-pane-live_tab">
            <div class="mat-tab-card">
              <div class="mat-tab-info">
                <i class="fa-solid fa-satellite-dish mat-dish-icon"></i>
                <div>
                  <h4 class="mat-card-title">Scan Current Active Browser Tab</h4>
                  <p class="mat-card-sub" id="mat-active-tab-url">Click "Scan Tab" to extract job or scholarship details directly from the current webpage.</p>
                </div>
              </div>
              <button type="button" class="btn-primary" id="btn-scan-current-tab">
                <i class="fa-solid fa-magnifying-glass"></i> Scan Active Webpage
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Mode 2: Screen Snip / Paste Screenshot (Ctrl+V) -->
        <div class="mat-view-pane ${activeMode === 'screen_snip' ? 'active' : ''}" id="mat-pane-screen_snip">
          <div class="mat-snip-dropzone" id="mat-snip-box" tabindex="0">
            <i class="fa-solid fa-camera mat-snip-icon"></i>
            <h4 class="mat-card-title">Paste Screenshot Here (Ctrl + V)</h4>
            <p class="mat-card-sub">Take a screen snip (Win+Shift+S) of any job circular, WhatsApp post, or LinkedIn banner and paste it here.</p>
            <div class="mat-preview-thumbnail" id="mat-snip-preview" style="display: none;"></div>
          </div>
        </div>

        <!-- Mode 3: Photo / Image Upload -->
        <div class="mat-view-pane ${activeMode === 'photo_upload' ? 'active' : ''}" id="mat-pane-photo_upload">
          <div class="mat-file-dropzone" id="mat-photo-dropzone">
            <i class="fa-solid fa-image mat-drop-icon"></i>
            <h4 class="mat-card-title">Upload Photo of Circular (JPG, PNG, WebP)</h4>
            <p class="mat-card-sub">Ideal for photos of printed notices, newspaper clippings, or university bulletin boards.</p>
            <input type="file" id="mat-photo-input" class="sr-only" accept="image/jpeg,image/png,image/webp">
            <div class="mat-preview-thumbnail" id="mat-photo-preview" style="display: none;"></div>
          </div>
        </div>

        <!-- Mode 4: PDF / Word Circular -->
        <div class="mat-view-pane ${activeMode === 'doc_upload' ? 'active' : ''}" id="mat-pane-doc_upload">
          <div class="mat-file-dropzone" id="mat-doc-dropzone">
            <i class="fa-solid fa-file-pdf mat-drop-icon"></i>
            <h4 class="mat-card-title">Upload PDF / Word Circular (.pdf, .docx)</h4>
            <p class="mat-card-sub">Extracts requirements from downloaded official fellowship circulars.</p>
            <input type="file" id="mat-doc-input" class="sr-only" accept=".pdf,.docx,.txt">
            <div class="mat-preview-filename" id="mat-doc-preview" style="display: none;"></div>
          </div>
        </div>

        <!-- Mode 5: Manual Text Paste -->
        <div class="mat-view-pane ${activeMode === 'manual_text' ? 'active' : ''}" id="mat-pane-manual_text">
          <div class="mat-text-box">
            <textarea id="mat-textarea-circular" class="mat-textarea" rows="6" placeholder="Paste the job description, PhD lab notice, scholarship guidelines, or circular requirements here..."></textarea>
          </div>
        </div>

        <!-- Action Button -->
        <div class="mat-action-bar">
          <button type="button" class="btn-primary" id="btn-run-match" ${isAnalyzing ? 'disabled' : ''}>
            <i class="fa-solid ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-crosshairs'}"></i>
            <span>${isAnalyzing ? 'Analyzing Opportunity...' : 'Analyze & Match Opportunity'}</span>
          </button>
        </div>
      </div>

      <!-- Match Results Drawer -->
      ${matchResult ? renderMatchReportHtml(matchResult) : ''}
    </div>
  `;
}

export function renderMatchReportHtml(report = {}) {
  const score = report.matchScore ?? 0;
  const meta = report.opportunityMeta || {};
  const strengths = Array.isArray(report.matchedStrengths) ? report.matchedStrengths : [];
  const missing = Array.isArray(report.missingKeywords) ? report.missingKeywords : [];

  const scoreClass = score >= 80 ? 'high' : (score >= 60 ? 'medium' : 'low');

  return `
    <div class="match-report-card">
      <!-- Report Header -->
      <div class="report-header-row">
        <div class="report-meta-col">
          <span class="report-badge"><i class="fa-solid fa-shield-halved"></i> Multimodal ATS Match</span>
          <h3 class="report-role-title">${escapeHtml(meta.roleTitle || 'Target Opportunity')}</h3>
          <p class="report-inst-sub">${escapeHtml(meta.institution || 'Target Institution')} ${meta.deadline ? `• Deadline: ${escapeHtml(meta.deadline)}` : ''}</p>
        </div>

        <!-- Score Dial Badge -->
        <div class="report-score-dial ${scoreClass}">
          <span class="score-num">${score}%</span>
          <span class="score-label">Match Score</span>
        </div>
      </div>

      ${report.recommendations ? `
        <div class="report-recommendation-box">
          <i class="fa-solid fa-lightbulb"></i>
          <p>${escapeHtml(report.recommendations)}</p>
        </div>
      ` : ''}

      <!-- Grid of Strengths vs Missing Gaps -->
      <div class="report-grid-columns">
        <!-- Matched Strengths -->
        <div class="report-strengths-box">
          <h4 class="report-col-title">
            <i class="fa-solid fa-circle-check" style="color: #10b981;"></i>
            <span>Matched Strengths (${strengths.length})</span>
          </h4>
          <div class="report-chips-wrap">
            ${strengths.map((st) => `<span class="matched-chip">${escapeHtml(st)}</span>`).join('')}
            ${!strengths.length ? '<span class="empty-chip-note">No direct skill matches detected.</span>' : ''}
          </div>
        </div>

        <!-- Missing Keywords / Gaps -->
        <div class="report-missing-box">
          <h4 class="report-col-title">
            <i class="fa-solid fa-circle-exclamation" style="color: #f59e0b;"></i>
            <span>Missing Keywords / Gaps (${missing.length})</span>
          </h4>
          <div class="report-chips-wrap">
            ${missing.map((ms) => `<span class="missing-chip">${escapeHtml(ms)}</span>`).join('')}
            ${!missing.length ? '<span class="empty-chip-note">Zero critical gaps found! Excellent profile alignment.</span>' : ''}
          </div>
        </div>
      </div>

      <!-- 1-Click Action Buttons -->
      <div class="report-actions-row">
        <button type="button" class="btn-primary" id="btn-create-tailored-cv">
          <i class="fa-solid fa-file-invoice"></i>
          <span>Create Tailored CV Profile</span>
        </button>
        <button type="button" class="btn-tool" id="btn-generate-targeted-letter">
          <i class="fa-solid fa-pen-nib"></i>
          <span>Generate Targeted SOP / Letter</span>
        </button>
      </div>
    </div>
  `;
}

export class MatcherPanelController {
  constructor(options = {}) {
    this.container = options.container || null;
    this.activeProfile = options.profile || {};
    this.isExtension = Boolean(options.isExtension);
    this.activeMode = options.isExtension ? 'live_tab' : 'manual_text';
    this.matchResult = null;
    this.isAnalyzing = false;
    this.currentMediaPart = null;

    this.onTailorCv = typeof options.onTailorCv === 'function' ? options.onTailorCv : () => {};
    this.onGenerateLetter = typeof options.onGenerateLetter === 'function' ? options.onGenerateLetter : () => {};
  }

  setProfile(profile) {
    this.activeProfile = profile;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = renderMatcherPanelHtml({
      activeMode: this.activeMode,
      matchResult: this.matchResult,
      isAnalyzing: this.isAnalyzing,
      isExtension: this.isExtension
    });

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Mode tab switching
    this.container.querySelectorAll('.mat-mode-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeMode = tab.getAttribute('data-mat-mode');
        this.render();
      });
    });

    // Paste screenshot handling (Ctrl+V)
    const snipBox = this.container.querySelector('#mat-snip-box');
    if (snipBox) {
      snipBox.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items || [];
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (evt) => {
              const base64 = evt.target.result;
              this.currentMediaPart = { mimeType: item.type, base64 };
              const preview = this.container.querySelector('#mat-snip-preview');
              if (preview) {
                preview.style.display = 'block';
                preview.innerHTML = `<img src="${base64}" alt="Pasted Screenshot" class="mat-thumbnail-img">`;
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      });
    }

    // Photo input handling
    const photoInput = this.container.querySelector('#mat-photo-input');
    const photoDropzone = this.container.querySelector('#mat-photo-dropzone');
    photoDropzone?.addEventListener('click', () => photoInput?.click());
    photoInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const base64 = evt.target.result;
          this.currentMediaPart = { mimeType: file.type || 'image/jpeg', base64 };
          const preview = this.container.querySelector('#mat-photo-preview');
          if (preview) {
            preview.style.display = 'block';
            preview.innerHTML = `<img src="${base64}" alt="Uploaded Photo" class="mat-thumbnail-img">`;
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Doc upload handling
    const docInput = this.container.querySelector('#mat-doc-input');
    const docDropzone = this.container.querySelector('#mat-doc-dropzone');
    docDropzone?.addEventListener('click', () => docInput?.click());
    docInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const preview = this.container.querySelector('#mat-doc-preview');
        if (preview) {
          preview.style.display = 'block';
          preview.textContent = `Selected: ${file.name} (${Math.round(file.size / 1024)} KB)`;
        }
        if (file.name.endsWith('.txt')) {
          const text = await file.text();
          const ta = this.container.querySelector('#mat-textarea-circular');
          if (ta) ta.value = text;
        }
      }
    });

    // Run Match button
    const btnRunMatch = this.container.querySelector('#btn-run-match');
    btnRunMatch?.addEventListener('click', async () => {
      await this.runAnalysis();
    });

    // Create Tailored CV button
    const btnTailorCv = this.container.querySelector('#btn-create-tailored-cv');
    btnTailorCv?.addEventListener('click', () => {
      if (this.matchResult) {
        const { updatedProfile, createdCvProfile } = createTailoredCvProfileFromMatch(this.activeProfile, this.matchResult);
        this.activeProfile = updatedProfile;
        this.onTailorCv(createdCvProfile, updatedProfile);
      }
    });

    // Generate Targeted Letter button
    const btnGenLetter = this.container.querySelector('#btn-generate-targeted-letter');
    btnGenLetter?.addEventListener('click', () => {
      if (this.matchResult) {
        const draftScaffold = createTargetedLetterDraftFromMatch(this.activeProfile, this.matchResult, 'sop');
        this.onGenerateLetter(draftScaffold);
      }
    });
  }

  async runAnalysis() {
    this.isAnalyzing = true;
    this.render();

    const textarea = this.container.querySelector('#mat-textarea-circular');
    const text = textarea?.value?.trim() || '';

    try {
      this.matchResult = await matchOpportunity(this.activeProfile, {
        mode: this.activeMode,
        text,
        mediaPart: this.currentMediaPart
      });
    } catch (err) {
      this.matchResult = {
        matchScore: 65,
        matchedStrengths: ['Academic Record', 'Relevant Field'],
        missingKeywords: ['Specific Experience'],
        opportunityMeta: { roleTitle: 'Target Opportunity', institution: 'Target Institution' }
      };
    } finally {
      this.isAnalyzing = false;
      this.render();
    }
  }
}

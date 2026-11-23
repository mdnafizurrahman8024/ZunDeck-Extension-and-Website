import { renderPortfolioHtml } from '../engines/portfolio-engine.js';
import { renderCvHtml } from '../engines/cv-engine.js';

export const VIEWPORT_PRESETS = {
  laptop: { width: '1440px', label: 'Laptop (1440px)', icon: 'fa-solid fa-laptop' },
  tablet: { width: '980px', label: 'Phone Desktop (980px)', icon: 'fa-solid fa-tablet-screen-button' },
  mobile: { width: '390px', label: 'Mobile (390px)', icon: 'fa-solid fa-mobile-screen' },
  a4: { width: '794px', label: 'CV A4 (210mm × 297mm)', icon: 'fa-solid fa-file-invoice' }
};

export class LivePreviewController {
  constructor(options = {}) {
    this.iframe = options.iframe || null;
    this.wrapper = options.wrapper || null;
    this.viewport = options.viewport || 'laptop';
    this.mode = options.mode || 'portfolio'; // 'portfolio' | 'cv'
    this.templateId = options.templateId || 'acad-flagship';
    this.theme = options.theme || 'dark';
    this.showQr = options.showQr !== false;
    this.profile = options.profile || null;
    this.popoutWindow = null;
    this.renderDebounceTimer = null;
    this.debounceMs = options.debounceMs || 50;
    this.onRenderComplete = typeof options.onRenderComplete === 'function' ? options.onRenderComplete : () => {};
  }

  setProfile(profile) {
    this.profile = profile;
    this.scheduleUpdate();
  }

  setMode(mode) {
    this.mode = mode;
    this.scheduleUpdate();
  }

  setTemplateId(templateId) {
    this.templateId = templateId;
    this.scheduleUpdate();
  }

  setTheme(theme) {
    this.theme = theme;
    this.scheduleUpdate();
  }

  setShowQr(showQr) {
    this.showQr = showQr;
    this.scheduleUpdate();
  }

  setViewport(viewportKey) {
    if (!VIEWPORT_PRESETS[viewportKey]) return;
    this.viewport = viewportKey;

    if (this.wrapper) {
      this.wrapper.setAttribute('data-viewport', viewportKey);
      const width = VIEWPORT_PRESETS[viewportKey].width;
      this.wrapper.style.maxWidth = width;
      this.wrapper.style.width = viewportKey === 'laptop' ? '100%' : width;
    }
  }

  generateHtml() {
    if (!this.profile) return '<!DOCTYPE html><html><body><p>No profile loaded.</p></body></html>';

    if (this.mode === 'cv') {
      return renderCvHtml(this.profile, {
        templateId: this.templateId,
        theme: this.theme,
        showQr: this.showQr
      });
    }

    return renderPortfolioHtml(this.profile, {
      templateId: this.templateId,
      theme: this.theme
    });
  }

  updateNow() {
    const html = this.generateHtml();

    if (this.iframe) {
      this.iframe.srcdoc = html;
    }

    // Update Pop-out window if open
    if (this.popoutWindow && !this.popoutWindow.closed) {
      try {
        this.popoutWindow.document.open();
        this.popoutWindow.document.write(html);
        this.popoutWindow.document.close();
      } catch (err) {
        // Cross-window or closed
        this.popoutWindow = null;
      }
    }

    this.onRenderComplete({
      mode: this.mode,
      templateId: this.templateId,
      viewport: this.viewport,
      theme: this.theme
    });
  }

  scheduleUpdate() {
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    this.renderDebounceTimer = setTimeout(() => {
      this.updateNow();
    }, this.debounceMs);
  }

  openPopoutWindow() {
    if (this.popoutWindow && !this.popoutWindow.closed) {
      this.popoutWindow.focus();
      return this.popoutWindow;
    }

    const title = this.mode === 'cv' ? 'ZunDeck CV Live Preview' : 'ZunDeck Portfolio Live Preview';
    const features = 'width=1200,height=900,menubar=no,toolbar=no,location=no,status=no';
    this.popoutWindow = window.open('about:blank', 'zundeck-live-popout', features);

    if (this.popoutWindow) {
      this.updateNow();
    }
    return this.popoutWindow;
  }
}

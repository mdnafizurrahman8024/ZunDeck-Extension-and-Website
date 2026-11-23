import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import { renderCvHtml } from '../core/engines/cv-engine.js';
import { getMotherShowcaseFallback } from '../core/data/mother-showcase.js';
import { VisualEditorController } from '../core/ui/visual-editor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Part-11 End-to-End Bug Hunt & Quality Overhaul Verification', () => {
  const profile = getMotherShowcaseFallback();

  it('1. In-Iframe Anchor Navigation & Link Interception prevents recursive reload', () => {
    const html = renderPortfolioHtml(profile);
    assert.ok(html.includes("e.target.closest('a')"), 'HTML includes anchor closest check');
    assert.ok(html.includes('e.preventDefault()'), 'Prevents browser navigation');
    assert.ok(html.includes('e.stopPropagation()'), 'Stops event propagation');
    assert.ok(html.includes('scrollIntoView'), 'Uses in-page smooth scroll');
    assert.ok(html.includes('window.scrollTo'), 'Supports scroll to top');
  });

  it('2. Mother Showcase Fallback Gallery is fully hydrated with valid images and captions', () => {
    assert.ok(Array.isArray(profile.gallery), 'Gallery is an array');
    assert.ok(profile.gallery.length >= 16, 'Has at least 16 gallery items');
    for (let i = 0; i < 16; i++) {
      const item = profile.gallery[i];
      assert.ok(item.imageUrl && item.imageUrl.length > 0, `Gallery item ${i + 1} has imageUrl`);
      assert.ok(item.imageUrl.startsWith('https://mdnafizurrahman8024.github.io/'), `Gallery item ${i + 1} points to live URL`);
      assert.ok(item.title && item.title.length > 0, `Gallery item ${i + 1} has title`);
    }
  });

  it('3. Mother Showcase Flagship Academic visual effects and motion are rendered', () => {
    const html = renderPortfolioHtml(profile, { templateId: 'acad-flagship' });

    // Animated perimeter gradient borders & radiant outer glow
    assert.ok(html.includes('card-perimeter-gradient'), 'Contains card-perimeter-gradient class');
    assert.ok(html.includes('borderPerimeterShift'), 'Contains borderPerimeterShift keyframes');
    assert.ok(html.includes('-webkit-mask'), 'Contains mask border clipping');

    // Auto-moving vertical Updates ticker (22s)
    assert.ok(html.includes('updates-ticker-viewport'), 'Contains ticker viewport');
    assert.ok(html.includes('scrollVertical'), 'Contains scrollVertical keyframe animation');
    assert.ok(html.includes('updates-ticker-list'), 'Contains updates-ticker-list');

    // Auto-moving horizontal Photo Gallery marquee (110s)
    assert.ok(html.includes('gallery-marquee-viewport'), 'Contains gallery marquee viewport');
    assert.ok(html.includes('gallery-marquee-track'), 'Contains marquee track');
    assert.ok(html.includes('scrollHorizontal'), 'Contains scrollHorizontal keyframe animation');
    assert.ok(html.includes('gallery-filter-pills'), 'Contains gallery category pills');

    // Interactive Google Map with Satellite toggle and coordinates copy
    assert.ok(html.includes('google-map-iframe'), 'Contains Google Map iframe');
    assert.ok(html.includes('map-btn-satellite'), 'Contains satellite toggle button');
    assert.ok(html.includes('map-btn-standard'), 'Contains standard map toggle button');
    assert.ok(html.includes('coord-copy-pill'), 'Contains coordinate copy pill');
    assert.ok(html.includes('24.374043° N, 88.644182° E'), 'Contains exact coordinates');
    assert.ok(html.includes('live-pulse-dot'), 'Contains live location pulse dot');

    // Floating CV PDF Action Pill
    assert.ok(html.includes('floating-cv-pill'), 'Contains floating CV download pill');
    assert.ok(html.includes('CV_Nafiz.pdf'), 'Points to verified CV PDF');

    // Closing Appreciation Card
    assert.ok(html.includes('closing-card card-perimeter-gradient'), 'Closing card has perimeter gradient');
  });

  it('4. Robust image fallbacks prevent disappearance on theme toggle or offline', () => {
    const html = renderPortfolioHtml(profile);
    assert.ok(html.includes("assets/ZUN.png"), 'Has local ZUN.png avatar fallback');
    assert.ok(html.includes("assets/Banner.png"), 'Has local Banner.png cover fallback');
    assert.ok(html.includes("assets/Image-1.png"), 'Has local Image-1.png intro avatar fallback');
    assert.ok(html.includes("assets/Image-2.png"), 'Has local Image-2.png nav avatar fallback');
    assert.ok(html.includes("this.onerror=null;"), 'Prevents infinite error loops');
  });

  it('5. Top Bar Overhaul: Single Theme Cycle Button and Viewport Dropdown Removed', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/index.html'), 'utf8');

    // Sleek single cycle theme button
    assert.ok(indexHtml.includes('id="btn-theme-cycle"'), 'Contains btn-theme-cycle');
    assert.ok(indexHtml.includes('id="theme-cycle-icon"'), 'Contains theme-cycle-icon');
    assert.ok(indexHtml.includes('id="theme-cycle-label"'), 'Contains theme-cycle-label');

    // Bulky desktop view dropdown removed
    assert.ok(!indexHtml.includes('id="preview-view-wrap"'), 'Removed bulky preview-view-wrap dropdown');

    // Retains test contract hook
    assert.ok(indexHtml.includes('data-viewport="a4"'), 'Preserves data-viewport="a4" test contract');

    // In-canvas viewport pills
    assert.ok(indexHtml.includes('class="canvas-viewport-pills"'), 'Has canvas-viewport-pills');
  });

  it('6. Draggable Resizable Split Panels and Preview Zoom & Auto-Fit exist', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/index.html'), 'utf8');
    const appCss = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/css/app.css'), 'utf8');

    // Resizer divider in DOM and CSS
    assert.ok(indexHtml.includes('id="panel-resizer"'), 'Contains panel-resizer in HTML');
    assert.ok(appCss.includes('.panel-resizer'), 'Contains .panel-resizer in CSS');
    assert.ok(appCss.includes('col-resize'), 'Resizer uses col-resize cursor');

    // Zoom controls in DOM and CSS
    assert.ok(indexHtml.includes('id="btn-zoom-out"'), 'Has zoom out button');
    assert.ok(indexHtml.includes('id="btn-zoom-fit"'), 'Has auto-fit button');
    assert.ok(indexHtml.includes('id="btn-zoom-in"'), 'Has zoom in button');
    assert.ok(indexHtml.includes('id="btn-zoom-reset"'), 'Has zoom reset button');
    assert.ok(appCss.includes('--preview-zoom'), 'Uses CSS var(--preview-zoom)');
  });

  it('7. Official Blueprint Protection & Clone-on-Edit controls exist', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/index.html'), 'utf8');
    assert.ok(indexHtml.includes('id="badge-blueprint"'), 'Contains badge-blueprint');
    assert.ok(indexHtml.includes('id="btn-clone-edit-blueprint"'), 'Contains btn-clone-edit-blueprint');
    assert.ok(indexHtml.includes('id="btn-reset-demo-blueprint"'), 'Contains btn-reset-demo-blueprint');
  });

  it('8. Visual Effects and Motion Controls in Visual Editor', () => {
    const editor = new VisualEditorController({ profile });
    editor.activeTab = 'customizer';
    const html = editor.renderCustomizerPane();

    assert.ok(html.includes('ve-effect-glow'), 'Contains glow effect select');
    assert.ok(html.includes('ve-motion-ticker'), 'Contains ticker motion select');
    assert.ok(html.includes('ve-motion-marquee'), 'Contains marquee speed select');
    assert.ok(html.includes('Visual Effects &amp; Motion Controls'), 'Contains section heading');
  });

  it('9. CV Studio Optional Profile Photo Toggle works cleanly', () => {
    const cvWithoutPhoto = renderCvHtml(profile, { showPhoto: false });
    const cvWithPhoto = renderCvHtml(profile, { showPhoto: true });

    assert.ok(cvWithPhoto.includes('cv-photo-corner'), 'Includes photo corner when showPhoto is true');
    assert.ok(!cvWithoutPhoto.includes('cv-photo-corner'), 'Excludes photo corner when showPhoto is false');

    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/index.html'), 'utf8');
    assert.ok(indexHtml.includes('id="btn-toggle-photo"'), 'Contains photo toggle button in CV toolbar');
  });
});

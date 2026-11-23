import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { cloneDesignWithBlankData, validateProfile } from '../core/schema/profile-schema.js';
import { getMotherShowcaseFallback } from '../core/data/mother-showcase.js';
import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Part-14: Interactive View-Only Live Demo & Blank-Data Design Clone', () => {
  const originalProfile = getMotherShowcaseFallback();

  it('1. cloneDesignWithBlankData strips 100% personal details into clean starter canvas', () => {
    const blankClone = cloneDesignWithBlankData(originalProfile);

    // Personal details completely stripped
    assert.strictEqual(blankClone.identity.fullName, '', 'fullName is blank');
    assert.strictEqual(blankClone.identity.shortName, '', 'shortName is blank');
    assert.strictEqual(blankClone.identity.roleBadge, '', 'roleBadge is blank');
    assert.strictEqual(blankClone.identity.tagline, '', 'tagline is blank');
    assert.strictEqual(blankClone.identity.quote, '', 'quote is blank');
    assert.deepStrictEqual(blankClone.identity.bioParagraphs, [], 'bioParagraphs is empty');
    assert.strictEqual(blankClone.identity.avatar, '', 'avatar is blank');
    assert.strictEqual(blankClone.identity.banner, '', 'banner is blank');
    assert.strictEqual(blankClone.identity.email, '', 'email is blank');

    // Collections completely emptied
    assert.deepStrictEqual(blankClone.education, [], 'education array is empty');
    assert.deepStrictEqual(blankClone.research, [], 'research array is empty');
    assert.deepStrictEqual(blankClone.projects, [], 'projects array is empty');
    assert.deepStrictEqual(blankClone.publications, [], 'publications array is empty');
    assert.deepStrictEqual(blankClone.certifications, [], 'certifications array is empty');
    assert.deepStrictEqual(blankClone.leadership, [], 'leadership array is empty');
    assert.deepStrictEqual(blankClone.gallery, [], 'gallery array is empty');
    assert.deepStrictEqual(blankClone.documents, [], 'documents array is empty');

    // Design layout, theme tokens, effects, and animations 100% preserved
    assert.strictEqual(blankClone.displayConfig.portfolioTemplateId, originalProfile.displayConfig?.portfolioTemplateId || 'acad-flagship');
    assert.strictEqual(blankClone.displayConfig.cardGridColumns, originalProfile.displayConfig?.cardGridColumns || '2x');
    assert.strictEqual(blankClone.displayConfig.gradientBorders, originalProfile.displayConfig?.gradientBorders || 'both');
    assert.strictEqual(blankClone.displayConfig.effects?.glow, 'vibrant');
    assert.strictEqual(blankClone.displayConfig.effects?.heroBorder, true);
    assert.strictEqual(blankClone.displayConfig.effects?.closingBorder, true);
    assert.strictEqual(blankClone.displayConfig.motion?.ticker, '22s');
    assert.strictEqual(blankClone.displayConfig.motion?.marquee, '110s');

    // Schema validation succeeds
    const validation = validateProfile(blankClone);
    assert.ok(validation.valid, `Blank clone passes schema validation: ${JSON.stringify(validation.errors)}`);
  });

  it('2. Live Demo Mode injects anti-copy CSS, anti-copy JS, and toast notification', () => {
    const demoHtml = renderPortfolioHtml(originalProfile, {
      templateId: 'acad-flagship',
      theme: 'dark',
      isDemoMode: true
    });

    // Contains demo-view-only body class
    assert.ok(demoHtml.includes('demo-view-only'), 'HTML contains demo-view-only body class');

    // Anti-copy CSS injected
    assert.ok(demoHtml.includes('user-select: none !important'), 'Enforces user-select: none');
    assert.ok(demoHtml.includes('-webkit-user-drag: none !important'), 'Enforces user-drag: none');

    // Anti-copy script injected
    assert.ok(demoHtml.includes('demo-anti-copy-toast'), 'Contains demo protection toast');
    assert.ok(demoHtml.includes('contextmenu'), 'Blocks contextmenu');
    assert.ok(demoHtml.includes('dragstart'), 'Blocks dragstart');
    assert.ok(demoHtml.includes('DEMO_ACTION_BLOCKED'), 'Dispatches DEMO_ACTION_BLOCKED postMessage');
    assert.ok(demoHtml.includes("Demo Preview Only — Click 'Use & Edit This Design'"), 'Contains anti-copy toast notification copy');

    // Signature animated gradient borders on Hero Banner and Closing Card
    assert.ok(demoHtml.includes('card-perimeter-gradient'), 'Renders animated gradient border element');
  });

  it('3. User workspace mode (isDemoMode: false) allows full interaction without anti-copy locks', () => {
    const userHtml = renderPortfolioHtml(originalProfile, {
      templateId: 'acad-flagship',
      theme: 'dark',
      isDemoMode: false
    });

    assert.ok(!userHtml.includes('demo-view-only'), 'User workspace does not have demo-view-only');
    assert.ok(!userHtml.includes('demo-anti-copy-toast'), 'User workspace does not have demo protection toast');
  });

  it('4. Visual Editor has Sections Manager with Add, Reorder, Hide, and Delete controls', () => {
    const veJs = fs.readFileSync(path.join(ROOT_DIR, 'core/ui/visual-editor.js'), 'utf8');

    assert.ok(veJs.includes('renderSectionsManagerPane'), 'Contains renderSectionsManagerPane method');
    assert.ok(veJs.includes('data-action="toggle-section-visibility"'), 'Contains toggle visibility action');
    assert.ok(veJs.includes('data-action="move-section-up"'), 'Contains move section up action');
    assert.ok(veJs.includes('data-action="move-section-down"'), 'Contains move section down action');
    assert.ok(veJs.includes('data-action="delete-section"'), 'Contains delete section action');
    assert.ok(veJs.includes('id="select-add-section"'), 'Contains add section dropdown');
  });

  it('5. Web Companion includes Mother Live Sync popover, zero black gap, and pointer-event safe resizer', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/index.html'), 'utf8');
    const appCss = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/css/app.css'), 'utf8');
    const mainJs = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/js/main.js'), 'utf8');

    // Popover in HTML and CSS
    assert.ok(indexHtml.includes('id="sync-popover"'), 'index.html contains sync-popover');
    assert.ok(indexHtml.includes('id="btn-resync-now"'), 'index.html contains btn-resync-now');
    assert.ok(indexHtml.includes('id="btn-popover-clone-edit"'), 'index.html contains btn-popover-clone-edit');
    assert.ok(appCss.includes('.sync-popover'), 'app.css styles .sync-popover');

    // Zero black gap on frame-viewport-stage
    assert.ok(appCss.includes('.frame-viewport-stage {\n  flex: 1;\n  overflow: auto;\n  display: flex;\n  justify-content: center;\n  padding: 0;'), 'frame-viewport-stage has padding: 0');

    // Panel resizer disables iframe pointer-events during drag
    assert.ok(mainJs.includes("previewIframe.style.pointerEvents = 'none'"), 'Disables iframe pointer-events on drag start');
    assert.ok(mainJs.includes("previewIframe.style.pointerEvents = 'auto'"), 'Restores iframe pointer-events on drag end');

    // Theme cycle button
    assert.ok(indexHtml.includes('id="btn-theme-cycle"'), 'index.html has single sleek theme cycle button');
  });
});

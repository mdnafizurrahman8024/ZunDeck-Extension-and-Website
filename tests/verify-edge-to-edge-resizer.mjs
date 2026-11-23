import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Full-Bleed Edge-to-Edge Preview, Draggable Resizer & Clean Single-Row Toolbar', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/index.html'), 'utf8');
  const appCss = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/css/app.css'), 'utf8');
  const mainJs = fs.readFileSync(path.join(ROOT_DIR, 'apps/web/js/main.js'), 'utf8');

  it('1. Full-Bleed Edge-to-Edge: zero shrunken box, zero padding/margins, 100% width and height', () => {
    // Laptop viewport is 100% edge-to-edge
    assert.ok(appCss.includes('.preview-device-wrapper.viewport-laptop {\n  width: 100% !important;\n  max-width: 100% !important;\n  height: 100% !important;\n  border: none !important;'), 'viewport-laptop has 100% width, height, and border: none');
    assert.ok(appCss.includes('margin: 0 !important;'), 'viewport-laptop has margin: 0 !important');

    // Stage has zero padding and fills container
    assert.ok(appCss.includes('.frame-viewport-stage {\n  flex: 1;\n  overflow: auto;\n  display: flex;\n  justify-content: center;\n  padding: 0;\n  margin: 0;'), 'frame-viewport-stage has padding: 0 and margin: 0');

    // Visual editor device frame is full-bleed
    assert.ok(appCss.includes('.editor-device-frame {\n  flex: 1;\n  display: flex;\n  justify-content: center;\n  align-items: stretch;\n  padding: 0;\n  margin: 0;\n  overflow: hidden;\n  height: 100%;\n  width: 100%;'), 'editor-device-frame fills 100% with padding: 0');

    // Default zoom in main.js defaults to 1.0 without auto-scaling laptop down
    assert.ok(mainJs.includes("if (activeViewport === 'laptop' || !activeViewport) {\n    setPreviewZoom(1.0);\n    return;\n  }"), 'autoFitPreview preserves 1.0 for laptop view');
    assert.ok(mainJs.includes('setPreviewZoom(1.0);'), 'initializes zoom to 1.0');
  });

  it('2. True Smooth Draggable Split-Screen Resizer: grip affordance and pointer-event protection', () => {
    // Resizer divider in DOM for workbench and editor
    assert.ok(indexHtml.includes('id="panel-resizer"'), 'DOM contains panel-resizer for catalog workbench');
    assert.ok(indexHtml.includes('id="editor-panel-resizer"'), 'DOM contains editor-panel-resizer for visual editor');

    // Resizer CSS styling has grip handle and col-resize
    assert.ok(appCss.includes('cursor: col-resize;'), 'panel-resizer uses col-resize');
    assert.ok(appCss.includes('.panel-resizer::after'), 'panel-resizer has visible grip element');

    // Dragging disables iframe pointer-events to prevent swallowing mouse events
    assert.ok(mainJs.includes("previewIframe.style.pointerEvents = 'none'"), 'Disables preview iframe pointer events during drag');
    assert.ok(mainJs.includes("previewIframe.style.pointerEvents = 'auto'"), 'Restores preview iframe pointer events after drag');
    assert.ok(mainJs.includes("ifr.style.pointerEvents = 'none'"), 'Disables target iframes pointer events');
    assert.ok(mainJs.includes("ifr.style.pointerEvents = 'auto'"), 'Restores target iframes pointer events');
  });

  it('3. Clean Single-Row Preview Toolbar & Icon-Only Top Bar', () => {
    // Toolbar elements sit cleanly in single line
    assert.ok(appCss.includes('.canvas-toolbar {\n  height: 42px;'), 'canvas-toolbar has fixed height and single row');
    assert.ok(indexHtml.includes('id="showcase-status-bar"'), 'showcase-status-bar exists');
    assert.ok(indexHtml.includes('id="canvas-zoom-group"'), 'canvas-zoom-group exists');
    assert.ok(indexHtml.includes('id="btn-refresh-preview"'), 'btn-refresh-preview exists');

    // Top-right utility buttons are compact icon-only with tooltips
    assert.ok(indexHtml.includes('id="btn-export-dropdown-toggle"'), 'btn-export-dropdown-toggle exists');
    assert.ok(indexHtml.includes('id="btn-open-guide-modal"'), 'btn-open-guide-modal exists');
    assert.ok(indexHtml.includes('id="btn-theme-cycle"'), 'btn-theme-cycle exists');
    assert.ok(indexHtml.includes('id="btn-popout"'), 'btn-popout exists');
    assert.ok(appCss.includes('.btn-tool.btn-theme-cycle {\n  width: 36px;\n  height: 36px;'), 'theme cycle button is compact 36x36 icon-only');
    assert.ok(appCss.includes('.btn-tool.btn-export-dropdown {\n  width: 36px;\n  height: 36px;'), 'export button is compact 36x36 icon-only');
  });
});

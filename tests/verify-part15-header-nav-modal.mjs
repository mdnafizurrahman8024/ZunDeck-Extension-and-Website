import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import { getMotherShowcaseFallback } from '../core/data/mother-showcase.js';
import {
  renderGuideAndPromptsHtml,
  GuideAndPromptsController,
  PROMPT_LIBRARY,
  USER_GUIDES
} from '../core/ui/guide-and-prompts.js';
import { renderVibeStudioHtml } from '../core/ui/vibe-studio-panel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Part-15: Exact 1:1 Header Nav, Sub-Toolbar Auto-Fit, Modal & Vibe Header Fixes', () => {
  const profile = getMotherShowcaseFallback();

  it('1. Exact 1:1 Header Navigation matches mdnafizurrahman8024.github.io structure', () => {
    const html = renderPortfolioHtml(profile, { templateId: 'acad-flagship', theme: 'dark' });

    // Top Navigation Bar
    assert.ok(html.includes('class="navbar"') && (html.includes('id="navbar"') || html.includes('id="top-navbar"')), 'navbar container exists');
    assert.ok(html.includes('class="nav-brand"'), 'nav-brand exists');
    assert.ok(html.includes('class="nav-brand-avatar"'), 'nav-brand-avatar exists');
    assert.ok(html.includes('class="nav-brand-name"'), 'nav-brand-name exists');
    assert.ok(html.includes('class="nav-brand-sub'), 'nav-brand-sub exists');

    // Primary Nav Menu
    assert.ok(html.includes('id="nav-menu"'), 'nav-menu ul exists');
    assert.ok(html.includes('href="#about"'), 'about link exists');
    assert.ok(html.includes('href="#education"'), 'education link exists');
    assert.ok(html.includes('href="#updates"'), 'updates link exists');
    assert.ok(html.includes('href="#research"'), 'research link exists');
    assert.ok(html.includes('href="#projects"'), 'projects link exists');
    assert.ok(html.includes('href="#skills"'), 'skills link exists');
    assert.ok(html.includes('href="#publications"'), 'publications link exists');
    assert.ok(html.includes('href="#training"'), 'training link exists');

    // Responsive compact/full text classes
    assert.ok(html.includes('class="nav-text-full"'), 'nav-text-full exists');
    assert.ok(html.includes('class="nav-text-compact"'), 'nav-text-compact exists');

    // "More ▾" Dropdown Menu
    assert.ok(html.includes('id="nav-dropdown-more"'), 'nav-dropdown-more exists');
    assert.ok(html.includes('id="more-dropdown-btn"'), 'more-dropdown-btn exists');
    assert.ok(html.includes('id="nav-dropdown-menu"'), 'nav-dropdown-menu exists');
    assert.ok(html.includes('href="#leadership"'), 'leadership in more dropdown exists');
    assert.ok(html.includes('href="#gallery"'), 'gallery in more dropdown exists');
    assert.ok(html.includes('href="#references"'), 'references in more dropdown exists');
    assert.ok(html.includes('href="#contact"'), 'contact in more dropdown exists');

    // 3-Line Hamburger Button & Universal Navigation Drawer
    assert.ok(html.includes('id="header-nav-toggle"'), 'header-nav-toggle 3-line hamburger button exists');
    assert.ok(html.includes('onclick="window.toggleUniversalNav(event)"'), 'toggleUniversalNav click handler wired');
    assert.ok(html.includes('id="universal-nav-drawer"'), 'universal-nav-drawer exists as direct child');
    assert.ok(html.includes('class="universal-nav-inner'), 'universal-nav-inner exists');
    assert.ok(html.includes('class="universal-nav-link'), 'universal-nav-link pills exist');

    // JavaScript behaviors
    assert.ok(html.includes('window.toggleUniversalNav = function'), 'window.toggleUniversalNav defined in script');
    assert.ok(html.includes('openUniversalNav'), 'openUniversalNav defined in script');
    assert.ok(html.includes('closeUniversalNav'), 'closeUniversalNav defined in script');
    assert.ok(html.includes('scrollIntoView({ behavior: \'smooth\''), 'smooth scroll without page reload present');
    assert.ok(html.includes('nav-tab-active'), 'nav-tab-active class handled in script');
  });

  it('2. Preview Sub-Toolbar Layout: single-row flex with zero button overlap', () => {
    const appCss = fs.readFileSync(path.join(rootDir, 'apps/web/css/app.css'), 'utf-8');
    const indexHtml = fs.readFileSync(path.join(rootDir, 'apps/web/index.html'), 'utf-8');

    assert.ok(appCss.includes('.canvas-toolbar {') && appCss.includes('overflow-x: auto;'), 'canvas-toolbar protects against row wrapping');
    assert.ok(appCss.includes('.canvas-actions {') && appCss.includes('white-space: nowrap;') && appCss.includes('flex-shrink: 0;'), 'canvas-actions enforces single-row nowrap');
    assert.ok(appCss.includes('.showcase-status-bar {') && appCss.includes('white-space: nowrap;'), 'showcase-status-bar enforces nowrap');
    assert.ok(appCss.includes('.canvas-zoom-group {') && appCss.includes('flex-shrink: 0;'), 'canvas-zoom-group protects against shrinking');

    // Verify DOM structure in index.html
    assert.ok(indexHtml.includes('id="btn-clone-edit-blueprint"'), 'btn-clone-edit-blueprint exists');
    assert.ok(indexHtml.includes('id="btn-reset-demo-blueprint"'), 'btn-reset-demo-blueprint exists');
    assert.ok(indexHtml.includes('id="canvas-zoom-group"'), 'canvas-zoom-group exists');
    assert.ok(indexHtml.includes('id="btn-refresh-preview"'), 'btn-refresh-preview exists');
  });

  it('3. User Manual & Prompt Library: reliable tabs, category filtering, and modal styling', () => {
    const appCss = fs.readFileSync(path.join(rootDir, 'apps/web/css/app.css'), 'utf-8');

    // Pane display styling
    assert.ok(appCss.includes('.gp-tab-pane {') && appCss.includes('display: none;'), '.gp-tab-pane is hidden by default');
    assert.ok(appCss.includes('.gp-tab-pane.active {') && appCss.includes('display: block;'), '.gp-tab-pane.active is visible');

    // Initial render HTML
    const htmlPrompts = renderGuideAndPromptsHtml('prompts', 'all', '');
    assert.ok(htmlPrompts.includes('id="gp-pane-prompts"'), 'prompts pane exists');
    assert.ok(htmlPrompts.includes('id="gp-pane-manual"'), 'manual pane exists');
    assert.ok(htmlPrompts.includes('display: block;'), 'active pane has display: block');
    assert.ok(htmlPrompts.includes('display: none;'), 'inactive pane has display: none');

    const htmlManual = renderGuideAndPromptsHtml('manual', 'all', '');
    assert.ok(htmlManual.includes('ZunDeck Complete System Manual'), 'manual content renders cleanly');

    // Filter prompts function
    const htmlFiltered = renderGuideAndPromptsHtml('prompts', 'academic', '');
    assert.ok(htmlFiltered.includes('gp-prompt-card'), 'filtered prompts card rendered');

    // Controller functionality
    let selectedPrompt = null;
    const dummyMount = {
      innerHTML: '',
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {}
    };
    const ctrl = new GuideAndPromptsController({
      container: dummyMount,
      onSelectPrompt: (p) => { selectedPrompt = p; }
    });
    assert.equal(ctrl.activeTab, 'prompts');
    assert.equal(ctrl.activeCategory, 'all');
  });

  it('4. Vibe Coding Agent: clean header tools, no overlapping buttons, and accessible close button', () => {
    const appCss = fs.readFileSync(path.join(rootDir, 'apps/web/css/app.css'), 'utf-8');
    const vibeHtml = renderVibeStudioHtml({ isPromptPaneOpen: true });

    assert.ok(appCss.includes('.vibe-top-bar {') && (appCss.includes('flex-wrap: wrap;') || appCss.includes('flex-wrap: nowrap;')), 'vibe-top-bar has flexible wrapping layout');
    assert.ok(appCss.includes('.vibe-header-tools {') && (appCss.includes('flex-wrap: wrap;') || appCss.includes('flex-wrap: nowrap;')), 'vibe-header-tools has flexible wrapping layout');
    assert.ok(appCss.includes('.btn-close-prompt-pane {') && appCss.includes('width: 28px;'), 'btn-close-prompt-pane is styled with dedicated class');

    assert.ok(vibeHtml.includes('id="btn-toggle-prompt-chat"'), 'btn-toggle-prompt-chat exists in header');
    assert.ok(vibeHtml.includes('id="btn-open-timeline"'), 'btn-open-timeline exists in header');
    assert.ok(vibeHtml.includes('id="btn-open-ai-settings"'), 'btn-open-ai-settings exists in header');
    assert.ok(vibeHtml.includes('id="btn-close-prompt-pane"'), 'btn-close-prompt-pane exists on prompt pane');
    assert.ok(vibeHtml.includes('fa-xmark'), 'close button includes clear xmark icon');
  });

  it('5. Clean Top-Right App Header: pop-out arrow removed, 3 streamlined tools remain', () => {
    const indexHtml = fs.readFileSync(path.join(rootDir, 'apps/web/index.html'), 'utf-8');

    assert.ok(!indexHtml.includes('id="btn-popout"'), 'btn-popout icon completely removed from top header');
    assert.ok(indexHtml.includes('id="btn-export-dropdown-toggle"'), 'btn-export-dropdown-toggle remains present');
    assert.ok(indexHtml.includes('id="btn-open-guide-modal"'), 'btn-open-guide-modal remains present');
    assert.ok(indexHtml.includes('id="btn-theme-cycle"'), 'btn-theme-cycle remains present');
  });
});

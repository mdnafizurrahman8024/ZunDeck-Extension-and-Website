import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  moveItem,
  moveItemUp,
  moveItemDown,
  reorderSections,
  reorderItems
} from '../core/ui/drag-reorder.js';

import {
  BADGE_PRESETS,
  renderBadgePill,
  createItemMetadata,
  sanitizeItemMetadata
} from '../core/ui/badge-picker.js';

import {
  LINK_PLATFORMS,
  normalizeLinks,
  renderLinksEditorHtml
} from '../core/ui/links-manager.js';

import {
  normalizeDoi,
  normalizeOrcid,
  isValidDoi,
  isValidOrcid,
  fetchPublicationByDoi,
  fetchWorksByOrcid,
  formatCitation
} from '../core/parsers/doi-orcid-fetcher.js';

import {
  LOCATION_PRESETS,
  updateProfileLocation,
  updateProfileContactConfig
} from '../core/ui/location-contact-editor.js';

import {
  VIEWPORT_PRESETS,
  LivePreviewController
} from '../core/ui/live-preview.js';

import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import { renderCvHtml } from '../core/engines/cv-engine.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('Drag-and-Drop and Array Reordering logic correctly manipulates item positions', () => {
  const initial = ['edu-1', 'edu-2', 'edu-3', 'edu-4'];

  // Move item forward
  const movedForward = moveItem(initial, 0, 2);
  assert.deepEqual(movedForward, ['edu-2', 'edu-3', 'edu-1', 'edu-4']);

  // Move item backward
  const movedBackward = moveItem(movedForward, 2, 0);
  assert.deepEqual(movedBackward, initial);

  // Move item up (accessible button)
  const up = moveItemUp(initial, 2);
  assert.deepEqual(up, ['edu-1', 'edu-3', 'edu-2', 'edu-4']);

  // Move item down (accessible button)
  const down = moveItemDown(initial, 1);
  assert.deepEqual(down, ['edu-1', 'edu-3', 'edu-2', 'edu-4']);

  // Boundary checks
  assert.deepEqual(moveItemUp(initial, 0), initial, 'Moving first item up leaves array unchanged');
  assert.deepEqual(moveItemDown(initial, initial.length - 1), initial, 'Moving last item down leaves array unchanged');

  // Reorder sections in profile
  const sampleProfile = JSON.parse(JSON.stringify(fallbackData));
  const newOrder = ['projects', 'education', 'publications', 'research'];
  const updatedProfile = reorderSections(sampleProfile, newOrder);
  assert.deepEqual(updatedProfile.displayConfig.sectionOrder.slice(0, 4), newOrder);

  // Reorder specific collection items
  const origFirstId = sampleProfile.publications[0].id;
  const origSecondId = sampleProfile.publications[1].id;
  const reorderedPublications = reorderItems(sampleProfile, 'publications', 0, 1);
  assert.equal(reorderedPublications.publications[0].id, origSecondId);
  assert.equal(reorderedPublications.publications[1].id, origFirstId);
});

test('Badge Picker provides official presets and sanitizes item metadata and links', () => {
  assert.ok(BADGE_PRESETS.length >= 8, 'Badge picker must have at least 8 presets');

  const awardPreset = BADGE_PRESETS.find((p) => p.id === 'award');
  assert.ok(awardPreset, 'Award preset must exist');

  const pillHtml = renderBadgePill('Principal Investigator', '#16a34a');
  assert.ok(pillHtml.includes('Principal Investigator'));
  assert.ok(pillHtml.includes('#16a34a'));

  // Test metadata creation and sanitization
  const meta = createItemMetadata({
    badge: 'Award',
    badgeColor: '#dc2626',
    credentialId: 'MED-2024-99',
    verificationUrl: 'https://example.com/verify?id=99',
    summary: 'Best Academic Award',
    tags: ['Medicine', 'Genomics']
  });
  assert.equal(meta.badge, 'Award');
  assert.equal(meta.credentialId, 'MED-2024-99');

  // Malicious URL sanitization
  const dirty = {
    badge: '<script>alert(1)</script>',
    verificationUrl: 'javascript:alert("pwned")',
    credentialId: '<b>123</b>',
    tags: ['<b>bold</b>']
  };
  const sanitized = sanitizeItemMetadata(dirty);
  assert.equal(sanitized.verificationUrl, '#', 'javascript: URLs must be sanitized to #');
  assert.ok(!sanitized.badge.includes('<script>'), 'HTML in badge must be stripped');
});

test('Links Hub supports 16 platforms with independent Portfolio vs CV visibility', () => {
  assert.ok(LINK_PLATFORMS.length >= 16, 'Links Hub must support 16 official platforms');
  const keys = LINK_PLATFORMS.map((p) => p.key);
  assert.ok(keys.includes('scholar'));
  assert.ok(keys.includes('orcid'));
  assert.ok(keys.includes('researchgate'));
  assert.ok(keys.includes('github'));
  assert.ok(keys.includes('linkedin'));

  const rawLinks = {
    scholar: 'https://scholar.google.com/citations?user=xyz',
    github: 'https://github.com/myname',
    custom: [
      { label: 'Lab Website', url: 'https://mylab.org' }
    ]
  };

  const normalized = normalizeLinks(rawLinks);
  assert.equal(normalized.scholar, 'https://scholar.google.com/citations?user=xyz');
  assert.equal(normalized.custom.length, 1);
  assert.equal(normalized.custom[0].label, 'Lab Website');

  const editorHtml = renderLinksEditorHtml(normalized);
  assert.ok(editorHtml.includes('link-scholar'));
  assert.ok(editorHtml.includes('Lab Website'));
  assert.ok(editorHtml.includes('data-vis-target="portfolio"'));
  assert.ok(editorHtml.includes('data-vis-target="cv"'));
});

test('DOI and ORCID fetcher correctly validates and parses academic identifiers', async () => {
  // DOI validation & normalization
  assert.equal(normalizeDoi('https://doi.org/10.1016/j.vetmic.2023.109823'), '10.1016/j.vetmic.2023.109823');
  assert.equal(normalizeDoi('doi:10.1016/j.vetmic.2023.109823'), '10.1016/j.vetmic.2023.109823');
  assert.equal(normalizeDoi('10.1016/j.vetmic.2023.109823'), '10.1016/j.vetmic.2023.109823');
  assert.ok(isValidDoi('10.1016/j.vetmic.2023.109823'));
  assert.ok(!isValidDoi('not-a-doi'));

  // ORCID validation & normalization
  assert.equal(normalizeOrcid('https://orcid.org/0009-0002-6003-8201'), '0009-0002-6003-8201');
  assert.equal(normalizeOrcid('0009-0002-6003-8201'), '0009-0002-6003-8201');
  assert.ok(isValidOrcid('0009-0002-6003-8201'));
  assert.ok(!isValidOrcid('invalid-orcid-1234'));

  // Fetch publication by DOI (with fallbackMock for offline/sandboxed test execution)
  const pub = await fetchPublicationByDoi('10.1016/j.vetmic.2023.109823', { fallbackMock: true });
  assert.ok(pub);
  assert.ok(pub.title);
  assert.ok(pub.authors && pub.authors.length > 0);
  assert.ok(pub.doi);

  // Citation formatting
  const apaCitation = formatCitation(pub, 'apa');
  assert.ok(typeof apaCitation === 'string');
  assert.ok(apaCitation.includes(pub.title));

  const vancouverCitation = formatCitation(pub, 'vancouver');
  assert.ok(typeof vancouverCitation === 'string');
  assert.ok(vancouverCitation.includes(pub.title));

  // Fetch works by ORCID (with fallbackMock for offline/sandboxed test execution)
  const works = await fetchWorksByOrcid('0009-0002-6003-8201', { fallbackMock: true });
  assert.ok(Array.isArray(works));
  assert.ok(works.length > 0);
  assert.ok(works[0].title);
});

test('Location Map Picker and Contact modes update profile structure cleanly', () => {
  assert.ok(LOCATION_PRESETS.length >= 4);

  const sampleProfile = JSON.parse(JSON.stringify(fallbackData));
  const updatedLoc = updateProfileLocation(sampleProfile, {
    city: 'Copenhagen',
    country: 'Denmark',
    lat: 55.6761,
    lon: 12.5683,
    zoom: 13
  });
  assert.equal(updatedLoc.identity.location.city, 'Copenhagen');
  assert.equal(updatedLoc.identity.location.lat, 55.6761);

  // Update contact configuration
  const updatedContact = updateProfileContactConfig(sampleProfile, {
    mode: 'form',
    formEndpoint: 'https://api.web3forms.com/submit',
    formAccessKey: 'test-key-123',
    subject: 'Collaboration Inquiry',
    allowDirectEmail: true
  });
  assert.equal(updatedContact.displayConfig.contactConfig.mode, 'form');
  assert.equal(updatedContact.displayConfig.contactConfig.formAccessKey, 'test-key-123');
});

test('Live Preview Controller renders Portfolio and CV across responsive viewports', () => {
  assert.equal(VIEWPORT_PRESETS.laptop.width, '1440px');
  assert.equal(VIEWPORT_PRESETS.tablet.width, '980px');
  assert.equal(VIEWPORT_PRESETS.mobile.width, '390px');
  assert.equal(VIEWPORT_PRESETS.a4.width, '794px');

  const sampleProfile = JSON.parse(JSON.stringify(fallbackData));
  sampleProfile.displayConfig.cardGridColumns = '3x';
  sampleProfile.displayConfig.gradientBorders = 'hero';
  sampleProfile.displayConfig.seeAllLimit = {
    publications: 2,
    projects: 3,
    education: 4
  };

  const preview = new LivePreviewController({
    profile: sampleProfile,
    mode: 'portfolio',
    templateId: 'acad-flagship'
  });

  const portfolioHtml = preview.generateHtml();
  assert.ok(portfolioHtml.includes('<!DOCTYPE html>'));
  assert.ok(portfolioHtml.includes('repeat(3, 1fr)') || portfolioHtml.includes('grid-template-columns'));
  assert.ok(portfolioHtml.includes('.about-hero-card') || portfolioHtml.includes('about-hero'));
  assert.ok(portfolioHtml.includes('layout-container') || portfolioHtml.includes('split-layout-wrapper'));

  // Switch to CV mode
  preview.setMode('cv');
  const cvHtml = preview.generateHtml();
  assert.ok(cvHtml.includes('<!DOCTYPE html>'));
  assert.ok(cvHtml.includes('cv-sheet-container') || cvHtml.includes('cv-entry'));

  // Viewport switching
  preview.setViewport('mobile');
  assert.equal(preview.viewport, 'mobile');
  preview.setViewport('a4');
  assert.equal(preview.viewport, 'a4');
});

test('Web Companion index.html includes Visual Editor UI components and responsive toggle bar', () => {
  const indexPath = path.join(ROOT_DIR, 'apps', 'web', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  assert.ok(indexHtml.includes('id="tab-mode-editor"'), 'Visual Editor tab button must exist');
  assert.ok(indexHtml.includes('id="editor-workspace"'), 'Split-Screen Editor Workspace container must exist');
  assert.ok(indexHtml.includes('id="visual-editor-container"'), 'Visual Editor sidebar container must exist');
  assert.ok(indexHtml.includes('id="editor-preview-stage"'), 'Live Preview stage must exist');
  assert.ok(indexHtml.includes('id="btn-toggle-editor-form"'), 'Responsive mobile toggle form button must exist');
  assert.ok(indexHtml.includes('id="btn-toggle-editor-preview"'), 'Responsive mobile toggle preview button must exist');
  assert.ok(indexHtml.includes('data-viewport="a4"'), 'A4 Viewport switch button must exist');
  assert.ok(indexHtml.includes('id="btn-editor-popout"'), 'Pop-out Full-Tab Preview button must exist');
});

test('Extension sidepanel.html includes Visual Editor container and Pop-out Preview button', () => {
  const spPath = path.join(ROOT_DIR, 'apps', 'extension', 'sidepanel.html');
  const spHtml = fs.readFileSync(spPath, 'utf8');

  assert.ok(spHtml.includes('id="sp-visual-editor-container"'), 'Extension sidepanel visual editor container must exist');
  assert.ok(spHtml.includes('id="btn-sp-popout-preview"'), 'Extension popout preview button must exist');
});

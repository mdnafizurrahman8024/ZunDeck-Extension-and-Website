import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseDriveUrl,
  getDriveEmbedUrl,
  getDriveOpenUrl,
  detectDocType,
  renderDrivePreviewModalHtml,
  isSafeDocumentUrl,
  DOC_TYPES
} from '../core/parsers/drive-embed.js';

import {
  COMPRESSION_THRESHOLD_BYTES,
  isHeavyImage,
  formatFileSize,
  estimateCompression,
  optimizeImageBlob,
  processUploadedImage,
  restoreOriginal,
  restoreAllOriginals,
  renderConsentDialogHtml,
  OPTIMIZATION_PRESETS
} from '../core/media/image-optimizer.js';

import {
  putOriginalBlob,
  getOriginalBlob,
  putBlob,
  getBlob,
  clearMemoryStore
} from '../core/storage/indexeddb-store.js';

import {
  renderMediaManagerHtml,
  MediaManagerController
} from '../core/ui/media-manager.js';

import {
  renderDocsManagerHtml,
  DocsManagerController
} from '../core/ui/docs-manager.js';

import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('Google Drive, Slides and Docs URLs strictly convert to valid non-error embed formats', () => {
  const driveId = '1A2b3C4D5E6F7G8H9I0J-kLmNoP';

  // 1. Google Drive file URL with view?usp=sharing
  const driveViewUrl = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
  const parsedDrive = parseDriveUrl(driveViewUrl);
  assert.equal(parsedDrive.service, 'drive');
  assert.equal(parsedDrive.id, driveId);
  assert.equal(parsedDrive.embedUrl, `https://drive.google.com/file/d/${driveId}/preview`);
  assert.ok(parsedDrive.isSafe);

  // 2. Google Drive open?id= format
  const driveOpenUrl = `https://drive.google.com/open?id=${driveId}`;
  assert.equal(getDriveEmbedUrl(driveOpenUrl), `https://drive.google.com/file/d/${driveId}/preview`);

  // 3. Drive .pptx files MUST NOT be misrouted to docs.google.com/presentation (prevents iframe "We're sorry" errors)
  const drivePptxUrl = `https://drive.google.com/file/d/${driveId}/view?usp=drive_link`;
  const pptxEmbed = getDriveEmbedUrl(drivePptxUrl);
  assert.equal(pptxEmbed, `https://drive.google.com/file/d/${driveId}/preview`);
  assert.ok(!pptxEmbed.includes('docs.google.com/presentation'), 'Must NOT misroute Drive files to Google Slides');

  // 4. Native Google Slides presentation URL
  const slidesId = '2B3c4D5E6F7G8H9I0J1K2L3M4N5O';
  const slidesUrl = `https://docs.google.com/presentation/d/${slidesId}/edit?usp=sharing`;
  const parsedSlides = parseDriveUrl(slidesUrl);
  assert.equal(parsedSlides.service, 'presentation');
  assert.equal(parsedSlides.id, slidesId);
  assert.equal(parsedSlides.embedUrl, `https://docs.google.com/presentation/d/${slidesId}/embed?start=false&loop=false&delayms=3000`);

  // 5. Native Google Docs document URL
  const docId = '3C4d5E6F7G8H9I0J1K2L3M4N5O6P';
  const docUrl = `https://docs.google.com/document/d/${docId}/edit?tab=t.0`;
  const parsedDoc = parseDriveUrl(docUrl);
  assert.equal(parsedDoc.service, 'document');
  assert.equal(parsedDoc.id, docId);
  assert.equal(parsedDoc.embedUrl, `https://docs.google.com/document/d/${docId}/preview`);

  // 6. Native Google Sheets spreadsheet URL
  const sheetId = '4D5e6F7G8H9I0J1K2L3M4N5O6P7Q';
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  const parsedSheet = parseDriveUrl(sheetUrl);
  assert.equal(parsedSheet.service, 'spreadsheet');
  assert.equal(parsedSheet.embedUrl, `https://docs.google.com/spreadsheets/d/${sheetId}/preview`);
});

test('Unsafe and malicious URLs are strictly rejected by drive parser and document validators', () => {
  const unsafeUrls = [
    'javascript:alert("pwned")',
    'javascript:/*--></title></style></textarea></script><svg/onload=alert(1)>',
    'vbscript:msgbox("xss")',
    'data:text/html,<script>alert(1)</script>',
    '',
    null,
    undefined
  ];

  for (const u of unsafeUrls) {
    assert.equal(isSafeDocumentUrl(u), false, `URL should be marked unsafe: ${u}`);
    const parsed = parseDriveUrl(u);
    assert.equal(parsed.isSafe, false, `Parsed result should be marked unsafe: ${u}`);
    assert.equal(getDriveEmbedUrl(u), null, `Embed URL should be null for unsafe input: ${u}`);
  }
});

test('Document type detector correctly categorizes presentations, documents, PDFs and Drive items', () => {
  assert.equal(detectDocType('https://docs.google.com/presentation/d/123/edit'), 'Presentation Slides');
  assert.equal(detectDocType('', 'research_presentation.pptx'), 'Presentation Slides');
  assert.equal(detectDocType('https://docs.google.com/document/d/123/edit'), 'Word Document');
  assert.equal(detectDocType('', 'thesis_draft.docx'), 'Word Document');
  assert.equal(detectDocType('https://example.org/paper.pdf'), 'PDF');
  assert.equal(detectDocType('', 'curriculum_vitae.pdf'), 'PDF');
  assert.equal(detectDocType('https://drive.google.com/file/d/123/view'), 'Google Drive');
  assert.equal(detectDocType('https://example.org/resource'), 'External Resource');
});

test('Consent Image Compression accurately tracks originalBlobId and restores original byte-for-byte', async () => {
  clearMemoryStore();

  // Test heavy image threshold (> 400 KB)
  assert.equal(isHeavyImage(350 * 1024), false);
  assert.equal(isHeavyImage(450 * 1024), true);

  // Test estimation calculations
  const originalBytes = 6.4 * 1024 * 1024; // 6.4 MB
  const est = estimateCompression(originalBytes, 'high-dpi');
  assert.ok(est.estimatedBytes < originalBytes);
  assert.ok(est.reductionPercent >= 70);

  // Test file size formatting
  assert.equal(formatFileSize(1024), '1 KB');
  assert.equal(formatFileSize(1024 * 1024 * 2.5), '2.5 MB');

  // Simulated upload with heavy file (1.2 MB)
  const syntheticRawContent = 'SYNTHETIC_HIGH_RESOLUTION_RAW_IMAGE_DATA_BYTES_'.repeat(25000); // ~1.2 MB
  const syntheticFile = new Blob([syntheticRawContent], { type: 'image/jpeg' });
  syntheticFile.name = 'microscopy_cell_culture.jpg';
  syntheticFile.content = syntheticRawContent;

  const processed = await processUploadedImage(syntheticFile, {
    preset: 'high-dpi',
    initialUrl: 'blob:http://localhost/test-uuid'
  });

  assert.ok(processed.id);
  assert.ok(processed.originalBlobId);
  assert.ok(processed.isOptimized);
  assert.equal(processed.name, 'microscopy_cell_culture.jpg');
  assert.equal(processed.originalSize, syntheticRawContent.length);

  // Verify untouched original was saved in IndexedDB originals store
  const storedOriginal = await getOriginalBlob(processed.originalBlobId);
  assert.ok(storedOriginal, 'Original blob must exist in IndexedDB store');
  assert.equal(storedOriginal.blob.content, syntheticRawContent);

  // Test Restore / Undo Compression
  const restored = await restoreOriginal(processed);
  assert.equal(restored.isOptimized, false);
  assert.equal(restored.preset, 'original');

  // Batch restore
  const batch = [
    { ...processed, id: 'item-1' },
    { ...processed, id: 'item-2' }
  ];
  const allRestored = await restoreAllOriginals(batch);
  assert.equal(allRestored.length, 2);
  assert.equal(allRestored[0].isOptimized, false);
  assert.equal(allRestored[1].isOptimized, false);
});

test('Media Manager and Docs Manager UI render clean interactive cards and dropzones', () => {
  // Test Media Manager render
  const sampleMediaList = [
    {
      id: 'm-1',
      name: 'Plate_Culture_Observation.jpg',
      url: 'https://example.com/plate.jpg',
      originalSize: 2.4 * 1024 * 1024,
      optimizedSize: 320 * 1024,
      isOptimized: true,
      caption: 'Gram-negative bacterial morphology'
    }
  ];

  const mediaHtml = renderMediaManagerHtml(sampleMediaList, {
    title: 'Laboratory Evidence & Artifacts',
    context: 'evidence'
  });

  assert.ok(mediaHtml.includes('Plate_Culture_Observation.jpg'));
  assert.ok(mediaHtml.includes('data-action="undo-compress"'), 'Undo button must be present on optimized items');
  assert.ok(mediaHtml.includes('data-action="restore-all-originals"'), 'Bulk restore button must be present');
  assert.ok(mediaHtml.includes('Gram-negative bacterial morphology'));
  assert.ok(mediaHtml.includes('data-dropzone="true"'));

  // Test Docs Manager render
  const sampleDocsList = [
    {
      id: 'd-1',
      title: 'PoultryMedix Project Pitch Deck',
      docType: 'Presentation Slides',
      date: '2026-08',
      url: 'https://docs.google.com/presentation/d/1A2b3C4D5E/edit'
    }
  ];

  const docsHtml = renderDocsManagerHtml(sampleDocsList, {
    title: 'Research Briefs & Slides',
    sectionTag: 'Projects'
  });

  assert.ok(docsHtml.includes('PoultryMedix Project Pitch Deck'));
  assert.ok(docsHtml.includes('Presentation Slides'));
  assert.ok(docsHtml.includes('data-action="preview"'), 'Preview button must be present for viewable documents');
  assert.ok(docsHtml.includes('data-pdf-dropzone="true"'), 'Direct PDF dropzone must exist');

  // Test Consent Dialog HTML
  const dialogHtml = renderConsentDialogHtml([
    { name: 'photo1.jpg', size: 3.5 * 1024 * 1024 },
    { name: 'photo2.jpg', size: 2.9 * 1024 * 1024 }
  ]);
  assert.ok(dialogHtml.includes('Consent Image Optimization'));
  assert.ok(dialogHtml.includes('High-DPI Crisp (Recommended)'));
  assert.ok(dialogHtml.includes('Keep 100% Originals'));

  // Test Drive Preview Modal HTML
  const modalHtml = renderDrivePreviewModalHtml(sampleDocsList[0]);
  assert.ok(modalHtml.includes('PoultryMedix Project Pitch Deck'));
  assert.ok(modalHtml.includes('docs.google.com/presentation/d/1A2b3C4D5E/embed'));
  assert.ok(modalHtml.includes('Open in New Tab / Drive'));
  assert.ok(modalHtml.includes('Anyone with the link'));
});

test('Portfolio Engine renders Documents and Gallery sections with object and link support', () => {
  const profileWithMedia = JSON.parse(JSON.stringify(fallbackData));
  profileWithMedia.documents = [
    {
      id: 'doc-thesis',
      title: 'Undergraduate DVM Honors Thesis',
      docType: 'PDF',
      date: '2026-09',
      url: 'https://example.com/thesis.pdf'
    }
  ];
  profileWithMedia.gallery = [
    {
      url: 'https://example.com/field1.jpg',
      caption: 'Field Triage Survey'
    }
  ];

  const html = renderPortfolioHtml(profileWithMedia, { templateId: 'acad-flagship' });
  assert.ok(html.includes('id="documents"'), 'Titled documents section must exist when documents are present');
  assert.ok(html.includes('Undergraduate DVM Honors Thesis'));
  assert.ok(html.includes('id="gallery"'), 'Gallery section must exist when gallery photos are present');
  assert.ok(html.includes('Field Triage Survey'));
});

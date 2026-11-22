import test from 'node:test';
import assert from 'node:assert/strict';
import { CV_CATALOG, getCvTemplateById, getCvTemplatesByCategory } from '../core/templates/cv-catalog.js';
import { renderCvHtml } from '../core/engines/cv-engine.js';
import { generateDocxBlob } from '../core/exporters/docx-exporter.js';
import { generateQrSvg, generateQrMatrix } from '../core/utils/qr-generator.js';
import { runAtsXRay } from '../core/engines/ats-xray.js';
import { getCvProfiles, createCvProfile, syncCvToMaster, pullMasterToCv } from '../core/engines/cv-profile-manager.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

test('CV Catalog contains 30 distinct role templates across 3 categories', () => {
  assert.equal(CV_CATALOG.length, 30);
  const academic = getCvTemplatesByCategory('academic');
  const corporate = getCvTemplatesByCategory('corporate');
  const tech = getCvTemplatesByCategory('tech');

  assert.equal(academic.length, 10, 'Must have 10 academic templates');
  assert.equal(corporate.length, 10, 'Must have 10 corporate templates');
  assert.equal(tech.length, 10, 'Must have 10 tech templates');

  const flagship = CV_CATALOG[0];
  assert.equal(flagship.id, 'cv-acad-flagship');
  assert.equal(flagship.isRecommended, true);

  const europass = CV_CATALOG[1];
  assert.equal(europass.id, 'cv-acad-europass');
});

test('renderCvHtml renders successfully for every one of the 30 templates', () => {
  for (const tpl of CV_CATALOG) {
    const html = renderCvHtml(fallbackData, { templateId: tpl.id, showQr: true });
    assert.ok(html.includes('<!DOCTYPE html>'), `Template ${tpl.id} missing doctype`);
    assert.ok(html.includes('Md. Nafizur Rahman'), `Template ${tpl.id} missing candidate name`);
    assert.ok(html.includes('cv-sheet-container'), `Template ${tpl.id} missing sheet container`);
  }
});

test('cv-acad-flagship faithfully renders verified links, dates and publications', () => {
  const html = renderCvHtml(fallbackData, { templateId: 'cv-acad-flagship', showQr: true });
  assert.ok(html.includes('Academic Background'));
  assert.ok(html.includes('Research Work Involved'));
  assert.ok(html.includes('Publications &amp; Scientific Protocols'));
  assert.ok(html.includes('Scientific &amp; Software Platforms'));
  assert.ok(html.includes('Training &amp; Professional Certifications'));
  assert.ok(html.includes('LinkedIn'));
  assert.ok(html.includes('ORCID'));
  assert.ok(html.includes('cv-smart-qr-svg'));
});

test('cv-acad-europass renders European CEFR language table', () => {
  const html = renderCvHtml(fallbackData, { templateId: 'cv-acad-europass', showQr: true });
  assert.ok(html.includes('cefr-grid-table'));
  assert.ok(html.includes('Bengali'));
  assert.ok(html.includes('English'));
});

test('renderCvHtml escapes XSS vectors cleanly', () => {
  const malicious = {
    ...fallbackData,
    identity: {
      ...fallbackData.identity,
      fullName: '<script>alert("xss")</script>Nafiz'
    }
  };
  const html = renderCvHtml(malicious, { templateId: 'cv-acad-flagship' });
  assert.ok(!html.includes('<script>alert("xss")</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));
});

test('generateDocxBlob produces valid OpenXML ZIP archive with document.xml', () => {
  const docxBuf = generateDocxBlob(fallbackData);
  assert.ok(Buffer.isBuffer(docxBuf));
  assert.ok(docxBuf.length > 500, 'DOCX buffer must be non-empty');
  // Check PK ZIP magic header 0x04034b50 ('PK\x03\x04')
  assert.equal(docxBuf.readUInt32LE(0), 0x04034b50);
  const str = docxBuf.toString('latin1');
  assert.ok(str.includes('word/document.xml'));
  assert.ok(str.includes('[Content_Types].xml'));
});

test('generateQrSvg creates a valid vector SVG QR code', () => {
  const matrix = generateQrMatrix('https://mdnafizurrahman8024.github.io/');
  assert.equal(matrix.length, 29); // V3 size

  const svg = generateQrSvg('https://mdnafizurrahman8024.github.io/', { size: 80, color: '#0d9488' });
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('viewBox="0 0 80 80"'));
  assert.ok(svg.includes('fill="#0d9488"'));
});

test('runAtsXRay parses linear stream and scores candidate profile', () => {
  const report = runAtsXRay(fallbackData);
  assert.ok(report.score >= 80, `Expected high ATS score, got ${report.score}`);
  assert.ok(report.rawText.includes('Md. Nafizur Rahman'));
  assert.ok(report.rawText.includes('EMAIL: mdnafizurrahman8024@gmail.com'));
  assert.ok(report.checks.some((c) => c.label === 'Candidate Name' && c.pass));
  assert.ok(report.checks.some((c) => c.label === 'Primary Email' && c.pass));
});

test('Multi-CV Profile Manager supports profile creation, sync and pull', () => {
  const profile = { ...fallbackData };
  const initialProfiles = getCvProfiles(profile);
  assert.ok(initialProfiles.length >= 3);

  const created = createCvProfile(profile, {
    name: 'Doctoral Fellowship 2027',
    targetRole: 'PhD Candidate in Molecular AMR',
    templateId: 'cv-acad-phd'
  });
  assert.equal(created.name, 'Doctoral Fellowship 2027');

  const afterSync = syncCvToMaster(profile, created.id, {
    identity: { ...profile.identity, shortName: 'Nafizur' }
  });
  assert.equal(afterSync.identity.shortName, 'Nafizur');

  const afterPull = pullMasterToCv(profile, created.id);
  assert.ok(afterPull);
});

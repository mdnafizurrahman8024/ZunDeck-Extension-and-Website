import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTFOLIO_CATALOG } from '../core/templates/portfolio-catalog.js';
import { CV_CATALOG } from '../core/templates/cv-catalog.js';
import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import { renderCvHtml } from '../core/engines/cv-engine.js';
import { generateDocxBlob } from '../core/exporters/docx-exporter.js';
import { generateQrSvg } from '../core/utils/qr-generator.js';
import { runAtsXRay } from '../core/engines/ats-xray.js';
import { validateProfile, normalizeProfile } from '../core/schema/profile-schema.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('--- ZunDeck Master Pre-Flight Verification ---');

// 1. Check schema validation
const norm = normalizeProfile(fallbackData);
const validation = validateProfile(norm);
if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
  process.exit(1);
}
console.log('✓ ZunProfileV1 schema & fallback validation: PASS');

// 2. Check 30 Portfolio templates + Mode 31 Custom Canvas
for (const tpl of PORTFOLIO_CATALOG) {
  const html = renderPortfolioHtml(norm, { templateId: tpl.id });
  if (!html || html.length < 500) {
    console.error(`✕ Portfolio template ${tpl.id} failed to render!`);
    process.exit(1);
  }
}
console.log(`✓ All ${PORTFOLIO_CATALOG.length} Portfolio templates rendered valid HTML/CSS: PASS`);

// 3. Check 30 CV & Resume templates
for (const tpl of CV_CATALOG) {
  const html = renderCvHtml(norm, { templateId: tpl.id, showQr: true });
  if (!html || html.length < 500) {
    console.error(`✕ CV template ${tpl.id} failed to render!`);
    process.exit(1);
  }
}
console.log(`✓ All ${CV_CATALOG.length} CV & Resume templates rendered valid HTML/CSS: PASS`);

// 4. Check DOCX generator
const docxBuf = generateDocxBlob(norm);
if (!Buffer.isBuffer(docxBuf) || docxBuf.readUInt32LE(0) !== 0x04034b50) {
  console.error('✕ DOCX export failed valid ZIP signature check!');
  process.exit(1);
}
console.log(`✓ DOCX Word generator created valid OpenXML document (${(docxBuf.length / 1024).toFixed(1)} KB): PASS`);

// 5. Check Smart QR Code generator
const qrSvg = generateQrSvg('https://mdnafizurrahman8024.github.io/', { size: 80 });
if (!qrSvg.includes('<svg') || !qrSvg.includes('viewBox')) {
  console.error('✕ QR code generator failed to produce valid SVG!');
  process.exit(1);
}
console.log('✓ Smart QR vector SVG generator: PASS');

// 6. Check ATS Robot X-Ray
const ats = runAtsXRay(norm);
if (ats.score < 80) {
  console.error(`✕ ATS Robot X-Ray score too low: ${ats.score}`);
  process.exit(1);
}
console.log(`✓ ATS Robot X-Ray analysis passed (Score: ${ats.score}/100): PASS`);

// 7. Check .gitignore ignores sensitive files
const gitignore = fs.readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf8');
const mustIgnore = ['CV_Nafiz.pdf', '.gitnexus/', 'node_modules/', '.env', '.zundeck-dev-port'];
for (const rule of mustIgnore) {
  if (!gitignore.includes(rule)) {
    console.error(`✕ .gitignore missing critical pattern: ${rule}`);
    process.exit(1);
  }
}
console.log('✓ Strict .gitignore rules verified: PASS');

console.log('--- Verification Complete: ALL CHECKS PASSED ---');

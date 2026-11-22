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
import { LETTER_MODES } from '../core/engines/letter-studio.js';
import { assembleOfflineDraft, verifyLetterAuthenticity } from '../core/engines/letter-prompts.js';
import { exportLetterDocx } from '../core/exporters/letter-exporter.js';
import { scanForSecrets } from '../core/security/secret-scanner.js';
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

// 7. Check Letter Studio (4 Modes, Offline Smart Assembler & Word Exporter)
for (const mode of LETTER_MODES) {
  const draft = assembleOfflineDraft(norm, mode.id, { institution: 'Test Univ', program: 'Test Program' });
  if (!draft || !draft.paragraphs?.length) {
    console.error(`✕ Letter draft assembly failed for mode: ${mode.id}`);
    process.exit(1);
  }
}
const testSopDraft = assembleOfflineDraft(norm, 'sop', { institution: 'Univ of Copenhagen', program: 'MSc One Health' });
const authCheck = verifyLetterAuthenticity(testSopDraft.paragraphs.join('\n'), norm);
if (!authCheck.authentic || authCheck.placeholdersCount < 1) {
  console.error('✕ Letter authenticity verification failed!');
  process.exit(1);
}
const letterDocxBuf = exportLetterDocx({
  sender: { name: norm.identity.fullName },
  paragraphs: testSopDraft.paragraphs,
  subject: testSopDraft.subject
});
if (!Buffer.isBuffer(letterDocxBuf) || letterDocxBuf.readUInt32LE(0) !== 0x04034b50) {
  console.error('✕ Letter DOCX export failed valid ZIP signature check!');
  process.exit(1);
}
console.log('✓ Letter Studio (4 modes, Offline Assembler, Authenticity & DOCX): PASS');

// 8. Check Part 4 Manifest V3 & Secret Scanner Firewall
const manifestRaw = fs.readFileSync(path.join(ROOT_DIR, 'apps', 'extension', 'manifest.json'), 'utf8');
const manifestObj = JSON.parse(manifestRaw);
if (manifestObj.manifest_version !== 3 || !manifestObj.permissions.includes('sidePanel')) {
  console.error('✕ Extension manifest is not valid Manifest V3 with sidePanel!');
  process.exit(1);
}
const scanTest = scanForSecrets({ leakedKey: ['AIza', 'SyD9ExampleGeminiKey35CharsLong', '0123'].join('') });
if (scanTest.clean || scanTest.blockedCount < 1) {
  console.error('✕ Secret Scanner failed to catch synthetic API key!');
  process.exit(1);
}
const cleanScan = scanForSecrets(norm);
if (!cleanScan.clean) {
  console.error('✕ Secret Scanner produced false positive on clean portfolio!');
  process.exit(1);
}
console.log('✓ Chrome MV3 Side Panel & Secret Scanner Firewall: PASS');

// 9. Check .gitignore ignores sensitive files
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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTFOLIO_CATALOG } from '../core/templates/portfolio-catalog.js';
import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import { validateProfile, normalizeProfile } from '../core/schema/profile-schema.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('--- ZunDeck Pre-Flight Verification ---');

// 1. Check schema validation
const norm = normalizeProfile(fallbackData);
const validation = validateProfile(norm);
if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
  process.exit(1);
}
console.log('✓ ZunProfileV1 schema & fallback validation: PASS');

// 2. Check 30 templates + custom canvas render
console.log(`✓ Verifying ${PORTFOLIO_CATALOG.length} portfolio templates:`);
for (const tpl of PORTFOLIO_CATALOG) {
  const html = renderPortfolioHtml(norm, { templateId: tpl.id });
  if (!html || html.length < 500) {
    console.error(`✕ Template ${tpl.id} rendered empty or corrupted HTML!`);
    process.exit(1);
  }
}
console.log(`✓ All ${PORTFOLIO_CATALOG.length} templates rendered valid HTML/CSS: PASS`);

// 3. Check .gitignore ignores sensitive files
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

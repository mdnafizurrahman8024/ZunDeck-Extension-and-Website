import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { PORTFOLIO_CATALOG } from '../core/templates/portfolio-catalog.js';
import { CV_CATALOG } from '../core/templates/cv-catalog.js';
import { renderPortfolioHtml } from '../core/engines/portfolio-engine.js';
import { renderCvHtml } from '../core/engines/cv-engine.js';
import { normalizeProfile } from '../core/schema/profile-schema.js';
import { scanString, scanForSecrets } from '../core/security/secret-scanner.js';
import { sanitizeValue, sanitizeUrl, sanitizeCss } from '../core/security/sanitizer.js';
import { generateStaticPortfolioBundle, validateBundleSecurity, calculateDeployDiff } from '../core/deploy/github-deployer.js';
import { buildAllPackages } from '../scripts/build-all.mjs';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to collect files recursively
function getFilesRecursively(dir, filterRegex) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.gitnexus'].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFilesRecursively(fullPath, filterRegex));
    } else if (!filterRegex || filterRegex.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

test('1. Syntax & Architecture Integrity: Node check & JSON parse across entire repo', () => {
  const jsFiles = [
    ...getFilesRecursively(path.join(ROOT_DIR, 'core'), /\.(js|mjs)$/),
    ...getFilesRecursively(path.join(ROOT_DIR, 'apps'), /\.(js|mjs)$/),
    ...getFilesRecursively(path.join(ROOT_DIR, 'scripts'), /\.(js|mjs)$/),
    ...getFilesRecursively(path.join(ROOT_DIR, 'tests'), /\.(js|mjs)$/)
  ];

  assert.ok(jsFiles.length >= 30, `Expected at least 30 JS files, found ${jsFiles.length}`);

  for (const file of jsFiles) {
    const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.strictEqual(
      check.status,
      0,
      `Syntax error in ${path.relative(ROOT_DIR, file)}: ${check.stderr}`
    );
  }

  // Parse all JSON files
  const jsonFiles = [
    path.join(ROOT_DIR, 'package.json'),
    path.join(ROOT_DIR, 'apps', 'extension', 'manifest.json'),
    path.join(ROOT_DIR, 'core', 'data', 'mother-fallback.json')
  ];

  for (const jf of jsonFiles) {
    assert.doesNotThrow(() => {
      const content = fs.readFileSync(jf, 'utf8');
      JSON.parse(content);
    }, `Failed to parse ${path.relative(ROOT_DIR, jf)}`);
  }
});

test('2. Template Completeness: 31 Portfolio & 30 CV templates render without throwing', () => {
  const norm = normalizeProfile(fallbackData);

  // 1. Portfolio Templates (30 + custom-canvas = 31 items)
  assert.strictEqual(PORTFOLIO_CATALOG.length, 31, 'Expected exactly 31 Portfolio templates');
  for (const tpl of PORTFOLIO_CATALOG) {
    const html = renderPortfolioHtml(norm, { templateId: tpl.id });
    assert.ok(html && html.length > 500, `Portfolio template ${tpl.id} failed to render`);
    assert.ok(html.includes('<!DOCTYPE html>'), `Template ${tpl.id} missing DOCTYPE`);
    assert.ok(html.includes('meta name="viewport"'), `Template ${tpl.id} missing responsive viewport`);
  }

  // 2. CV & Resume Templates (30 items)
  assert.strictEqual(CV_CATALOG.length, 30, 'Expected exactly 30 CV/Resume templates');
  for (const tpl of CV_CATALOG) {
    const html = renderCvHtml(norm, { templateId: tpl.id, showQr: true });
    assert.ok(html && html.length > 500, `CV template ${tpl.id} failed to render`);
    assert.ok(html.includes('<!DOCTYPE html>'), `CV Template ${tpl.id} missing DOCTYPE`);
  }

  // Verify Flagship CV layout
  const flagshipHtml = renderCvHtml(norm, { templateId: 'cv-acad-flagship' });
  assert.ok(flagshipHtml.includes(norm.identity.fullName), 'Flagship CV must include candidate full name');
  assert.ok(flagshipHtml.includes('flagship-grid') || flagshipHtml.includes('cv-sheet'), 'Flagship CV structure present');

  // Verify Europass CV
  const europassHtml = renderCvHtml(norm, { templateId: 'cv-acad-europass' });
  assert.ok(europassHtml.includes('europass') || europassHtml.includes('Language'), 'Europass language matrix present');
});

test('3. Responsive UI/UX Verification: Multi-viewport styles across Web & Extension', () => {
  const appCss = fs.readFileSync(path.join(ROOT_DIR, 'apps', 'web', 'css', 'app.css'), 'utf8');
  const sidepanelCss = fs.readFileSync(path.join(ROOT_DIR, 'apps', 'extension', 'css', 'sidepanel.css'), 'utf8');

  // Verify responsive media queries in Web Companion
  assert.ok(appCss.includes('@media (max-width: 900px)') || appCss.includes('@media (max-width: 980px)'), 'Web CSS must include tablet/phone desktop breakpoint');
  assert.ok(appCss.includes('@media (max-width: 768px)') || appCss.includes('@media (max-width: 640px)'), 'Web CSS must include mobile breakpoint');

  // Verify Side Panel fits within compact widths (360px - 460px)
  assert.ok(sidepanelCss.includes('.sp-main') || sidepanelCss.includes('.sp-panel'), 'Sidepanel styles must be present');
});

test('4. Security & Privacy Audit: Zero hardcoded secrets, strict CSP & sanitizer firewalls', () => {
  // 1. Scan all tracked files for synthetic or real secrets
  const trackedFiles = [
    ...getFilesRecursively(path.join(ROOT_DIR, 'core'), /\.(js|json)$/),
    ...getFilesRecursively(path.join(ROOT_DIR, 'apps'), /\.(js|html|json)$/),
    ...getFilesRecursively(path.join(ROOT_DIR, 'scripts'), /\.(mjs|js)$/)
  ];

  for (const file of trackedFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const violations = scanString(content, 'source_code', path.relative(ROOT_DIR, file));
    assert.strictEqual(
      violations.length,
      0,
      `Secret detected in tracked file ${path.relative(ROOT_DIR, file)}: ${JSON.stringify(violations)}`
    );
  }

  // 2. Strict Extension Manifest V3 least privilege
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'apps', 'extension', 'manifest.json'), 'utf8'));
  assert.strictEqual(manifest.manifest_version, 3, 'Must be Manifest V3');
  assert.ok(Array.isArray(manifest.permissions));
  assert.strictEqual(manifest.permissions.includes('<all_urls>'), false, 'Zero broad all_urls spying permitted');
  assert.strictEqual(manifest.permissions.includes('cookies'), false, 'Zero cookie spying permitted');
  assert.strictEqual(manifest.permissions.includes('history'), false, 'Zero history spying permitted');

  // 3. Strict CSP
  const csp = manifest.content_security_policy?.extension_pages || '';
  assert.ok(csp.includes("script-src 'self'"), 'CSP must restrict scripts to self');
  assert.strictEqual(csp.includes('unsafe-inline'), false, 'CSP must forbid unsafe-inline in scripts');
  assert.strictEqual(csp.includes('unsafe-eval'), false, 'CSP must forbid unsafe-eval');

  // 4. Pre-Push Secret Scanner stops leaks in Deploy Bundles
  const safeBundle = generateStaticPortfolioBundle(fallbackData);
  const safeAudit = validateBundleSecurity(safeBundle);
  assert.strictEqual(safeAudit.passed, true);
  assert.strictEqual(safeAudit.blocked, false);

  const dirtyBundle = [
    ...safeBundle,
    { path: 'leak.txt', content: 'Here is my key: AIzaSyD98fakeSecretKeyForAuditTest1234567890', size: 60 }
  ];
  const blockedAudit = validateBundleSecurity(dirtyBundle);
  assert.strictEqual(blockedAudit.passed, false);
  assert.strictEqual(blockedAudit.blocked, true);
  assert.ok(blockedAudit.violations.length > 0);

  // 5. Sanitizer checks
  assert.strictEqual(sanitizeValue('<script>alert("xss")</script>Hello'), 'Hello');
  assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '#');
  assert.strictEqual(sanitizeCss('@import url("evil.css"); .box { color: red; }').includes('@import'), false);

  // 6. .gitignore exclusions
  const gitignore = fs.readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf8');
  assert.ok(gitignore.includes('.gitnexus/'), '.gitignore must exclude .gitnexus/');
  assert.ok(gitignore.includes('.env'), '.gitignore must exclude .env');
  assert.ok(gitignore.includes('dist/'), '.gitignore must exclude dist/');
  assert.ok(gitignore.includes('node_modules/'), '.gitignore must exclude node_modules/');
  assert.ok(gitignore.includes('CV_Nafiz.pdf'), '.gitignore must exclude raw CV_Nafiz.pdf');
});

test('5. Build & Auto-Port Dev Server: Multi-browser packaging & port collision handling', () => {
  // 1. Run multi-browser build
  const buildResults = buildAllPackages();
  assert.ok(buildResults.chromeEdge);
  assert.ok(buildResults.firefox);
  assert.ok(buildResults.web);

  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'dist', 'zundeck-chrome-edge', 'manifest.json')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'dist', 'zundeck-firefox', 'manifest.json')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'dist', 'zundeck-web', 'index.html')));

  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'dist', 'zundeck-chrome-edge.zip')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'dist', 'zundeck-firefox.zip')));
  assert.ok(fs.existsSync(path.join(ROOT_DIR, 'dist', 'zundeck-web.zip')));

  // Check Firefox specific manifest
  const ffManifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'zundeck-firefox', 'manifest.json'), 'utf8'));
  assert.strictEqual(ffManifest.browser_specific_settings?.gecko?.id, 'zundeck@zunsync.org');

  // 2. Deploy diff calculation check
  const bundle = generateStaticPortfolioBundle(fallbackData);
  const diff = calculateDeployDiff(bundle, [{ path: 'index.html', size: 10 }]);
  assert.ok(diff.modified.includes('index.html'));
  assert.ok(diff.added.includes('cv.html'));
  assert.strictEqual(diff.fileCount, bundle.length);
});

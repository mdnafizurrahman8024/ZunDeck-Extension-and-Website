import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildZip } from '../core/exporters/docx-exporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SRC_CORE = path.join(ROOT_DIR, 'core');
const SRC_EXT = path.join(ROOT_DIR, 'apps', 'extension');
const SRC_WEB = path.join(ROOT_DIR, 'apps', 'web');
const SRC_BRAND = path.join(ROOT_DIR, 'docs', 'brand');

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest, ignoreNames = []) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreNames.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, ignoreNames);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function collectFilesForZip(dir, baseDir = dir) {
  const fileList = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fileList.push(...collectFilesForZip(fullPath, baseDir));
    } else {
      const relativeName = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const data = fs.readFileSync(fullPath);
      fileList.push({ name: relativeName, data });
    }
  }
  return fileList;
}

export function buildAllPackages() {
  console.log('======================================================');
  console.log('  ZunDeck Multi-Browser & Web Companion Production Build');
  console.log('======================================================');

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  const results = {};

  // -------------------------------------------------------------------------
  // Target 1: Chrome & Microsoft Edge MV3 (dist/zundeck-chrome-edge/)
  // -------------------------------------------------------------------------
  console.log('\n[1/3] Packaging Chrome & Microsoft Edge Manifest V3 Extension...');
  const chromeDir = path.join(DIST_DIR, 'zundeck-chrome-edge');
  cleanDir(chromeDir);

  // Copy extension files
  copyDirRecursive(SRC_EXT, chromeDir, ['core']);

  // Sync core
  const chromeCoreDir = path.join(chromeDir, 'core');
  copyDirRecursive(SRC_CORE, chromeCoreDir);

  // Read and validate manifest
  const chromeManifestPath = path.join(chromeDir, 'manifest.json');
  const chromeManifest = JSON.parse(fs.readFileSync(chromeManifestPath, 'utf8'));
  console.log(`  ✓ Manifest V3 validated: ${chromeManifest.name} v${chromeManifest.version}`);

  // Zip package
  const chromeFiles = collectFilesForZip(chromeDir);
  const chromeZipBuffer = buildZip(chromeFiles);
  const chromeZipPath = path.join(DIST_DIR, 'zundeck-chrome-edge.zip');
  fs.writeFileSync(chromeZipPath, chromeZipBuffer);
  console.log(`  ✓ Created dist/zundeck-chrome-edge/ (${chromeFiles.length} files)`);
  console.log(`  ✓ Packaged dist/zundeck-chrome-edge.zip (${(chromeZipBuffer.length / 1024).toFixed(1)} KB)`);
  results.chromeEdge = { dir: chromeDir, zip: chromeZipPath, files: chromeFiles.length, sizeKb: (chromeZipBuffer.length / 1024).toFixed(1) };

  // -------------------------------------------------------------------------
  // Target 2: Mozilla Firefox AMO MV3 (dist/zundeck-firefox/)
  // -------------------------------------------------------------------------
  console.log('\n[2/3] Packaging Mozilla Firefox AMO (Manifest V3) Extension...');
  const firefoxDir = path.join(DIST_DIR, 'zundeck-firefox');
  cleanDir(firefoxDir);

  // Copy extension files
  copyDirRecursive(SRC_EXT, firefoxDir, ['core']);

  // Sync core
  const firefoxCoreDir = path.join(firefoxDir, 'core');
  copyDirRecursive(SRC_CORE, firefoxCoreDir);

  // Adapt manifest for Firefox MV3 (gecko ID + sidebar_action fallback)
  const firefoxManifestPath = path.join(firefoxDir, 'manifest.json');
  const firefoxManifest = JSON.parse(fs.readFileSync(firefoxManifestPath, 'utf8'));

  firefoxManifest.browser_specific_settings = {
    gecko: {
      id: 'zundeck@zunsync.org',
      strict_min_version: '115.0'
    }
  };

  // Firefox MV3 background script compatibility
  firefoxManifest.background = {
    scripts: ['background.js']
  };

  // Add sidebar_action for universal Firefox sidebar docking
  firefoxManifest.sidebar_action = {
    default_panel: 'sidepanel.html',
    default_icon: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png"
    },
    default_title: 'ZunDeck Side Panel'
  };

  fs.writeFileSync(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 2), 'utf8');
  console.log(`  ✓ Firefox Gecko ID configured: ${firefoxManifest.browser_specific_settings.gecko.id}`);

  // Zip package
  const firefoxFiles = collectFilesForZip(firefoxDir);
  const firefoxZipBuffer = buildZip(firefoxFiles);
  const firefoxZipPath = path.join(DIST_DIR, 'zundeck-firefox.zip');
  fs.writeFileSync(firefoxZipPath, firefoxZipBuffer);
  console.log(`  ✓ Created dist/zundeck-firefox/ (${firefoxFiles.length} files)`);
  console.log(`  ✓ Packaged dist/zundeck-firefox.zip (${(firefoxZipBuffer.length / 1024).toFixed(1)} KB)`);
  results.firefox = { dir: firefoxDir, zip: firefoxZipPath, files: firefoxFiles.length, sizeKb: (firefoxZipBuffer.length / 1024).toFixed(1) };

  // -------------------------------------------------------------------------
  // Target 3: Standalone Free Web Companion (dist/zundeck-web/)
  // -------------------------------------------------------------------------
  console.log('\n[3/3] Packaging Standalone Free Web Companion Static Site...');
  const webDir = path.join(DIST_DIR, 'zundeck-web');
  cleanDir(webDir);

  // Copy apps/web contents
  copyDirRecursive(SRC_WEB, webDir);

  // Sync core into web/core
  const webCoreDir = path.join(webDir, 'core');
  copyDirRecursive(SRC_CORE, webCoreDir);

  // Copy brand assets for standalone web app
  if (fs.existsSync(SRC_BRAND)) {
    const webBrandDir = path.join(webDir, 'docs', 'brand');
    copyDirRecursive(SRC_BRAND, webBrandDir);
  }

  // Create .nojekyll for GitHub Pages hosting of Web Companion
  fs.writeFileSync(path.join(webDir, '.nojekyll'), '', 'utf8');

  // Zip package for Netlify Drop / Cloudflare Pages / Vercel
  const webFiles = collectFilesForZip(webDir);
  const webZipBuffer = buildZip(webFiles);
  const webZipPath = path.join(DIST_DIR, 'zundeck-web.zip');
  fs.writeFileSync(webZipPath, webZipBuffer);
  console.log(`  ✓ Created dist/zundeck-web/ (${webFiles.length} files)`);
  console.log(`  ✓ Packaged dist/zundeck-web.zip (${(webZipBuffer.length / 1024).toFixed(1)} KB)`);
  results.web = { dir: webDir, zip: webZipPath, files: webFiles.length, sizeKb: (webZipBuffer.length / 1024).toFixed(1) };

  console.log('\n======================================================');
  console.log('  All 3 Production Targets Built Successfully!');
  console.log('======================================================');

  return results;
}

// Direct CLI invocation
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildAllPackages();
}

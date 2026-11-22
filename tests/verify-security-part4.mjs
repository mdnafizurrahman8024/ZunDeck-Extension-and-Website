import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  scanForSecrets,
  assertNoSecrets,
  maskSecret
} from '../core/security/secret-scanner.js';
import {
  escapeHtml,
  sanitizeUrl,
  stripDangerousMarkup,
  sanitizeValue
} from '../core/security/sanitizer.js';
import {
  loadPrivateVault,
  savePrivateVault,
  loadWorkspace,
  saveWorkspace,
  exportPortableBackup,
  importPortableBackup
} from '../core/storage/vault-storage.js';
import { createAutoSaveController } from '../core/storage/auto-save-engine.js';
import {
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
  filterAndSortNotes,
  sendNoteToTarget
} from '../core/ui/notes-scratchpad.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('Manifest V3 conforms strictly to store guidelines with least-privilege permissions and strict CSP', () => {
  const manifestPath = path.join(ROOT_DIR, 'apps', 'extension', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  assert.equal(manifest.manifest_version, 3, 'Must be Manifest V3');
  assert.equal(manifest.name, 'ZunDeck — AI Portfolio, ATS CV & SOP Studio');
  assert.equal(manifest.short_name, 'ZunDeck');

  const allowedPerms = ['sidePanel', 'storage', 'unlimitedStorage', 'activeTab', 'scripting'];
  for (const perm of manifest.permissions) {
    assert.ok(allowedPerms.includes(perm), `Forbidden broad permission detected: ${perm}`);
  }

  // Ensure NO broad <all_urls> or cookie spying
  assert.ok(!manifest.permissions.includes('<all_urls>'));
  assert.ok(!manifest.permissions.includes('cookies'));
  assert.ok(!manifest.permissions.includes('history'));
  assert.ok(!manifest.permissions.includes('webRequest'));

  // Host permissions must be strictly scoped
  for (const host of manifest.host_permissions) {
    assert.ok(host.startsWith('https://api.github.com/') || host.startsWith('https://generativelanguage.googleapis.com/'));
  }

  // CSP check
  assert.ok(manifest.content_security_policy.extension_pages.includes("script-src 'self'"));
  assert.ok(!manifest.content_security_policy.extension_pages.includes("'unsafe-eval'"));
  assert.ok(!manifest.content_security_policy.extension_pages.includes("'unsafe-inline'"));

  // Check icon files exist and have valid PNG signatures
  for (const size of [16, 32, 48, 128]) {
    const iconFile = path.join(ROOT_DIR, 'apps', 'extension', 'icons', `icon-${size}.png`);
    assert.ok(fs.existsSync(iconFile), `Missing icon: icon-${size}.png`);
    const iconBuf = fs.readFileSync(iconFile);
    assert.equal(iconBuf.readUInt32BE(0), 0x89504E47, `Invalid PNG signature for icon-${size}.png`);
  }
});

test('Secret Scanner blocks synthetic API keys, PATs, private keys, and vault leaks', () => {
  const syntheticSecrets = [
    { key: ['AIza', 'SyD9ExampleGeminiKey35CharsLong0123'].join(''), type: 'google_api_key' },
    { key: ['sk-', 'proj-abc123456789012345678901234567890'].join(''), type: 'openai_anthropic_key' },
    { key: ['ghp_', '123456789012345678901234567890123456'].join(''), type: 'github_pat_classic' },
    { key: ['github_pat_', '11AAAAAAA0123456789012345678901234567890123456789012345678901234567890123456789012'].join(''), type: 'github_pat_fine_grained' },
    { key: ['AKIA', '1234567890ABCDEF'].join(''), type: 'aws_access_key' },
    { key: ['-----BEGIN ', 'RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...'].join(''), type: 'private_key_header' }
  ];

  for (const { key, type } of syntheticSecrets) {
    const report = scanForSecrets({ payload: `User text containing ${key} in string` });
    assert.equal(report.clean, false, `Failed to block ${type}`);
    assert.ok(report.blockedCount >= 1);
    assert.ok(report.violations.some((v) => v.type === type));
    assert.ok(!report.violations[0].maskedSnippet.includes(key), 'Must mask secret string');
  }

  // Check clean portfolio data passes with ZERO false positives
  const cleanReport = scanForSecrets(fallbackData, 'mother_fallback');
  assert.equal(cleanReport.clean, true, 'Clean portfolio must not trigger false positives');
  assert.equal(cleanReport.blockedCount, 0);

  // Check assertNoSecrets throws on leak
  assert.throws(() => {
    assertNoSecrets({ leakedToken: ['ghp_', '123456789012345678901234567890123456'].join('') });
  }, /Secret Scanner Blocked/);
});

test('Sanitizer strips scripts, event handlers, and malicious URLs', () => {
  // 1. Script injection
  const dirtyHtml = '<p>Hello</p><script>alert("hacked")</script><span>World</span>';
  const cleanHtml = stripDangerousMarkup(dirtyHtml);
  assert.ok(!cleanHtml.includes('<script>'));
  assert.ok(!cleanHtml.includes('alert('));
  assert.ok(cleanHtml.includes('<p>Hello</p>'));

  // 2. Event handlers
  const dirtyEvent = '<img src="avatar.png" onerror="alert(1)" onload="fetch(\'/steal\')">';
  const cleanEvent = stripDangerousMarkup(dirtyEvent);
  assert.ok(!cleanEvent.includes('onerror'));
  assert.ok(!cleanEvent.includes('onload'));

  // 3. URL schemes
  assert.equal(sanitizeUrl('javascript:alert(1)'), '#');
  assert.equal(sanitizeUrl('vbscript:msgbox(1)'), '#');
  assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '#');
  assert.equal(sanitizeUrl('https://example.com/profile'), 'https://example.com/profile');
  assert.equal(sanitizeUrl('mailto:user@example.com'), 'mailto:user@example.com');
  assert.equal(sanitizeUrl('tel:+8801849288024'), 'tel:+8801849288024');

  // 4. Recursive sanitization
  const obj = {
    title: 'Safe Title',
    desc: '<script>evil()</script>Clean Description',
    link: 'javascript:evil()',
    nested: { evilHandler: '<div onclick="hack()">Click</div>' }
  };
  const sanitizedObj = sanitizeValue(obj);
  assert.equal(sanitizedObj.title, 'Safe Title');
  assert.ok(!sanitizedObj.desc.includes('<script>'));
  assert.ok(!sanitizedObj.nested.evilHandler.includes('onclick'));
});

test('Vault Storage maintains strict private vs workspace separation and exports portable backup', async () => {
  // Test Private Vault
  await savePrivateVault({
    keys: { gemini: 'test-key-mock', githubPat: 'pat-mock' },
    settings: { theme: 'dark', autoSave: true, excludeKeysFromBackup: true },
    ideaNotes: [{ id: 'n1', title: 'Private Note 1', content: 'Secret research thoughts' }]
  });

  const loadedVault = await loadPrivateVault();
  assert.equal(loadedVault.keys.gemini, 'test-key-mock');
  assert.equal(loadedVault.ideaNotes.length, 1);

  // Test Workspace Store
  await saveWorkspace({
    activeProfile: fallbackData,
    activeTemplates: { portfolio: 'acad-flagship', cv: 'cv-acad-flagship' }
  });

  const loadedWs = await loadWorkspace();
  assert.equal(loadedWs.activeProfile.identity.fullName, fallbackData.identity.fullName);

  // Test Backup Export with excludePrivateKeys = true
  const safeBackup = await exportPortableBackup({ excludePrivateKeys: true });
  assert.equal(safeBackup.schemaVersion, 'ZunProfileV1');
  assert.equal(safeBackup.excludePrivateKeys, true);
  assert.equal(safeBackup.private.keys.gemini, '');
  assert.equal(safeBackup.private.keys.githubPat, '');

  // Test Backup Import
  const importResult = await importPortableBackup(safeBackup);
  assert.equal(importResult.success, true);
});

test('Auto-Save Engine debounces changes for 2 seconds and reports status transitions', async () => {
  let savedCount = 0;
  const statuses = [];

  const controller = createAutoSaveController({
    delay: 100, // Short delay for testing
    onSave: async () => {
      savedCount++;
    },
    onStatusChange: ({ status, label }) => {
      statuses.push({ status, label });
    }
  });

  controller.markDirty();
  assert.equal(controller.isDirty(), true);
  assert.ok(statuses.some((s) => s.status === 'dirty'));

  // Wait for debounce to fire
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.equal(savedCount, 1);
  assert.equal(controller.isDirty(), false);
  assert.ok(statuses.some((s) => s.status === 'saved'));
});

test('Notes Scratchpad supports note creation, updates, pinning, filtering, and editor dispatch', () => {
  const note1 = createNote({ title: 'AMR Surveillance Protocol', tag: 'Research', pinned: false });
  const note2 = createNote({ title: 'VetMedix Algorithm Redesign', tag: 'Project', pinned: true });
  const note3 = createNote({ title: 'Erasmus Mobility Story', tag: 'SOP', pinned: false });

  let notes = [note1, note2, note3];

  // Pin sorting
  const sorted = filterAndSortNotes(notes);
  assert.equal(sorted[0].id, note2.id, 'Pinned note must appear first');

  // Search filtering
  const searchResults = filterAndSortNotes(notes, { query: 'Surveillance' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, note1.id);

  // Tag filtering
  const sopResults = filterAndSortNotes(notes, { tag: 'SOP' });
  assert.equal(sopResults.length, 1);
  assert.equal(sopResults[0].id, note3.id);

  // Pin toggle
  notes = togglePinNote(notes, note1.id);
  const note1Updated = notes.find((n) => n.id === note1.id);
  assert.equal(note1Updated.pinned, true);

  // Note update
  notes = updateNote(notes, note1.id, { title: 'AMR Surveillance V2' });
  assert.equal(notes.find((n) => n.id === note1.id).title, 'AMR Surveillance V2');

  // Dispatch to target
  const dispatch = sendNoteToTarget(note3, 'sop');
  assert.equal(dispatch.targetType, 'sop');
  assert.ok(dispatch.text.includes('Erasmus Mobility Story'));

  // Note delete
  notes = deleteNote(notes, note2.id);
  assert.equal(notes.length, 2);
  assert.ok(!notes.some((n) => n.id === note2.id));
});

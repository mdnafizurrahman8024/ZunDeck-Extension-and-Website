import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultProfile, validateProfile, normalizeProfile } from '../core/schema/profile-schema.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

test('createDefaultProfile produces a valid ZunProfileV1 object', () => {
  const profile = createDefaultProfile();
  assert.equal(profile.schemaVersion, 'ZunProfileV1');
  assert.ok(profile.identity.fullName);
  assert.ok(profile.links);
  assert.ok(Array.isArray(profile.metrics));
  assert.ok(profile.displayConfig);

  const result = validateProfile(profile);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateProfile flags invalid profiles', () => {
  const invalid = { identity: {} };
  const result = validateProfile(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('normalizeProfile handles empty inputs and hydrates fallback', () => {
  const normalized = normalizeProfile(null);
  assert.equal(normalized.schemaVersion, 'ZunProfileV1');
  assert.ok(normalized.identity.fullName);
});

test('mother-fallback.json adheres strictly to ZunProfileV1 schema', () => {
  const normalized = normalizeProfile(fallbackData);
  const result = validateProfile(normalized);
  assert.equal(result.valid, true, `Errors: ${result.errors.join(', ')}`);
  assert.equal(normalized.identity.fullName, 'Md. Nafizur Rahman');
  assert.ok(normalized.research.length > 0);
  assert.ok(normalized.projects.length > 0);
  assert.ok(normalized.publications.length > 0);
});

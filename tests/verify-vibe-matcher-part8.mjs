import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  sanitizeCss
} from '../core/security/sanitizer.js';

import {
  getAiCredentials,
  saveAiCredentials,
  isAiConfigured,
  testAiConnection,
  parseJsonFromAiResponse,
  AI_PROVIDERS
} from '../core/ai/byok-client.js';

import {
  createCheckpoint,
  getCheckpoints,
  restoreCheckpoint,
  undoCheckpoint,
  redoCheckpoint,
  clearCheckpoints,
  calculateDiffSummary,
  MAX_CHECKPOINTS
} from '../core/storage/checkpoint-timeline.js';

import {
  applyVibeTool,
  parseOfflineVibeIntent,
  processVibeAgentMessage,
  VIBE_TOOLS
} from '../core/ai/vibe-agent.js';

import {
  computeOfflineMatch,
  createTailoredCvProfileFromMatch,
  createTargetedLetterDraftFromMatch,
  CIRCULAR_INPUT_MODES
} from '../core/ai/opportunity-matcher.js';

import {
  PROMPT_LIBRARY,
  USER_GUIDES,
  renderGuideAndPromptsHtml,
  renderPromptsListHtml,
  renderGuidesAccordionHtml
} from '../core/ui/guide-and-prompts.js';

import {
  renderMatcherPanelHtml,
  renderMatchReportHtml
} from '../core/ui/matcher-panel.js';

import {
  renderVibeStudioHtml
} from '../core/ui/vibe-studio-panel.js';

import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('CSS Sanitizer blocks @import, javascript:, expressions, and dangerous directives', () => {
  const dirtyCss = `
    @import url("https://malicious.com/evil.css");
    @import 'malicious-local.css';
    .card {
      color: expression(alert('XSS'));
      background: url(javascript:alert(1));
      behavior: url(script.htc);
      -moz-binding: url(binding.xml#test);
      border: 1px solid #10b981;
    }
    <script>alert("injection")</script>
  `;

  const clean = sanitizeCss(dirtyCss);

  assert.strictEqual(clean.includes('@import'), false, 'Should strip @import');
  assert.strictEqual(clean.includes('expression'), false, 'Should strip expressions');
  assert.strictEqual(clean.includes('javascript:'), false, 'Should strip javascript: URLs');
  assert.strictEqual(clean.includes('behavior:'), false, 'Should strip behavior');
  assert.strictEqual(clean.includes('-moz-binding:'), false, 'Should strip -moz-binding');
  assert.strictEqual(clean.includes('<script>'), false, 'Should strip HTML tags');
  assert.ok(clean.includes('border: 1px solid #10b981'), 'Preserves legitimate CSS rules');
});

test('BYOK AI Client securely stores keys in vault and never leaks to public profile or checkpoints', async () => {
  await saveAiCredentials({
    provider: AI_PROVIDERS.GEMINI,
    apiKey: 'AIzaSyFakeTestKeyForTesting12345',
    model: 'gemini-2.0-flash'
  });

  const creds = await getAiCredentials();
  assert.strictEqual(creds.provider, 'gemini');
  assert.strictEqual(creds.apiKey, 'AIzaSyFakeTestKeyForTesting12345');
  assert.strictEqual(await isAiConfigured(), true);

  // Verify that activeProfile and checkpoints do NOT contain the API key
  const profile = JSON.parse(JSON.stringify(fallbackData));
  const cp = await createCheckpoint(profile, 'Test Checkpoint');
  const serializedCp = JSON.stringify(cp);
  const serializedProfile = JSON.stringify(profile);

  assert.strictEqual(serializedCp.includes('AIzaSyFakeTestKey'), false, 'Checkpoint must not leak API key');
  assert.strictEqual(serializedProfile.includes('AIzaSyFakeTestKey'), false, 'Profile must not contain API key');

  // Verify connection test with empty key guidance
  const emptyRes = await testAiConnection({ apiKey: '' });
  assert.strictEqual(emptyRes.success, false);
  assert.strictEqual(emptyRes.code, 'MISSING_API_KEY');

  // Verify JSON parser helper
  const parsed1 = parseJsonFromAiResponse('{"matchScore": 85}');
  assert.strictEqual(parsed1?.matchScore, 85);

  const parsed2 = parseJsonFromAiResponse('Here is the output:\n```json\n{"theme": "dark"}\n```');
  assert.strictEqual(parsed2?.theme, 'dark');
});

test('Checkpoint Undo/Redo Timeline accurately saves, undoes, redoes, and enforces 30 snapshot cap', async () => {
  await clearCheckpoints();

  const baseProfile = JSON.parse(JSON.stringify(fallbackData));

  // 1. Create a series of checkpoints
  await createCheckpoint(baseProfile, 'Baseline Snapshot');

  const mutated1 = JSON.parse(JSON.stringify(baseProfile));
  mutated1.identity.roleBadge = 'Principal Investigator';
  await createCheckpoint(mutated1, 'Update Role');

  const mutated2 = JSON.parse(JSON.stringify(mutated1));
  mutated2.displayConfig = { theme: 'light', accentColor: '#3b82f6' };
  await createCheckpoint(mutated2, 'Update Theme');

  const checkpoints = await getCheckpoints();
  assert.strictEqual(checkpoints.length, 3);
  assert.strictEqual(checkpoints[0].label, 'Update Theme');
  assert.strictEqual(checkpoints[1].label, 'Update Role');

  // 2. Undo
  const undo1 = await undoCheckpoint();
  assert.ok(undo1);
  assert.strictEqual(undo1.checkpoint.label, 'Update Role');
  assert.strictEqual(undo1.profile.identity.roleBadge, 'Principal Investigator');

  // 3. Redo
  const redo1 = await redoCheckpoint();
  assert.ok(redo1);
  assert.strictEqual(redo1.checkpoint.label, 'Update Theme');
  assert.strictEqual(redo1.profile.displayConfig.accentColor, '#3b82f6');

  // 4. Restore by ID
  const baselineId = checkpoints[2].id;
  const restored = await restoreCheckpoint(baselineId);
  assert.strictEqual(restored.identity.roleBadge, baseProfile.identity.roleBadge);

  // 5. Test 30 Checkpoint Cap
  for (let i = 0; i < 35; i++) {
    await createCheckpoint(baseProfile, `Batch Checkpoint ${i}`);
  }
  const cappedCheckpoints = await getCheckpoints();
  assert.strictEqual(cappedCheckpoints.length, MAX_CHECKPOINTS, `Must be capped at ${MAX_CHECKPOINTS}`);
});

test('Safe 3-Layer Vibe Coding Agent executes the 4 strict tools safely with diff calculation', async () => {
  const profile = JSON.parse(JSON.stringify(fallbackData));

  // Tool 1: patch_profile_data
  const patchResult = applyVibeTool(profile, 'patch_profile_data', {
    identity: { tagline: 'Innovating One Health Research & Vibe Coding' },
    addSkills: ['Nextflow', 'BLAST+']
  });
  assert.strictEqual(patchResult.identity.tagline, 'Innovating One Health Research & Vibe Coding');
  assert.ok(patchResult.skills.technical.skills.some((s) => s.name === 'Nextflow'));

  // Tool 2: update_theme_and_layout (with sanitized scoped CSS)
  const themeResult = applyVibeTool(profile, 'update_theme_and_layout', {
    theme: 'dark',
    accentColor: '#10b981',
    gridColumns: 2,
    seeAllLimit: 5,
    scopedCss: '.hero { color: red; } @import url("evil.css");'
  });
  assert.strictEqual(themeResult.displayConfig.theme, 'dark');
  assert.strictEqual(themeResult.displayConfig.accentColor, '#10b981');
  assert.strictEqual(themeResult.displayConfig.gridColumns, 2);
  assert.strictEqual(themeResult.displayConfig.seeAllLimit, 5);
  assert.strictEqual(themeResult.displayConfig.customCss.includes('@import'), false);

  // Tool 3: tailor_cv_profile
  const cvTailorResult = applyVibeTool(profile, 'tailor_cv_profile', {
    profileName: 'Virology PhD Applicant',
    targetRole: 'PhD Candidate',
    includedSections: ['education', 'research', 'publications']
  });
  assert.ok(cvTailorResult.cvProfiles.some((p) => p.name === 'Virology PhD Applicant'));

  // Tool 4: draft_or_refine_letter
  const letterResult = applyVibeTool(profile, 'draft_or_refine_letter', {
    mode: 'sop',
    targetInstitution: 'Cambridge University',
    body: 'I am writing to express my interest in viral epidemiology...'
  });
  assert.strictEqual(letterResult.letterDrafts[0].targetInstitution, 'Cambridge University');

  // Test Diff Summary Calculation
  const diff = calculateDiffSummary(profile, patchResult);
  assert.ok(diff.includes('Security Check: 0 private fields exposed'));

  // Test Offline Intent Parser for English & Bengali commands
  const intent1 = parseOfflineVibeIntent('Change theme to emerald dark', profile);
  assert.strictEqual(intent1.tool, 'update_theme_and_layout');
  assert.strictEqual(intent1.arguments.accentColor, '#10b981');

  const intentBengali = parseOfflineVibeIntent('থিম ডার্ক করো', profile);
  assert.strictEqual(intentBengali.tool, 'update_theme_and_layout');
  assert.strictEqual(intentBengali.arguments.theme, 'dark');

  // Test full processVibeAgentMessage pipeline
  const processed = await processVibeAgentMessage('Switch to Minimalist template', profile, { forceOffline: true });
  assert.strictEqual(processed.success, true);
  assert.ok(processed.diffSummary.length > 0);
  assert.ok(processed.checkpointId);
});

test('Opportunity Matcher computes accurate ATS scores and generates tailored CV & SOP', () => {
  const profile = JSON.parse(JSON.stringify(fallbackData));

  const sampleCircularText = `
Call for PhD Applications in Viral Genomics & One Health
University of Edinburgh, Centre for Infectious Diseases
Requirements:
- Bachelor or Master's degree in Veterinary Medicine (DVM) or Biology
- Proficiency in Python, Nextflow, and data analysis
- Research background in virology, epidemiology, or infectious disease surveillance
- Experience with molecular biology and sequencing data
`;

  // 1. Offline Deterministic Match
  const match = computeOfflineMatch(profile, sampleCircularText);
  assert.ok(match.matchScore >= 50 && match.matchScore <= 100);
  assert.ok(match.matchedStrengths.length > 0);
  assert.ok(CIRCULAR_INPUT_MODES.length === 5);

  // 2. Create Tailored CV Profile without mutating master profile
  const initialCvCount = profile.cvProfiles?.length || 0;
  const { updatedProfile, createdCvProfile } = createTailoredCvProfileFromMatch(profile, match);
  assert.ok(createdCvProfile.id.startsWith('cv-tailored-'));
  assert.strictEqual(updatedProfile.cvProfiles.length, initialCvCount + 1);
  assert.strictEqual(profile.cvProfiles?.length || 0, initialCvCount, 'Original master profile must remain unaltered');

  // 3. Create Targeted Letter Draft Scaffold
  const draftScaffold = createTargetedLetterDraftFromMatch(profile, match, 'sop');
  assert.strictEqual(draftScaffold.mode, 'sop');
  assert.ok(draftScaffold.subject.includes(profile.identity.fullName));
});

test('Prompt Library (25+ items) and User Manual (7 guides) render cleanly with zero magic slop', () => {
  assert.ok(PROMPT_LIBRARY.length >= 25, `Expected >= 25 prompts, got ${PROMPT_LIBRARY.length}`);

  const categories = new Set(PROMPT_LIBRARY.map((p) => p.category));
  assert.ok(categories.has('design'));
  assert.ok(categories.has('academic'));
  assert.ok(categories.has('corporate'));
  assert.ok(categories.has('letters'));
  assert.ok(categories.has('layout'));

  assert.strictEqual(USER_GUIDES.length, 7, 'Expected exactly 7 step-by-step guides');

  // Render HTML check
  const guideHtml = renderGuideAndPromptsHtml('prompts');
  assert.ok(guideHtml.includes('Vibe Prompt Library'));
  assert.ok(guideHtml.includes('Interactive User Manual'));
  assert.strictEqual(guideHtml.includes('fa-wand-magic-sparkles'), false, 'Zero magic sparkles allowed');

  const promptsListHtml = renderPromptsListHtml(PROMPT_LIBRARY);
  assert.ok(promptsListHtml.includes('Use Prompt'));

  const guidesAccordionHtml = renderGuidesAccordionHtml(USER_GUIDES);
  assert.ok(guidesAccordionHtml.includes('Setting up Free Gemini API Key'));
  assert.ok(guidesAccordionHtml.includes('Creating a Fine-Grained GitHub Token Safely'));

  // Matcher UI and Vibe UI renders
  const matcherHtml = renderMatcherPanelHtml({ isExtension: true });
  assert.ok(matcherHtml.includes('matcher-mode-tabs'));
  assert.ok(matcherHtml.includes('Analyze & Match Opportunity'));

  const reportHtml = renderMatchReportHtml({
    matchScore: 88,
    matchedStrengths: ['Python', 'Virology'],
    missingKeywords: ['Docker'],
    opportunityMeta: { roleTitle: 'PhD Fellow', institution: 'Oxford' }
  });
  assert.ok(reportHtml.includes('88%'));
  assert.ok(reportHtml.includes('Create Tailored CV Profile'));
  assert.ok(reportHtml.includes('Generate Targeted SOP / Letter'));

  const vibeHtml = renderVibeStudioHtml({ isConfigured: true, messages: [] });
  assert.ok(vibeHtml.includes('Vibe Coding Agent'));
  assert.ok(vibeHtml.includes('Checkpoint Undo Timeline'));
  assert.ok(vibeHtml.includes('BYOK AI Settings'));
});

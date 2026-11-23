import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  processVibeAgentMessage,
  parseOfflineVibeIntent,
  buildCandidateProfileSummary,
  VIBE_TOOLS
} from '../core/ai/vibe-agent.js';

import {
  AI_PROVIDERS,
  isOpenRouterFreeModel,
  fetchLiveModels
} from '../core/ai/byok-client.js';

import {
  renderVibeStudioHtml
} from '../core/ui/vibe-studio-panel.js';

import fallbackProfile from '../core/data/mother-fallback.json' with { type: 'json' };

test('1. CSS Verification: Header Action Buttons & BYOK Modal Actions Have Zero Overlap', () => {
  const css = fs.readFileSync(path.resolve('apps/web/css/app.css'), 'utf-8');

  // 1. .vibe-header-tools must have gap: 8px and flex-wrap: wrap
  const headerToolsMatch = css.match(/\.vibe-header-tools\s*\{([^}]+)\}/);
  assert.ok(headerToolsMatch, '.vibe-header-tools rule exists');
  assert.ok(headerToolsMatch[1].includes('gap: 8px'), '.vibe-header-tools has gap: 8px');
  assert.ok(headerToolsMatch[1].includes('flex-wrap: wrap'), '.vibe-header-tools has flex-wrap: wrap');

  // 2. .vibe-header-tools .btn-tool must have width: auto and min-width: max-content
  const btnToolMatch = css.match(/\.vibe-header-tools \.btn-tool\s*\{([^}]+)\}/);
  assert.ok(btnToolMatch, '.vibe-header-tools .btn-tool rule exists');
  assert.ok(btnToolMatch[1].includes('width: auto'), '.vibe-header-tools .btn-tool has width: auto');
  assert.ok(btnToolMatch[1].includes('min-width: max-content'), '.vibe-header-tools .btn-tool has min-width: max-content');
  assert.ok(btnToolMatch[1].includes('white-space: nowrap'), '.vibe-header-tools .btn-tool has white-space: nowrap');
  assert.ok(btnToolMatch[1].includes('flex-shrink: 0'), '.vibe-header-tools .btn-tool has flex-shrink: 0');

  // 3. .vibe-settings-actions .btn-tool must have width: auto, min-width: max-content, padding: 8px 14px
  const settingsActionsMatch = css.match(/\.vibe-settings-actions \.btn-tool[\s\S]*?\{([^}]+)\}/);
  assert.ok(settingsActionsMatch, '.vibe-settings-actions .btn-tool rule exists');
  assert.ok(settingsActionsMatch[1].includes('width: auto'), '.vibe-settings-actions .btn-tool has width: auto');
  assert.ok(settingsActionsMatch[1].includes('min-width: max-content'), '.vibe-settings-actions .btn-tool has min-width: max-content');
  assert.ok(settingsActionsMatch[1].includes('white-space: nowrap'), '.vibe-settings-actions .btn-tool has white-space: nowrap');
  assert.ok(settingsActionsMatch[1].includes('padding: 8px 14px'), '.vibe-settings-actions .btn-tool has padding: 8px 14px');
});

test('2. UI & Placeholder Verification: Real Model Placeholders in Custom Model Input', () => {
  const panelHtml = renderVibeStudioHtml({
    hasPersonalKey: false,
    isConfigured: true,
    isPromptPaneOpen: false
  });

  // Verify real model IDs in placeholder
  assert.ok(panelHtml.includes('google/gemini-2.5-pro or anthropic/claude-sonnet-4'), 'Includes real active model IDs in placeholder');
  assert.ok(!panelHtml.includes('gemini-4-hydrogen or gpt-6.2-sol'), 'Does NOT include retired/fake placeholders in input');

  // Verify prompt pane close button exists
  const panelWithPromptOpen = renderVibeStudioHtml({
    isPromptPaneOpen: true
  });
  assert.ok(panelWithPromptOpen.includes('id="btn-close-prompt-pane"'), 'Prompt engineering pane includes close button (✕)');
  assert.ok(panelWithPromptOpen.includes('id="btn-toggle-prompt-chat"'), 'Prompt with AI toggle button exists');
});

test('3. Candidate Profile Summary includes Authentic Education (DVM & Rajshahi)', () => {
  const summary = buildCandidateProfileSummary(fallbackProfile);
  assert.ok(summary.includes('Md. Nafizur Rahman') || summary.includes('Md Nafizur Rahman'), 'Summary includes candidate name');
  assert.ok(summary.includes('Veterinary Medicine') || summary.includes('DVM'), 'Summary includes DVM degree');
  assert.ok(summary.includes('University of Rajshahi') || summary.includes('Rajshahi'), 'Summary includes University of Rajshahi');
});

test('4. Vibe Agent Q&A: Conversational Inquiries Return Real Answers Without Fake Patches', async () => {
  // Test education inquiry
  const question = 'do you know Md Nafizur Rahman studied at University of Rajshahi, DVM?';
  const response = await processVibeAgentMessage(question, fallbackProfile, { forceOffline: true });

  assert.strictEqual(response.success, true);
  assert.strictEqual(response.isConversational, true);
  assert.strictEqual(response.hasChanges, false);
  assert.strictEqual(response.diffSummary, null);
  assert.strictEqual(response.checkpointId, null);
  assert.strictEqual(response.toolUsed, 'conversational_response');

  // Verify answer is factual, intelligent, and mentions DVM / Rajshahi
  assert.ok(response.explanation.includes('University of Rajshahi'), 'Answer mentions University of Rajshahi');
  assert.ok(response.explanation.includes('DVM') || response.explanation.includes('Veterinary Medicine'), 'Answer mentions DVM degree');
  assert.ok(!response.explanation.includes('Refined workspace styling'), 'Does NOT output hardcoded canned styling text');

  // Verify identity inquiry
  const whoResponse = await processVibeAgentMessage('who is the author of this portfolio?', fallbackProfile, { forceOffline: true });
  assert.strictEqual(whoResponse.isConversational, true);
  assert.strictEqual(whoResponse.hasChanges, false);
  assert.ok(whoResponse.explanation.includes('Md. Nafizur Rahman') || whoResponse.explanation.includes('Md Nafizur Rahman'));
});

test('5. Vibe Agent Edit Commands: Explicit Edits Apply Real Mutations and Checkpoints', async () => {
  // Test explicit styling command
  const editCommand = 'Change theme to dark with emerald accent (#10b981) and 2 columns';
  const editResponse = await processVibeAgentMessage(editCommand, fallbackProfile, { forceOffline: true });

  assert.strictEqual(editResponse.success, true);
  assert.strictEqual(editResponse.isConversational, false);
  assert.strictEqual(editResponse.hasChanges, true);
  assert.strictEqual(editResponse.toolUsed, 'update_theme_and_layout');
  assert.strictEqual(editResponse.updatedProfile.displayConfig.theme, 'dark');
  assert.strictEqual(editResponse.updatedProfile.displayConfig.accentColor, '#10b981');
  assert.strictEqual(editResponse.updatedProfile.displayConfig.gridColumns, 2);
  assert.ok(editResponse.diffSummary !== null);
  assert.ok(editResponse.checkpointId !== null);

  // Test explicit add skill command
  const skillCommand = 'Add skill: Nextflow, Pathogen Genomics, BLAST+';
  const skillResponse = await processVibeAgentMessage(skillCommand, fallbackProfile, { forceOffline: true });

  assert.strictEqual(skillResponse.success, true);
  assert.strictEqual(skillResponse.isConversational, false);
  assert.strictEqual(skillResponse.hasChanges, true);
  assert.strictEqual(skillResponse.toolUsed, 'patch_profile_data');
  const skillsList = skillResponse.updatedProfile.skills.technical.skills.map((s) => s.name || s);
  assert.ok(skillsList.includes('Nextflow'));
  assert.ok(skillsList.includes('Pathogen Genomics'));
  assert.ok(skillsList.includes('BLAST+'));
});

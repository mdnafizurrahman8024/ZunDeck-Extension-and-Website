import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AI_PROVIDERS,
  PROVIDER_METADATA,
  PRESET_MODELS,
  getAiCredentials,
  saveAiCredentials,
  isAiConfigured,
  fetchLiveModels,
  DEFAULT_AI_CONFIG
} from '../core/ai/byok-client.js';

import {
  PROMPT_LIBRARY,
  PROMPT_CATEGORIES,
  getPromptsByCategory,
  searchPrompts,
  generateStructuredPrompt
} from '../core/ai/prompt-library.js';

import {
  applyVibeTool,
  parseOfflineVibeIntent,
  processVibeAgentMessage,
  VIBE_TOOLS
} from '../core/ai/vibe-agent.js';

import {
  renderVibeStudioHtml
} from '../core/ui/vibe-studio-panel.js';

import {
  renderGuideAndPromptsHtml,
  renderPromptsListHtml
} from '../core/ui/guide-and-prompts.js';

test('1. BYOK AI Client supports all major providers and latest model presets', async () => {
  const expectedProviders = [
    'gemini',
    'anthropic',
    'openai',
    'deepseek',
    'groq',
    'openrouter',
    'xai',
    'mistral',
    'custom',
    'openai_compatible'
  ];

  for (const p of expectedProviders) {
    assert.ok(Object.values(AI_PROVIDERS).includes(p), `AI_PROVIDERS must include ${p}`);
    assert.ok(PROVIDER_METADATA[p], `PROVIDER_METADATA must define configuration for ${p}`);
    assert.ok(Array.isArray(PRESET_MODELS[p]) && PRESET_MODELS[p].length > 0, `PRESET_MODELS must define models for ${p}`);
  }

  // Verify flagship models
  const geminiModels = PRESET_MODELS[AI_PROVIDERS.GEMINI].map((m) => m.id);
  assert.ok(geminiModels.includes('gemini-4-hydrogen'), 'Includes Gemini 4 Hydrogen');
  assert.ok(geminiModels.includes('gemini-4-neon'), 'Includes Gemini 4 Neon');
  assert.ok(geminiModels.includes('gemini-3.8-flash'), 'Includes Gemini 3.8 Flash');

  const claudeModels = PRESET_MODELS[AI_PROVIDERS.ANTHROPIC].map((m) => m.id);
  assert.ok(claudeModels.some((id) => id.includes('claude-sonnet-5-5')), 'Includes Claude Sonnet 5.5');

  const deepseekModels = PRESET_MODELS[AI_PROVIDERS.DEEPSEEK].map((m) => m.id);
  assert.ok(deepseekModels.includes('deepseek-v4.1-flash'), 'Includes DeepSeek V4.1 Flash');
  assert.ok(deepseekModels.includes('deepseek-v4-pro'), 'Includes DeepSeek V4 Pro');

  const groqModels = PRESET_MODELS[AI_PROVIDERS.GROQ].map((m) => m.id);
  assert.ok(groqModels.some((id) => id.includes('gpt-oss-120b')), 'Includes Groq GPT OSS 120B');
});

test('2. BYOK Credential Vault stores per-provider keys and custom model IDs safely', async () => {
  // Test Claude configuration
  await saveAiCredentials({
    provider: AI_PROVIDERS.ANTHROPIC,
    apiKey: 'sk-ant-test-anthropic-key-12345',
    model: 'claude-sonnet-5-5',
    customModelId: 'claude-custom-special'
  });

  let creds = await getAiCredentials();
  assert.strictEqual(creds.provider, AI_PROVIDERS.ANTHROPIC);
  assert.strictEqual(creds.apiKey, 'sk-ant-test-anthropic-key-12345');
  assert.strictEqual(creds.customModelId, 'claude-custom-special');
  assert.strictEqual(creds.model, 'claude-custom-special');

  // Test Gemini configuration backward compatibility
  await saveAiCredentials({
    provider: AI_PROVIDERS.GEMINI,
    apiKey: 'AIzaSyTestGeminiKey12345',
    model: 'gemini-4-hydrogen'
  });

  creds = await getAiCredentials();
  assert.strictEqual(creds.provider, AI_PROVIDERS.GEMINI);
  assert.strictEqual(creds.apiKey, 'AIzaSyTestGeminiKey12345');
  assert.strictEqual(creds.model, 'gemini-4-hydrogen');

  const configured = await isAiConfigured();
  assert.strictEqual(configured, true);
});

test('3. Live Model Query returns valid fallback models when offline or unauthenticated', async () => {
  const result = await fetchLiveModels({
    provider: AI_PROVIDERS.OPENAI,
    apiKey: ''
  });

  assert.strictEqual(result.success, false);
  assert.ok(Array.isArray(result.models) && result.models.length > 0);
  assert.ok(result.models.some((m) => m.id.includes('gpt-6')));
});

test('4. Structured Pro Prompt Library defines 30 prompts across 6 distinct categories', () => {
  assert.ok(PROMPT_LIBRARY.length >= 30, `Expected at least 30 prompts, got ${PROMPT_LIBRARY.length}`);
  assert.strictEqual(PROMPT_CATEGORIES.length, 7, 'Expected 7 categories (all + 6 domains)');

  for (const item of PROMPT_LIBRARY) {
    assert.ok(item.id, 'Prompt must have an id');
    assert.ok(item.title, 'Prompt must have a title');
    assert.ok(item.role, 'Prompt must define a [ROLE]');
    assert.ok(item.objective, 'Prompt must define an [OBJECTIVE]');
    assert.ok(Array.isArray(item.commands) && item.commands.length > 0, 'Prompt must define [COMMANDS]');
    assert.ok(item.prompt.includes('[ROLE]'), 'Prompt text must include [ROLE]');
    assert.ok(item.prompt.includes('[OBJECTIVE]'), 'Prompt text must include [OBJECTIVE]');
    assert.ok(item.prompt.includes('[COMMANDS]'), 'Prompt text must include [COMMANDS]');
    assert.ok(item.prompt.includes('[DESIGN SPECS]'), 'Prompt text must include [DESIGN SPECS]');
    assert.ok(item.prompt.includes('[SECURITY & PRIVACY]'), 'Prompt text must include [SECURITY & PRIVACY]');
  }

  // Search & category helpers
  const amrPrompts = searchPrompts('AMR');
  assert.ok(amrPrompts.length > 0, 'Should find AMR prompts');

  const atsPrompts = getPromptsByCategory('corporate');
  assert.ok(atsPrompts.length >= 5, 'Should find at least 5 ATS CV prompts');

  // Synthesizer helper
  const synthesized = generateStructuredPrompt({
    role: 'Test Role',
    objective: 'Test Goal',
    commands: ['Step A', 'Step B'],
    designSpecs: { theme: 'dark', accentColor: '#10b981' },
    securityRules: 'Zero fake metrics.'
  });

  assert.ok(synthesized.includes('[ROLE]\nTest Role'));
  assert.ok(synthesized.includes('1. Step A'));
  assert.ok(synthesized.includes('- Theme: dark'));
  assert.ok(synthesized.includes('Zero fake metrics.'));
});

test('5. Vibe Agent executes full workspace control: themes, glow, tickers, maps, custom sections', () => {
  const baseProfile = {
    identity: { fullName: 'Dr. Nafiz', roleBadge: 'Veterinary Researcher' },
    displayConfig: { theme: 'dark', portfolioTemplateId: 'acad-flagship' },
    publications: [{ id: 'pub-1', title: 'AMR Surveillance' }],
    skills: { technical: { skills: [{ name: 'Python' }] } }
  };

  // 1. Update theme, glow, ticker, and map
  const updatedDisplay = applyVibeTool(baseProfile, 'update_theme_and_layout', {
    theme: 'slate',
    accentColor: '#0d9488',
    glowLevel: 'radiant',
    perimeterGradient: 'active',
    tickerSpeed: 'normal',
    showMap: true,
    mapCoordinates: { latitude: 24.374043, longitude: 88.644182, locationName: 'Rajshahi Lab' },
    showFloatingCvPill: true,
    gridColumns: 3
  });

  assert.strictEqual(updatedDisplay.displayConfig.theme, 'slate');
  assert.strictEqual(updatedDisplay.displayConfig.accentColor, '#0d9488');
  assert.strictEqual(updatedDisplay.displayConfig.glowLevel, 'radiant');
  assert.strictEqual(updatedDisplay.displayConfig.perimeterGradient, 'active');
  assert.strictEqual(updatedDisplay.displayConfig.tickerSpeed, 'normal');
  assert.strictEqual(updatedDisplay.displayConfig.showMap, true);
  assert.strictEqual(updatedDisplay.locationMap.latitude, 24.374043);
  assert.strictEqual(updatedDisplay.displayConfig.showFloatingCvPill, true);
  assert.strictEqual(updatedDisplay.displayConfig.gridColumns, 3);

  // 2. Custom section & skill patching
  const updatedContent = applyVibeTool(baseProfile, 'patch_profile_data', {
    addSkills: ['Nextflow', 'BLAST+'],
    addCustomSections: [{
      title: 'Digital Evidence',
      layout: 'grid-3',
      items: [{ title: 'DVM Certificate' }]
    }]
  });

  assert.ok(updatedContent.skills.technical.skills.some((s) => s.name === 'Nextflow'));
  assert.ok(updatedContent.customSections.some((s) => s.title === 'Digital Evidence'));
});

test('6. Deterministic Offline Heuristics correctly handles English and Bengali commands', () => {
  const profile = { displayConfig: { theme: 'light' } };

  // English radiant glow & ticker intent
  const engResult = parseOfflineVibeIntent('Enable radiant glow, perimeter gradient, and ticker', profile);
  assert.strictEqual(engResult.tool, 'update_theme_and_layout');
  assert.strictEqual(engResult.arguments.glowLevel, 'radiant');
  assert.strictEqual(engResult.arguments.tickerSpeed, 'normal');

  // Bengali theme & color intent
  const bngResult = parseOfflineVibeIntent('থিম ডার্ক মোডে পরিবর্তন করো এবং বাটন নীল করো', profile);
  assert.strictEqual(bngResult.tool, 'update_theme_and_layout');
  assert.strictEqual(bngResult.arguments.theme, 'dark');
  assert.strictEqual(bngResult.arguments.accentColor, '#3b82f6');

  // Bengali skill intent
  const bngSkillResult = parseOfflineVibeIntent('স্কিল যোগ করো: Biopython, GeoPandas', profile);
  assert.strictEqual(bngSkillResult.tool, 'patch_profile_data');
  assert.ok(bngSkillResult.arguments.addSkills.includes('Biopython'));
  assert.ok(bngSkillResult.arguments.addSkills.includes('GeoPandas'));
});

test('7. Vibe Studio UI renders Prompt Engineering side panel, BYOK settings modal, and live model options', () => {
  const html = renderVibeStudioHtml({
    isConfigured: true,
    isPromptPaneOpen: true,
    messages: [],
    promptEngMessages: [{ role: 'agent', text: 'Ready', structuredPrompt: '[ROLE]\nArchitect' }]
  });

  assert.ok(html.includes('btn-toggle-prompt-chat'), 'Must include Prompt with AI toggle button');
  assert.ok(html.includes('vibe-prompt-engineering-pane'), 'Must render Prompt Engineering pane');
  assert.ok(html.includes('btn-fetch-live-models'), 'Must include Fetch Live Models button');
  assert.ok(html.includes('input-custom-model-id'), 'Must include Custom Model ID input');
  assert.ok(html.includes('btn-toggle-key-visibility'), 'Must include show/hide key toggle');
  assert.ok(html.includes('Google Gemini API'), 'Includes Google Gemini provider');
  assert.ok(html.includes('Anthropic Claude'), 'Includes Anthropic Claude provider');
  assert.ok(html.includes('DeepSeek'), 'Includes DeepSeek provider');
  assert.ok(html.includes('Groq'), 'Includes Groq provider');
  assert.ok(html.includes('OpenRouter'), 'Includes OpenRouter provider');

  // Verify Guide & Prompts UI
  const gpModalHtml = renderGuideAndPromptsHtml('prompts');
  assert.ok(gpModalHtml.includes('Structured Pro Prompts'), 'Header specifies Structured Pro Prompts');
  assert.ok(gpModalHtml.includes('btn-copy-prompt'), 'Cards include Copy button');
  assert.ok(gpModalHtml.includes('btn-use-prompt'), 'Cards include Use in Vibe button');
});

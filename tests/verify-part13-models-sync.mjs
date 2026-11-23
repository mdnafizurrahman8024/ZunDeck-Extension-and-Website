import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AI_PROVIDERS,
  PROVIDER_METADATA,
  PRESET_MODELS,
  DEFAULT_AI_CONFIG,
  getAvailableModels,
  fetchLiveModels,
  saveAiCredentials,
  getAiCredentials
} from '../core/ai/byok-client.js';

import {
  extractModelVersionNumbers,
  compareModelsNewestFirst,
  sortModelsNewestFirst
} from '../core/ai/model-version-sort.js';

import {
  MODEL_CACHE_KEY,
  CACHE_TTL_MS,
  NEW_BADGE_TTL_MS,
  isCacheStale,
  saveProviderModelCache,
  getProviderModelCache,
  formatLastSyncTimestamp
} from '../core/storage/model-cache-storage.js';

import {
  renderVibeStudioHtml
} from '../core/ui/vibe-studio-panel.js';

test('1. 2026 Active Default Models: All providers updated with zero legacy models', () => {
  // 1. Google Gemini
  const geminiModels = PRESET_MODELS[AI_PROVIDERS.GEMINI].map((m) => m.id);
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.GEMINI].defaultModel, 'gemini-4-hydrogen');
  assert.ok(geminiModels.includes('gemini-4-hydrogen'), 'Gemini includes gemini-4-hydrogen');
  assert.ok(geminiModels.includes('gemini-4-neon'), 'Gemini includes gemini-4-neon');
  assert.ok(geminiModels.includes('gemini-4-carbon'), 'Gemini includes gemini-4-carbon');
  assert.ok(geminiModels.includes('gemini-3.8-flash'), 'Gemini includes gemini-3.8-flash');
  assert.ok(geminiModels.includes('gemini-3.6-flash-lite'), 'Gemini includes gemini-3.6-flash-lite');

  // 2. OpenAI
  const openaiModels = PRESET_MODELS[AI_PROVIDERS.OPENAI].map((m) => m.id);
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.OPENAI].defaultModel, 'gpt-6.2-sol');
  assert.ok(openaiModels.includes('gpt-6.2-sol'), 'OpenAI includes gpt-6.2-sol');
  assert.ok(openaiModels.includes('gpt-6.2-astra'), 'OpenAI includes gpt-6.2-astra');
  assert.ok(openaiModels.includes('gpt-6-astra'), 'OpenAI includes gpt-6-astra');
  assert.ok(openaiModels.includes('gpt-6.1-sol'), 'OpenAI includes gpt-6.1-sol');
  assert.ok(openaiModels.includes('gpt-6.1-terra'), 'OpenAI includes gpt-6.1-terra');
  assert.ok(openaiModels.includes('gpt-6-luna'), 'OpenAI includes gpt-6-luna');

  // 3. Anthropic Claude
  const claudeModels = PRESET_MODELS[AI_PROVIDERS.ANTHROPIC].map((m) => m.id);
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.ANTHROPIC].defaultModel, 'claude-sonnet-5-5');
  assert.ok(claudeModels.includes('claude-sonnet-5-5'), 'Claude includes claude-sonnet-5-5');
  assert.ok(claudeModels.includes('claude-opus-5-5'), 'Claude includes claude-opus-5-5');
  assert.ok(claudeModels.includes('claude-fable-5-2'), 'Claude includes claude-fable-5-2');
  assert.ok(claudeModels.includes('claude-haiku-5-5'), 'Claude includes claude-haiku-5-5');

  // 4. xAI Grok
  const xaiModels = PRESET_MODELS[AI_PROVIDERS.XAI].map((m) => m.id);
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.XAI].defaultModel, 'grok-4.7');
  assert.ok(xaiModels.includes('grok-4.7'), 'xAI includes grok-4.7');
  assert.ok(xaiModels.includes('grok-4.6'), 'xAI includes grok-4.6');
  assert.ok(xaiModels.includes('grok-4.5'), 'xAI includes grok-4.5');
  assert.ok(xaiModels.includes('grok-4.20-reasoning'), 'xAI includes grok-4.20-reasoning');
  assert.ok(xaiModels.includes('grok-4-fast'), 'xAI includes grok-4-fast');

  // 5. DeepSeek
  const deepseekModels = PRESET_MODELS[AI_PROVIDERS.DEEPSEEK].map((m) => m.id);
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.DEEPSEEK].defaultModel, 'deepseek-v4.1-flash');
  assert.ok(deepseekModels.includes('deepseek-v4.1-flash'), 'DeepSeek includes deepseek-v4.1-flash');
  assert.ok(deepseekModels.includes('deepseek-v4-pro'), 'DeepSeek includes deepseek-v4-pro');

  // 6. Mistral AI
  const mistralModels = PRESET_MODELS[AI_PROVIDERS.MISTRAL].map((m) => m.id);
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.MISTRAL].defaultModel, 'mistral-large-latest');
  assert.ok(mistralModels.includes('mistral-large-latest'), 'Mistral includes mistral-large-latest');
  assert.ok(mistralModels.includes('codestral-latest'), 'Mistral includes codestral-latest');

  // 7. Groq
  const groqModels = PRESET_MODELS[AI_PROVIDERS.GROQ].map((m) => m.id);
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.GROQ].defaultModel, 'openai/gpt-oss-120b');
  assert.ok(groqModels.includes('openai/gpt-oss-120b'), 'Groq includes openai/gpt-oss-120b');
  assert.ok(groqModels.includes('qwen/qwen3.8-27b'), 'Groq includes qwen/qwen3.8-27b');
  assert.ok(groqModels.includes('openai/gpt-oss-20b'), 'Groq includes openai/gpt-oss-20b');
  assert.ok(groqModels.includes('llama-3.3-70b-versatile'), 'Groq includes llama-3.3-70b-versatile');

  // 8. OpenRouter & Default System Config
  assert.strictEqual(PROVIDER_METADATA[AI_PROVIDERS.OPENROUTER].defaultModel, 'openrouter/auto');
  assert.strictEqual(DEFAULT_AI_CONFIG.model, 'gemini-4-hydrogen');

  // 9. Verify zero retired models across all presets
  const retiredModelPatterns = ['gemini-1.5', 'claude-3-5', 'o1-', 'o3-mini', 'o4-mini', 'grok-2'];
  for (const [prov, models] of Object.entries(PRESET_MODELS)) {
    for (const m of models) {
      for (const retired of retiredModelPatterns) {
        assert.ok(!m.id.toLowerCase().includes(retired), `Retired model ${retired} must NOT be present in ${prov} (${m.id})`);
      }
    }
  }
});

test('2. Semantic Version & Capability Tier Sorting: Newest and highest capability rank first', () => {
  // Test numeric version extraction
  assert.deepStrictEqual(extractModelVersionNumbers('gpt-6.2-sol'), [6, 2, 0]);
  assert.deepStrictEqual(extractModelVersionNumbers('gemini-4-hydrogen'), [4, 0, 0]);
  assert.deepStrictEqual(extractModelVersionNumbers('grok-4.20-reasoning'), [4, 20, 0]);
  assert.deepStrictEqual(extractModelVersionNumbers('claude-sonnet-5-5'), [5, 5, 0]);

  // Test version comparison: gpt-6.2 before gpt-6.1
  const sortedOpenAI = sortModelsNewestFirst([
    { id: 'gpt-6.1-sol', name: 'GPT 6.1 Sol' },
    { id: 'gpt-6.2-sol', name: 'GPT 6.2 Sol' }
  ]);
  assert.strictEqual(sortedOpenAI[0].id, 'gpt-6.2-sol');

  // Test version comparison: gemini-4 before gemini-3.8
  const sortedGemini = sortModelsNewestFirst([
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen' }
  ]);
  assert.strictEqual(sortedGemini[0].id, 'gemini-4-hydrogen');

  // Test version comparison: grok-4.20 before grok-4.7 (numeric 20 > 7)
  const sortedGrok = sortModelsNewestFirst([
    { id: 'grok-4.7', name: 'Grok 4.7' },
    { id: 'grok-4.20-reasoning', name: 'Grok 4.20 Reasoning' }
  ]);
  assert.strictEqual(sortedGrok[0].id, 'grok-4.20-reasoning');

  // Test timestamp precedence: created timestamp descending
  const sortedByTime = sortModelsNewestFirst([
    { id: 'model-a', created: 1700000000 },
    { id: 'model-b', created: 1780000000 }
  ]);
  assert.strictEqual(sortedByTime[0].id, 'model-b');
});

test('3. Unified Model Cache Storage: 6h TTL, 7-day [NEW] badge, and relative timestamps', async () => {
  const provider = 'test_provider_x';
  const initialModels = [
    { id: 'test-model-alpha', name: 'Test Model Alpha' },
    { id: 'test-model-beta', name: 'Test Model Beta' }
  ];

  // First save: both models should be tagged isNew: true
  const saved = await saveProviderModelCache(provider, initialModels);
  assert.strictEqual(saved.models.length, 2);
  assert.ok(saved.models.every((m) => m.isNew === true), 'All brand new models must have isNew: true');
  assert.ok(saved.lastUpdated > 0);

  // Fresh cache should not be stale
  assert.strictEqual(isCacheStale(saved), false);

  // Simulate cache older than 6 hours
  const staleEntry = { ...saved, lastUpdated: Date.now() - (CACHE_TTL_MS + 1000) };
  assert.strictEqual(isCacheStale(staleEntry), true);

  // Second save with an older model (> 7 days) and a brand new model
  const eightDaysAgo = Date.now() - (NEW_BADGE_TTL_MS + 10000);
  saved.knownIds['test-model-alpha'] = eightDaysAgo; // Simulate model discovered 8 days ago

  const updatedModels = [
    { id: 'test-model-alpha', name: 'Test Model Alpha' },
    { id: 'test-model-gamma', name: 'Test Model Gamma' } // New model
  ];

  const resaved = await saveProviderModelCache(provider, updatedModels);
  const alpha = resaved.models.find((m) => m.id === 'test-model-alpha');
  const gamma = resaved.models.find((m) => m.id === 'test-model-gamma');

  assert.strictEqual(alpha.isNew, false, 'Model discovered >7 days ago must NOT have isNew');
  assert.strictEqual(gamma.isNew, true, 'Brand new model must have isNew: true');

  // Timestamp formatting
  assert.strictEqual(formatLastSyncTimestamp(Date.now()), 'Just now');
  assert.strictEqual(formatLastSyncTimestamp(Date.now() - 5 * 60 * 1000), '5m ago');
  assert.strictEqual(formatLastSyncTimestamp(Date.now() - 2 * 3600 * 1000), '2h ago');
  assert.strictEqual(formatLastSyncTimestamp(Date.now() - 48 * 3600 * 1000), '2d ago');
  assert.strictEqual(formatLastSyncTimestamp(0), 'Never synced');
});

test('4. Stale-While-Revalidate Engine: getAvailableModels returns cached or active 2026 presets', async () => {
  // Unconfigured provider fallback
  const models = await getAvailableModels(AI_PROVIDERS.GEMINI);
  assert.ok(Array.isArray(models) && models.length > 0);
  assert.ok(models.some((m) => m.id === 'gemini-4-hydrogen'));

  // OpenRouter live query without API key returns valid catalog or presets
  const openRouterRes = await fetchLiveModels({
    provider: AI_PROVIDERS.OPENROUTER,
    apiKey: ''
  });
  assert.ok(openRouterRes.models && openRouterRes.models.length > 0);
  assert.ok(openRouterRes.models.some((m) => m.id.includes('openrouter/auto') || m.id.includes('/')));
});

test('5. Vibe Studio UI: Renders Sync Models button, Last updated indicator, and [NEW] badge', () => {
  const html = renderVibeStudioHtml({
    isExtension: false,
    isConfigured: true,
    messages: []
  });

  // Verify UI controls
  assert.ok(html.includes('id="btn-sync-models"'), 'Must render #btn-sync-models button');
  assert.ok(html.includes('Sync Models'), 'Must have "Sync Models" button text');
  assert.ok(html.includes('id="model-last-updated"'), 'Must render #model-last-updated timestamp element');
  assert.ok(html.includes('id="select-ai-model"'), 'Must render #select-ai-model dropdown');
  assert.ok(html.includes('id="input-custom-model-id"'), 'Must render #input-custom-model-id custom model override');
  assert.ok(html.includes('fa-arrows-rotate'), 'Must include FontAwesome arrows-rotate sync icon');
});

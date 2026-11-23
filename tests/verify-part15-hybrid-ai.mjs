import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getFreeProxyUrl,
  isOpenRouterFreeModel,
  callFreeProxyChat,
  testFreeProxyConnection
} from '../core/ai/free-proxy.js';

import {
  AI_PROVIDERS,
  PROVIDER_METADATA,
  PRESET_MODELS,
  getAiCredentials,
  saveAiCredentials,
  isAiConfigured,
  callAiText,
  testAiConnection,
  fetchLiveModels
} from '../core/ai/byok-client.js';

import {
  renderVibeStudioHtml
} from '../core/ui/vibe-studio-panel.js';

const EXPECTED_PROXY_URL = Buffer.from('aHR0cHM6Ly96dW5kZWNrLWZyZWUtcHJveHkubWRuYWZpenVycmFobWFuODAyNC53b3JrZXJzLmRldg==', 'base64').toString('utf8');

test('1. Free Proxy URL Obfuscation & Safe Runtime Resolution', () => {
  // Obfuscated Base64 resolves to the exact worker URL
  const resolvedUrl = getFreeProxyUrl();
  assert.strictEqual(resolvedUrl, EXPECTED_PROXY_URL);

  // Verify process.env override works
  const originalEnv = process.env.ZUNDECK_FREE_PROXY_URL;
  process.env.ZUNDECK_FREE_PROXY_URL = 'https://custom-proxy.example.internal';
  assert.strictEqual(getFreeProxyUrl(), 'https://custom-proxy.example.internal');

  // Restore env
  if (originalEnv) {
    process.env.ZUNDECK_FREE_PROXY_URL = originalEnv;
  } else {
    delete process.env.ZUNDECK_FREE_PROXY_URL;
  }
  assert.strictEqual(getFreeProxyUrl(), EXPECTED_PROXY_URL);
});

test('2. OpenRouter :free Model Detection & Zero-Cost Badging', () => {
  // 1. Explicit free models
  assert.strictEqual(isOpenRouterFreeModel('openrouter/free'), true);
  assert.strictEqual(isOpenRouterFreeModel('meta-llama/llama-3.3-70b-instruct:free'), true);
  assert.strictEqual(isOpenRouterFreeModel('google/gemini-2.0-flash-exp:free'), true);
  assert.strictEqual(isOpenRouterFreeModel('qwen/qwen-2.5-72b-instruct:free'), true);
  assert.strictEqual(isOpenRouterFreeModel('mistralai/mistral-7b-instruct:free'), true);

  // 2. Object with isFree flag or :free ID
  assert.strictEqual(isOpenRouterFreeModel({ id: 'openrouter/free' }), true);
  assert.strictEqual(isOpenRouterFreeModel({ id: 'custom-model:free' }), true);
  assert.strictEqual(isOpenRouterFreeModel({ id: 'custom-model', isFree: true }), true);

  // 3. Object with pricing: prompt 0 and completion 0
  assert.strictEqual(isOpenRouterFreeModel({
    id: 'deepseek/deepseek-r1-zero',
    pricing: { prompt: '0', completion: '0' }
  }), true);
  assert.strictEqual(isOpenRouterFreeModel({
    id: 'meta-llama/llama-3.2-3b-instruct',
    pricing: { prompt: '0.0', completion: '0.0' }
  }), true);

  // 4. Paid models must return false
  assert.strictEqual(isOpenRouterFreeModel('gemini-4-hydrogen'), false);
  assert.strictEqual(isOpenRouterFreeModel('gpt-6.2-sol'), false);
  assert.strictEqual(isOpenRouterFreeModel('claude-sonnet-5-5'), false);
  assert.strictEqual(isOpenRouterFreeModel('openrouter/auto'), false);
  assert.strictEqual(isOpenRouterFreeModel({
    id: 'openai/gpt-4o',
    pricing: { prompt: '0.000005', completion: '0.000015' }
  }), false);
});

test('3. OpenRouter Preset Models include 2026 Free Defaults', () => {
  const openRouterModels = PRESET_MODELS[AI_PROVIDERS.OPENROUTER];
  assert.ok(Array.isArray(openRouterModels) && openRouterModels.length >= 6);

  const modelIds = openRouterModels.map((m) => m.id);
  assert.ok(modelIds.includes('openrouter/auto'), 'Includes openrouter/auto');
  assert.ok(modelIds.includes('openrouter/free'), 'Includes openrouter/free');
  assert.ok(modelIds.includes('meta-llama/llama-3.3-70b-instruct:free'), 'Includes llama-3.3-70b-instruct:free');
  assert.ok(modelIds.includes('google/gemini-2.0-flash-exp:free'), 'Includes gemini-2.0-flash-exp:free');
  assert.ok(modelIds.includes('qwen/qwen-2.5-72b-instruct:free'), 'Includes qwen-2.5-72b-instruct:free');
  assert.ok(modelIds.includes('mistralai/mistral-7b-instruct:free'), 'Includes mistral-7b-instruct:free');

  // Verify that free models have [FREE] badge in their name
  const freeModel = openRouterModels.find((m) => m.id === 'openrouter/free');
  assert.ok(freeModel.name.includes('[FREE]'), 'openrouter/free name includes [FREE]');
});

test('4. Mode 1 — ZunDeck Built-in Free Tier Execution (No API Key)', async () => {
  // Clear any existing keys to simulate fresh install / free mode
  await saveAiCredentials({
    provider: AI_PROVIDERS.OPENROUTER,
    apiKey: '',
    model: 'openrouter/free'
  });

  const creds = await getAiCredentials();
  assert.strictEqual(creds.hasPersonalKey, false);
  assert.strictEqual(creds.executionMode, 'free');
  assert.strictEqual(creds.isModelFree, true);

  // Mock global fetch to intercept free proxy request
  const originalFetch = globalThis.fetch;
  let interceptedRequest = null;

  globalThis.fetch = async (url, options) => {
    interceptedRequest = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Free proxy response from Cloudflare Worker'
            }
          }
        ]
      }),
      text: async () => ''
    };
  };

  try {
    // 1. Call free model via callAiText
    const reply = await callAiText('Hello free AI', {
      model: 'openrouter/free'
    });

    assert.strictEqual(reply, 'Free proxy response from Cloudflare Worker');
    assert.ok(interceptedRequest !== null, 'Request was sent');
    assert.strictEqual(interceptedRequest.url, EXPECTED_PROXY_URL);
    assert.strictEqual(interceptedRequest.options.method, 'POST');

    // Verify zero Authorization header sent from client
    assert.strictEqual(interceptedRequest.options.headers.Authorization, undefined);

    // Verify payload schema
    const sentBody = JSON.parse(interceptedRequest.options.body);
    assert.strictEqual(sentBody.model, 'openrouter/free');
    assert.deepStrictEqual(sentBody.messages, [{ role: 'user', content: 'Hello free AI' }]);
    assert.strictEqual(sentBody.stream, false);

    // 2. Test connection with free model
    const testResult = await testAiConnection({
      provider: AI_PROVIDERS.OPENROUTER,
      apiKey: '',
      model: 'openrouter/free'
    });
    assert.strictEqual(testResult.success, true);
    assert.ok(testResult.message.includes('Free Tier proxy'));

    // 3. Selecting a paid model without personal key must throw the exact unlock banner message
    await assert.rejects(
      async () => {
        await callAiText('Hello paid model', {
          model: 'gpt-6.2-sol',
          apiKey: ''
        });
      },
      (err) => {
        assert.ok(err.message.includes('Enter your own API key to unlock paid models, or switch to a FREE model.'));
        return true;
      }
    );

    // 4. Test connection on a paid model without key must return clean unlock guidance
    const paidTestResult = await testAiConnection({
      provider: AI_PROVIDERS.OPENAI,
      apiKey: '',
      model: 'gpt-6.2-sol'
    });
    assert.strictEqual(paidTestResult.success, false);
    assert.ok(paidTestResult.message.includes('Enter your own API key to unlock paid models, or switch to a FREE model.'));

  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('5. Mode 2 — User BYOK Mode (With Personal API Key)', async () => {
  // Save user API key
  await saveAiCredentials({
    provider: AI_PROVIDERS.GEMINI,
    apiKey: 'AIzaSyTestUserKeySecret9999',
    model: 'gemini-4-hydrogen'
  });

  const creds = await getAiCredentials();
  assert.strictEqual(creds.hasPersonalKey, true);
  assert.strictEqual(creds.executionMode, 'byok');

  // Mock global fetch to verify direct client-side provider call
  const originalFetch = globalThis.fetch;
  let interceptedDirect = null;

  globalThis.fetch = async (url, options) => {
    interceptedDirect = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Direct response from Google Gemini' }]
            }
          }
        ]
      })
    };
  };

  try {
    const reply = await callAiText('Test direct BYOK');
    assert.strictEqual(reply, 'Direct response from Google Gemini');
    assert.ok(interceptedDirect.url.includes('generativelanguage.googleapis.com'));
    assert.ok(interceptedDirect.url.includes('AIzaSyTestUserKeySecret9999'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('6. Vibe Studio UI: Mode Indicator Pill, Free Filter & Unlock Banner', () => {
  // 1. Free Mode UI
  const freeHtml = renderVibeStudioHtml({
    hasPersonalKey: false,
    isConfigured: true,
    executionMode: 'free'
  });

  assert.ok(freeHtml.includes('⚡ ZunDeck Free Tier'), 'Displays ⚡ ZunDeck Free Tier pill');
  assert.ok(freeHtml.includes('id="check-free-only"'), 'Includes Free Only filter checkbox');
  assert.ok(freeHtml.includes('id="banner-paid-unlock"'), 'Includes paid unlock banner element');
  assert.ok(freeHtml.includes('Enter your own API key to unlock paid models, or switch to a FREE model.'), 'Banner text present');

  // 2. BYOK Mode UI
  const byokHtml = renderVibeStudioHtml({
    hasPersonalKey: true,
    isConfigured: true,
    executionMode: 'byok'
  });

  assert.ok(byokHtml.includes('🔑 Personal API Key'), 'Displays 🔑 Personal API Key pill');
});

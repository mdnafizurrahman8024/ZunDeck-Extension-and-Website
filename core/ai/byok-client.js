import { loadPrivateVault, savePrivateVault } from '../storage/vault-storage.js';
import {
  getProviderModelCache,
  saveProviderModelCache,
  isCacheStale,
  formatLastSyncTimestamp
} from '../storage/model-cache-storage.js';
import {
  sortModelsNewestFirst
} from './model-version-sort.js';

export {
  formatLastSyncTimestamp
};

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  ANTHROPIC: 'anthropic',
  OPENAI: 'openai',
  DEEPSEEK: 'deepseek',
  GROQ: 'groq',
  OPENROUTER: 'openrouter',
  XAI: 'xai',
  MISTRAL: 'mistral',
  OPENAI_COMPATIBLE: 'openai_compatible',
  CUSTOM: 'custom'
};

export const PROVIDER_METADATA = {
  [AI_PROVIDERS.GEMINI]: {
    id: AI_PROVIDERS.GEMINI,
    name: 'Google Gemini (Default — Multimodal Text, Vision & PDFs)',
    badge: 'Default • Free Tier',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-4-hydrogen',
    keyPlaceholder: 'AIzaSy...',
    keyHelpUrl: 'https://aistudio.google.com',
    keyHelpText: 'Free API key from aistudio.google.com (zero credit card needed).'
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    id: AI_PROVIDERS.ANTHROPIC,
    name: 'Anthropic Claude (Claude Sonnet 5.5, Opus 5.5)',
    badge: 'Frontier Reasoning',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-5-5',
    keyPlaceholder: 'sk-ant-api...',
    keyHelpUrl: 'https://console.anthropic.com',
    keyHelpText: 'API key from console.anthropic.com.'
  },
  [AI_PROVIDERS.OPENAI]: {
    id: AI_PROVIDERS.OPENAI,
    name: 'OpenAI (GPT-6.2 Sol, Astra & Terra)',
    badge: 'Industry Standard',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-6.2-sol',
    keyPlaceholder: 'sk-...',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyHelpText: 'API key from platform.openai.com/api-keys.'
  },
  [AI_PROVIDERS.DEEPSEEK]: {
    id: AI_PROVIDERS.DEEPSEEK,
    name: 'DeepSeek (DeepSeek-V4.1 Flash & Pro)',
    badge: 'High Reasoning • Low Cost',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-v4.1-flash',
    keyPlaceholder: 'sk-...',
    keyHelpUrl: 'https://platform.deepseek.com',
    keyHelpText: 'Ultra-cost-effective reasoning from platform.deepseek.com.'
  },
  [AI_PROVIDERS.GROQ]: {
    id: AI_PROVIDERS.GROQ,
    name: 'Groq (Ultra-Fast GPT-OSS 120B & Qwen 3.8)',
    badge: 'Sub-Second Speed',
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    keyPlaceholder: 'gsk_...',
    keyHelpUrl: 'https://console.groq.com/keys',
    keyHelpText: 'Ultra-fast inference (800+ T/s) from console.groq.com.'
  },
  [AI_PROVIDERS.OPENROUTER]: {
    id: AI_PROVIDERS.OPENROUTER,
    name: 'OpenRouter (Access 200+ Models with 1 Key)',
    badge: 'Universal Router',
    defaultEndpoint: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/auto',
    keyPlaceholder: 'sk-or-v1-... (optional to browse)',
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyHelpText: 'Live global models directory browsable without API key from openrouter.ai.'
  },
  [AI_PROVIDERS.XAI]: {
    id: AI_PROVIDERS.XAI,
    name: 'xAI (Grok-4.7 & Grok-4.20 Reasoning)',
    badge: 'xAI Frontier',
    defaultEndpoint: 'https://api.x.ai/v1',
    defaultModel: 'grok-4.7',
    keyPlaceholder: 'xai-...',
    keyHelpUrl: 'https://console.x.ai',
    keyHelpText: 'Grok models from console.x.ai.'
  },
  [AI_PROVIDERS.MISTRAL]: {
    id: AI_PROVIDERS.MISTRAL,
    name: 'Mistral AI (Mistral Large Latest & Codestral)',
    badge: 'European Frontier',
    defaultEndpoint: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    keyPlaceholder: '...',
    keyHelpUrl: 'https://console.mistral.ai',
    keyHelpText: 'European multilingual frontier models from console.mistral.ai.'
  },
  [AI_PROVIDERS.CUSTOM]: {
    id: AI_PROVIDERS.CUSTOM,
    name: 'Custom Endpoint (Ollama, LM Studio, vLLM)',
    badge: 'Local & Self-Hosted',
    defaultEndpoint: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    keyPlaceholder: 'Optional key (e.g. ollama or sk-...)',
    keyHelpUrl: '',
    keyHelpText: 'Local or custom server supporting OpenAI /chat/completions.'
  },
  [AI_PROVIDERS.OPENAI_COMPATIBLE]: {
    id: AI_PROVIDERS.OPENAI_COMPATIBLE,
    name: 'OpenAI-Compatible Endpoint',
    badge: 'Open Protocol',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-6.2-sol',
    keyPlaceholder: 'sk-...',
    keyHelpUrl: '',
    keyHelpText: 'Any endpoint implementing the OpenAI completions API.'
  }
};

export const PRESET_MODELS = {
  [AI_PROVIDERS.GEMINI]: [
    { id: 'gemini-4-hydrogen', name: 'Gemini 4 Hydrogen (Default — Flagship Multimodal)' },
    { id: 'gemini-4-neon', name: 'Gemini 4 Neon (Ultra-Low Latency & Streaming)' },
    { id: 'gemini-4-carbon', name: 'Gemini 4 Carbon (High-Throughput Batch Processing)' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (High-Efficiency Reasoning)' },
    { id: 'gemini-3.6-flash-lite', name: 'Gemini 3.6 Flash-Lite (High Quota & Lightweight)' }
  ],
  [AI_PROVIDERS.OPENAI]: [
    { id: 'gpt-6.2-sol', name: 'GPT-6.2 Sol (Default — Flagship Reasoning & Multimodal)' },
    { id: 'gpt-6.2-astra', name: 'GPT-6.2 Astra (Autonomous Logic & Agentic Coding)' },
    { id: 'gpt-6-astra', name: 'GPT-6 Astra (Frontier Multimodal Reasoning)' },
    { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol (High-Precision Analytical Reasoning)' },
    { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra (Efficient Production Agent)' },
    { id: 'gpt-6-luna', name: 'GPT-6 Luna (Lightweight Fast Agent)' }
  ],
  [AI_PROVIDERS.ANTHROPIC]: [
    { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5 (Default — Hybrid Reasoning & Artifacts)' },
    { id: 'claude-opus-5-5', name: 'Claude Opus 5.5 (Deep Research & Complex Logic)' },
    { id: 'claude-fable-5-2', name: 'Claude Fable 5.2 (Creative Synthesis & Nuance)' },
    { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5 (Instant High-Throughput)' }
  ],
  [AI_PROVIDERS.XAI]: [
    { id: 'grok-4.7', name: 'Grok 4.7 (Default — Real-Time Knowledge & Vision)' },
    { id: 'grok-4.6', name: 'Grok 4.6 (Frontier Multimodal Reasoning)' },
    { id: 'grok-4.5', name: 'Grok 4.5 (High-Context Mathematical Reasoning)' },
    { id: 'grok-4.20-reasoning', name: 'Grok 4.20 Reasoning (Deep Chain-of-Thought)' },
    { id: 'grok-4-fast', name: 'Grok 4 Fast (Sub-Second Latency)' }
  ],
  [AI_PROVIDERS.DEEPSEEK]: [
    { id: 'deepseek-v4.1-flash', name: 'DeepSeek-V4.1 Flash (Default — Ultra-Fast Reasoning)' },
    { id: 'deepseek-v4-pro', name: 'DeepSeek-V4 Pro (Large Context Architecture)' }
  ],
  [AI_PROVIDERS.MISTRAL]: [
    { id: 'mistral-large-latest', name: 'Mistral Large Latest (Default — Flagship Multilingual)' },
    { id: 'codestral-latest', name: 'Codestral Latest (Specialized Coding Agent)' }
  ],
  [AI_PROVIDERS.GROQ]: [
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Default — Ultra-Fast 800+ T/s)' },
    { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (High-Precision Reasoning)' },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Instant Sub-50ms)' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' }
  ],
  [AI_PROVIDERS.OPENROUTER]: [
    { id: 'openrouter/auto', name: 'OpenRouter Auto (Default — Dynamic Intelligent Routing)' }
  ],
  [AI_PROVIDERS.CUSTOM]: [
    { id: 'llama3', name: 'llama3 (Ollama / Local)' },
    { id: 'mistral', name: 'mistral (Ollama / Local)' },
    { id: 'qwen2.5-coder', name: 'qwen2.5-coder (Local Code Model)' },
    { id: 'deepseek-r1', name: 'deepseek-r1 (Local Reasoning Model)' }
  ],
  [AI_PROVIDERS.OPENAI_COMPATIBLE]: [
    { id: 'gpt-6.2-sol', name: 'GPT-6.2 Sol' },
    { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol' }
  ]
};

export const GEMINI_MODELS = PRESET_MODELS[AI_PROVIDERS.GEMINI];

export const DEFAULT_AI_CONFIG = {
  provider: AI_PROVIDERS.GEMINI,
  apiKey: '',
  model: 'gemini-4-hydrogen',
  customModelId: '',
  customEndpoint: 'https://api.openai.com/v1',
  customModel: 'gpt-6.2-sol',
  temperature: 0.2
};

export function getProviderEndpoint(provider, customEndpoint = '') {
  if (provider === AI_PROVIDERS.CUSTOM || provider === AI_PROVIDERS.OPENAI_COMPATIBLE) {
    return (customEndpoint || 'http://localhost:11434/v1').replace(/\/+$/, '');
  }
  const meta = PROVIDER_METADATA[provider];
  return (meta?.defaultEndpoint || 'https://api.openai.com/v1').replace(/\/+$/, '');
}

export async function getAiCredentials() {
  const vault = await loadPrivateVault();
  const keys = vault.keys || {};
  const settings = vault.settings?.ai || {};
  const provider = settings.provider || AI_PROVIDERS.GEMINI;

  let apiKey = keys[provider] || '';
  if (!apiKey) {
    if (provider === AI_PROVIDERS.GEMINI) {
      apiKey = keys.gemini || '';
    } else if (provider === AI_PROVIDERS.OPENAI_COMPATIBLE || provider === AI_PROVIDERS.OPENAI || provider === AI_PROVIDERS.CUSTOM) {
      apiKey = keys.openai || '';
    }
  }

  const meta = PROVIDER_METADATA[provider] || PROVIDER_METADATA[AI_PROVIDERS.GEMINI];
  const model = settings.customModelId || settings.model || meta.defaultModel;

  return {
    provider,
    apiKey,
    model,
    customModelId: settings.customModelId || '',
    customEndpoint: settings.customEndpoint || meta.defaultEndpoint,
    customModel: settings.customModel || settings.customModelId || meta.defaultModel,
    temperature: settings.temperature ?? DEFAULT_AI_CONFIG.temperature
  };
}

export async function saveAiCredentials(newConfig = {}) {
  const vault = await loadPrivateVault();
  vault.keys = vault.keys || {};
  vault.settings = vault.settings || {};
  vault.settings.ai = vault.settings.ai || {};

  const provider = newConfig.provider || vault.settings.ai.provider || AI_PROVIDERS.GEMINI;
  vault.settings.ai.provider = provider;

  if (newConfig.apiKey !== undefined) {
    const trimmedKey = newConfig.apiKey.trim();
    vault.keys[provider] = trimmedKey;
    if (provider === AI_PROVIDERS.GEMINI) {
      vault.keys.gemini = trimmedKey;
    } else if (provider === AI_PROVIDERS.OPENAI_COMPATIBLE || provider === AI_PROVIDERS.OPENAI || provider === AI_PROVIDERS.CUSTOM) {
      vault.keys.openai = trimmedKey;
    }
  }

  if (newConfig.customModelId !== undefined) {
    vault.settings.ai.customModelId = newConfig.customModelId.trim();
  } else if (newConfig.model !== undefined) {
    vault.settings.ai.customModelId = '';
  }

  if (newConfig.model !== undefined) vault.settings.ai.model = newConfig.model;
  if (newConfig.customEndpoint !== undefined) vault.settings.ai.customEndpoint = newConfig.customEndpoint.trim();
  if (newConfig.customModel !== undefined) vault.settings.ai.customModel = newConfig.customModel.trim();
  if (newConfig.temperature !== undefined) vault.settings.ai.temperature = newConfig.temperature;

  await savePrivateVault(vault);
  return getAiCredentials();
}

export async function isAiConfigured() {
  const creds = await getAiCredentials();
  return Boolean(creds.apiKey && creds.apiKey.trim().length > 3);
}

export async function getAvailableModels(provider, options = {}) {
  const creds = await getAiCredentials();
  const targetProvider = provider || creds.provider || AI_PROVIDERS.GEMINI;

  // 1. Read from persistent cross-platform cache immediately
  const cached = await getProviderModelCache(targetProvider);
  const stale = !cached || isCacheStale(cached);

  // 2. Stale-While-Revalidate: Trigger background fetch if stale or forced
  const hasKey = Boolean(creds.apiKey && creds.apiKey.trim().length > 3);
  const canFetch = hasKey || targetProvider === AI_PROVIDERS.OPENROUTER || targetProvider === AI_PROVIDERS.CUSTOM;

  if (canFetch && (stale || options.forceSync)) {
    const fetchPromise = fetchLiveModels({
      provider: targetProvider,
      apiKey: creds.apiKey,
      customEndpoint: creds.customEndpoint
    }).catch(() => null);

    if (options.waitForSync) {
      const syncRes = await fetchPromise;
      if (syncRes && syncRes.models?.length) {
        return syncRes.models;
      }
    }
  }

  // 3. Return cached models if present, otherwise fallback to active 2026 presets
  if (cached && Array.isArray(cached.models) && cached.models.length) {
    return cached.models;
  }

  return PRESET_MODELS[targetProvider] || [];
}

export async function fetchLiveModels(customCreds = null) {
  const creds = customCreds || (await getAiCredentials());
  const provider = creds.provider || AI_PROVIDERS.GEMINI;
  const apiKey = (creds.apiKey || '').trim();

  // OpenRouter allows public live model exploration without API key!
  // Custom local endpoints also allow unauthenticated querying.
  if (!apiKey && provider !== AI_PROVIDERS.CUSTOM && provider !== AI_PROVIDERS.OPENROUTER) {
    const cached = await getProviderModelCache(provider);
    return {
      success: false,
      message: 'API key is required to query live models.',
      models: (cached && cached.models?.length) ? cached.models : (PRESET_MODELS[provider] || [])
    };
  }

  try {
    let rawModels = [];

    // 1. Google Gemini
    if (provider === AI_PROVIDERS.GEMINI) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Google API returned HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.models) ? data.models : [];
      rawModels = list
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent') || !m.supportedGenerationMethods)
        .map((m) => {
          const id = (m.name || '').replace(/^models\//, '');
          const displayName = m.displayName ? `${m.displayName} (${id})` : id;
          return { id, name: displayName };
        });
    }

    // 2. Anthropic Claude (CORS safe with direct browser access header)
    else if (provider === AI_PROVIDERS.ANTHROPIC) {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      });
      if (!res.ok) throw new Error(`Anthropic API returned HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];
      rawModels = list.map((m) => ({
        id: m.id,
        name: m.display_name ? `${m.display_name} (${m.id})` : m.id,
        created: m.created_at ? new Date(m.created_at).getTime() : undefined
      }));
    }

    // 3. OpenRouter (Public exploration without API key support)
    else if (provider === AI_PROVIDERS.OPENROUTER) {
      const headers = {
        'HTTP-Referer': 'https://zundeck.org',
        'X-Title': 'ZunDeck'
      };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
      if (!res.ok) throw new Error(`OpenRouter returned HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];
      rawModels = list.map((m) => ({
        id: m.id,
        name: m.name ? `${m.name} (${m.id})` : m.id,
        created: m.created ? Number(m.created) * 1000 : undefined
      }));
    }

    // 4. OpenAI (Strict filter for chat/reasoning models; exclude whisper, tts, dall-e, embedding, etc.)
    else if (provider === AI_PROVIDERS.OPENAI) {
      const endpoint = getProviderEndpoint(provider, creds.customEndpoint);
      const res = await fetch(`${endpoint}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`OpenAI returned HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : [];

      const CHAT_INCLUDE_REGEX = /^(gpt-|o\d|chatgpt-)/i;
      const CHAT_EXCLUDE_REGEX = /(dall-e|whisper|tts|embedding|moderation|babbage|davinci|audio|canary)/i;

      rawModels = list
        .filter((m) => {
          const id = m.id || '';
          return CHAT_INCLUDE_REGEX.test(id) && !CHAT_EXCLUDE_REGEX.test(id);
        })
        .map((m) => ({
          id: m.id,
          name: m.id,
          created: m.created ? Number(m.created) * 1000 : undefined
        }));
    }

    // 5. Groq, xAI, DeepSeek, Mistral, and Custom
    else {
      const endpoint = getProviderEndpoint(provider, creds.customEndpoint);
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(`${endpoint}/models`, { method: 'GET', headers });
      if (!res.ok) throw new Error(`${PROVIDER_METADATA[provider]?.name || 'Endpoint'} returned HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      rawModels = list.map((m) => {
        const id = typeof m === 'string' ? m : (m.id || m.name || '');
        const name = m.name && m.name !== id ? `${m.name} (${id})` : id;
        return {
          id,
          name,
          created: m.created ? Number(m.created) * 1000 : undefined
        };
      }).filter((m) => m.id);
    }

    // Fallback if returned list was empty
    if (!rawModels.length) {
      rawModels = PRESET_MODELS[provider] || [];
    }

    // Sort Newest First (Created timestamp descending, or semantic version descending)
    const sorted = sortModelsNewestFirst(rawModels);

    // Save to cross-platform persistent cache with 7-Day [NEW] Badge calculation
    const cachedEntry = await saveProviderModelCache(provider, sorted);

    return {
      success: true,
      provider,
      models: cachedEntry.models,
      lastUpdated: cachedEntry.lastUpdated
    };
  } catch (err) {
    const cached = await getProviderModelCache(provider);
    return {
      success: false,
      message: `Failed to fetch live models: ${err.message}`,
      models: (cached && cached.models?.length) ? cached.models : (PRESET_MODELS[provider] || []),
      lastUpdated: cached?.lastUpdated || null
    };
  }
}

export async function testAiConnection(customCreds = null) {
  const creds = customCreds || (await getAiCredentials());
  const provider = creds.provider || AI_PROVIDERS.GEMINI;
  const apiKey = (creds.apiKey || '').trim();
  const model = creds.customModelId || creds.model || creds.customModel || 'gemini-4-hydrogen';

  if (!apiKey && provider !== AI_PROVIDERS.CUSTOM) {
    return {
      success: false,
      code: 'MISSING_API_KEY',
      message: `No API key provided for ${PROVIDER_METADATA[provider]?.name || provider}. Please paste your key.`
    };
  }

  try {
    // 1. Google Gemini
    if (provider === AI_PROVIDERS.GEMINI) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping. Reply with PONG.' }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        const code = res.status === 400 ? 'INVALID_API_KEY' : (res.status === 429 ? 'QUOTA_EXCEEDED' : 'API_ERROR');
        return {
          success: false,
          code,
          message: `Gemini API Error (${res.status}): ${errMsg}`
        };
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        success: true,
        provider: 'Google Gemini',
        model,
        reply: reply.trim(),
        message: `Successfully connected to Google Gemini (${model}).`
      };
    }

    // 2. Anthropic Claude
    if (provider === AI_PROVIDERS.ANTHROPIC) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping. Reply with PONG.' }]
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
        return {
          success: false,
          code: res.status === 401 ? 'INVALID_API_KEY' : 'API_ERROR',
          message: `Anthropic API Error (${res.status}): ${errMsg}`
        };
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text || '';
      return {
        success: true,
        provider: 'Anthropic Claude',
        model,
        reply: reply.trim(),
        message: `Successfully connected to Anthropic Claude (${model}).`
      };
    }

    // 3. OpenAI, DeepSeek, Groq, OpenRouter, xAI, Mistral, and Custom
    const endpoint = getProviderEndpoint(provider, creds.customEndpoint);
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    if (provider === AI_PROVIDERS.OPENROUTER) {
      headers['HTTP-Referer'] = 'https://zundeck.org';
      headers['X-Title'] = 'ZunDeck';
    }

    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping. Reply with PONG.' }],
        max_tokens: 10
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        success: false,
        code: res.status === 401 ? 'INVALID_API_KEY' : (res.status === 429 ? 'QUOTA_EXCEEDED' : 'API_ERROR'),
        message: `${PROVIDER_METADATA[provider]?.name || 'Endpoint'} returned HTTP ${res.status}: ${errText.slice(0, 120)}`
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    return {
      success: true,
      provider: PROVIDER_METADATA[provider]?.name || provider,
      model,
      reply: reply.trim(),
      message: `Successfully connected to ${PROVIDER_METADATA[provider]?.name || provider} (${model}).`
    };
  } catch (err) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      success: false,
      code: isOffline ? 'NETWORK_OFFLINE' : 'CONNECTION_FAILED',
      message: isOffline ? 'Internet connection is offline.' : `Connection failed: ${err.message}`
    };
  }
}

export async function callAiText(prompt, options = {}) {
  const creds = await getAiCredentials();
  const provider = options.provider || creds.provider || AI_PROVIDERS.GEMINI;
  const apiKey = (options.apiKey || creds.apiKey || '').trim();
  const model = options.customModelId || options.model || creds.customModelId || creds.model || 'gemini-4-hydrogen';
  const systemInstruction = options.systemInstruction || '';
  const temperature = options.temperature ?? creds.temperature ?? DEFAULT_AI_CONFIG.temperature;
  const maxTokens = options.maxTokens || 2048;

  if (!apiKey && provider !== AI_PROVIDERS.CUSTOM) {
    throw new Error('NO_API_KEY: Please configure your API key in BYOK Settings.');
  }

  // 1. Google Gemini
  if (provider === AI_PROVIDERS.GEMINI) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const bodyPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error?.message || `Gemini API Error HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // 2. Anthropic Claude
  if (provider === AI_PROVIDERS.ANTHROPIC) {
    const reqBody = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    };
    if (systemInstruction) reqBody.system = systemInstruction;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(reqBody)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error?.message || `Anthropic API Error HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  // 3. OpenAI, DeepSeek, Groq, OpenRouter, xAI, Mistral, and Custom
  const endpoint = getProviderEndpoint(provider, options.customEndpoint || creds.customEndpoint);
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (provider === AI_PROVIDERS.OPENROUTER) {
    headers['HTTP-Referer'] = 'https://zundeck.org';
    headers['X-Title'] = 'ZunDeck';
  }

  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${PROVIDER_METADATA[provider]?.name || 'AI'} API Error HTTP ${res.status}: ${errText.slice(0, 100)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function callAiMultimodal(prompt, mediaParts = [], options = {}) {
  const creds = await getAiCredentials();
  const provider = options.provider || creds.provider || AI_PROVIDERS.GEMINI;
  const apiKey = (options.apiKey || creds.apiKey || '').trim();
  const model = options.customModelId || options.model || creds.customModelId || creds.model || 'gemini-4-hydrogen';
  const systemInstruction = options.systemInstruction || '';
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens || 3000;

  if (!apiKey && provider !== AI_PROVIDERS.CUSTOM) {
    throw new Error('NO_API_KEY: Please configure your API key in BYOK Settings.');
  }

  // 1. Google Gemini Multimodal
  if (provider === AI_PROVIDERS.GEMINI) {
    const formattedParts = [];
    for (const part of mediaParts) {
      if (part.inlineData) {
        formattedParts.push({ inlineData: part.inlineData });
      } else if (part.base64 && part.mimeType) {
        const cleanData = part.base64.replace(/^data:[^;]+;base64,/, '');
        formattedParts.push({
          inlineData: {
            mimeType: part.mimeType,
            data: cleanData
          }
        });
      }
    }
    formattedParts.push({ text: prompt });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const bodyPayload = {
      contents: [{ parts: formattedParts }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error?.message || `Multimodal API Error HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // 2. OpenAI / OpenRouter / Groq Vision format
  const contentArray = [{ type: 'text', text: prompt }];
  for (const part of mediaParts) {
    const dataUrl = part.base64?.startsWith('data:')
      ? part.base64
      : `data:${part.mimeType || 'image/jpeg'};base64,${part.base64 || part.inlineData?.data || ''}`;
    contentArray.push({
      type: 'image_url',
      image_url: { url: dataUrl }
    });
  }

  const endpoint = getProviderEndpoint(provider, options.customEndpoint || creds.customEndpoint);
  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: contentArray });

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Vision API Error HTTP ${res.status}: ${errText.slice(0, 100)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export function parseJsonFromAiResponse(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return null;

  try {
    return JSON.parse(rawText.trim());
  } catch {
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        // Fall through
      }
    }

    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
      } catch {
        // Fall through
      }
    }
  }

  return null;
}

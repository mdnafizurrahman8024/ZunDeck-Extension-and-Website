import { loadPrivateVault, savePrivateVault } from '../storage/vault-storage.js';

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
    defaultModel: 'gemini-2.5-flash',
    keyPlaceholder: 'AIzaSy...',
    keyHelpUrl: 'https://aistudio.google.com',
    keyHelpText: 'Free API key from aistudio.google.com (zero credit card needed).'
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    id: AI_PROVIDERS.ANTHROPIC,
    name: 'Anthropic Claude (Claude 3.7 Sonnet, Claude 3.5)',
    badge: 'Frontier Reasoning',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-7-sonnet-20250219',
    keyPlaceholder: 'sk-ant-api...',
    keyHelpUrl: 'https://console.anthropic.com',
    keyHelpText: 'API key from console.anthropic.com.'
  },
  [AI_PROVIDERS.OPENAI]: {
    id: AI_PROVIDERS.OPENAI,
    name: 'OpenAI (GPT-4.5, GPT-4o, o3, o4-mini)',
    badge: 'Industry Standard',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    keyPlaceholder: 'sk-...',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyHelpText: 'API key from platform.openai.com/api-keys.'
  },
  [AI_PROVIDERS.DEEPSEEK]: {
    id: AI_PROVIDERS.DEEPSEEK,
    name: 'DeepSeek (DeepSeek-V3, DeepSeek-R1)',
    badge: 'High Reasoning • Low Cost',
    defaultEndpoint: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
    keyHelpUrl: 'https://platform.deepseek.com',
    keyHelpText: 'Ultra-cost-effective reasoning from platform.deepseek.com.'
  },
  [AI_PROVIDERS.GROQ]: {
    id: AI_PROVIDERS.GROQ,
    name: 'Groq (Ultra-Fast Llama 3.3 & Mixtral)',
    badge: 'Sub-Second Speed',
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    keyHelpUrl: 'https://console.groq.com/keys',
    keyHelpText: 'Ultra-fast inference (750+ T/s) from console.groq.com.'
  },
  [AI_PROVIDERS.OPENROUTER]: {
    id: AI_PROVIDERS.OPENROUTER,
    name: 'OpenRouter (Access 200+ Models with 1 Key)',
    badge: 'Universal Router',
    defaultEndpoint: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/auto',
    keyPlaceholder: 'sk-or-v1-...',
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyHelpText: 'One API key for 200+ models from openrouter.ai.'
  },
  [AI_PROVIDERS.XAI]: {
    id: AI_PROVIDERS.XAI,
    name: 'xAI (Grok-2 & Grok Beta)',
    badge: 'xAI Frontier',
    defaultEndpoint: 'https://api.x.ai/v1',
    defaultModel: 'grok-2-latest',
    keyPlaceholder: 'xai-...',
    keyHelpUrl: 'https://console.x.ai',
    keyHelpText: 'Grok models from console.x.ai.'
  },
  [AI_PROVIDERS.MISTRAL]: {
    id: AI_PROVIDERS.MISTRAL,
    name: 'Mistral AI (Mistral Large & Codestral)',
    badge: 'European Frontier',
    defaultEndpoint: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
    keyPlaceholder: '...',
    keyHelpUrl: 'https://console.mistral.ai',
    keyHelpText: 'European multilingual frontier models from console.mistral.ai.'
  },
  [AI_PROVIDERS.CUSTOM]: {
    id: AI_PROVIDERS.CUSTOM,
    name: 'Custom Endpoint (Ollama, LM Studio, LocalAI)',
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
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    keyHelpUrl: '',
    keyHelpText: 'Any endpoint implementing the OpenAI completions API.'
  }
};

export const PRESET_MODELS = {
  [AI_PROVIDERS.GEMINI]: [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Flagship Reasoning & Research)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ultra-Fast & Versatile — Recommended)' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite (High Quota & Lightweight)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fast & Multimodal Vision)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep 2M Token Context)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Reliable General Purpose)' }
  ],
  [AI_PROVIDERS.ANTHROPIC]: [
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet (Hybrid Reasoning & Coding — Recommended)' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (State-of-the-Art Artifacts)' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Lightning Fast)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Complex Writing & Nuance)' }
  ],
  [AI_PROVIDERS.OPENAI]: [
    { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview (Largest Frontier Model)' },
    { id: 'gpt-4o', name: 'GPT-4o (Omni Multimodal Flagship — Recommended)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Affordable)' },
    { id: 'o1', name: 'o1 (Deep Scientific & Logical Reasoning)' },
    { id: 'o3-mini', name: 'o3-mini (High-Speed STEM Reasoning)' },
    { id: 'o4-mini', name: 'o4-mini (Next-Gen Compact Reasoning)' }
  ],
  [AI_PROVIDERS.DEEPSEEK]: [
    { id: 'deepseek-chat', name: 'DeepSeek-V3 (State-of-the-Art Coding & Writing)' },
    { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Chain-of-Thought Math & Logic)' }
  ],
  [AI_PROVIDERS.GROQ]: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Ultra-Fast 750+ T/s)' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Instant Sub-100ms)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k Context Window)' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B' }
  ],
  [AI_PROVIDERS.OPENROUTER]: [
    { id: 'openrouter/auto', name: 'OpenRouter Auto (Best Routing for Task)' },
    { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet (via OpenRouter)' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (via OpenRouter)' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (via OpenRouter)' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (via OpenRouter)' }
  ],
  [AI_PROVIDERS.XAI]: [
    { id: 'grok-2-latest', name: 'Grok 2 Latest (xAI Frontier Model)' },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision (Multimodal)' },
    { id: 'grok-beta', name: 'Grok Beta' }
  ],
  [AI_PROVIDERS.MISTRAL]: [
    { id: 'mistral-large-latest', name: 'Mistral Large Latest (Flagship Multilingual)' },
    { id: 'mistral-small-latest', name: 'Mistral Small Latest (Fast & Efficient)' },
    { id: 'codestral-latest', name: 'Codestral Latest (Specialized Code Agent)' },
    { id: 'pixtral-large-latest', name: 'Pixtral Large Latest (Multimodal Vision)' }
  ],
  [AI_PROVIDERS.CUSTOM]: [
    { id: 'llama3', name: 'llama3 (Ollama / Local)' },
    { id: 'mistral', name: 'mistral (Ollama / Local)' },
    { id: 'qwen2.5-coder', name: 'qwen2.5-coder (Local Code Model)' },
    { id: 'deepseek-r1', name: 'deepseek-r1 (Local Reasoning Model)' }
  ],
  [AI_PROVIDERS.OPENAI_COMPATIBLE]: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Default)' },
    { id: 'gpt-4o', name: 'GPT-4o' }
  ]
};

export const GEMINI_MODELS = PRESET_MODELS[AI_PROVIDERS.GEMINI];

export const DEFAULT_AI_CONFIG = {
  provider: AI_PROVIDERS.GEMINI,
  apiKey: '',
  model: 'gemini-2.5-flash',
  customModelId: '',
  customEndpoint: 'https://api.openai.com/v1',
  customModel: 'gpt-4o-mini',
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

  if (newConfig.model !== undefined) vault.settings.ai.model = newConfig.model;
  if (newConfig.customModelId !== undefined) {
    vault.settings.ai.customModelId = newConfig.customModelId.trim();
  } else if (newConfig.model !== undefined) {
    vault.settings.ai.customModelId = '';
  }
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

export async function fetchLiveModels(customCreds = null) {
  const creds = customCreds || (await getAiCredentials());
  const provider = creds.provider || AI_PROVIDERS.GEMINI;
  const apiKey = (creds.apiKey || '').trim();

  // If local custom endpoint without API key, allow fetch attempt
  if (!apiKey && provider !== AI_PROVIDERS.CUSTOM) {
    return {
      success: false,
      message: 'API key is required to query live models.',
      models: PRESET_MODELS[provider] || []
    };
  }

  try {
    if (provider === AI_PROVIDERS.GEMINI) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google API returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const rawModels = Array.isArray(data.models) ? data.models : [];
      const filtered = rawModels
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent') || !m.supportedGenerationMethods)
        .map((m) => {
          const id = (m.name || '').replace(/^models\//, '');
          const displayName = m.displayName ? `${m.displayName} (${id})` : id;
          return { id, name: displayName };
        });

      return {
        success: true,
        provider,
        models: filtered.length ? filtered : PRESET_MODELS[provider]
      };
    }

    if (provider === AI_PROVIDERS.ANTHROPIC) {
      // Direct call to Anthropic models endpoint (if client permits)
      try {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          }
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data.data) ? data.data : [];
          if (items.length) {
            return {
              success: true,
              provider,
              models: items.map((m) => ({ id: m.id, name: m.display_name ? `${m.display_name} (${m.id})` : m.id }))
            };
          }
        }
      } catch {
        // Fall back to preset
      }
      return {
        success: true,
        provider,
        models: PRESET_MODELS[AI_PROVIDERS.ANTHROPIC]
      };
    }

    // OpenAI and OpenAI-compatible endpoints (/v1/models)
    const endpoint = getProviderEndpoint(provider, creds.customEndpoint);
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    if (provider === AI_PROVIDERS.OPENROUTER) {
      headers['HTTP-Referer'] = 'https://zundeck.org';
      headers['X-Title'] = 'ZunDeck';
    }

    const res = await fetch(`${endpoint}/models`, { method: 'GET', headers });
    if (!res.ok) {
      throw new Error(`Endpoint returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
    const models = rawList.map((m) => {
      const id = typeof m === 'string' ? m : (m.id || m.name || '');
      const name = m.name && m.name !== id ? `${m.name} (${id})` : id;
      return { id, name };
    }).filter((m) => m.id);

    return {
      success: true,
      provider,
      models: models.length ? models : (PRESET_MODELS[provider] || [])
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to fetch live models: ${err.message}`,
      models: PRESET_MODELS[provider] || []
    };
  }
}

export async function testAiConnection(customCreds = null) {
  const creds = customCreds || (await getAiCredentials());
  const provider = creds.provider || AI_PROVIDERS.GEMINI;
  const apiKey = (creds.apiKey || '').trim();
  const model = creds.customModelId || creds.model || creds.customModel || 'gemini-2.5-flash';

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
  const model = options.customModelId || options.model || creds.customModelId || creds.model || 'gemini-2.5-flash';
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
  const model = options.customModelId || options.model || creds.customModelId || creds.model || 'gemini-2.5-flash';
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

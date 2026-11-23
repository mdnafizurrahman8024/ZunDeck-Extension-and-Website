import { loadPrivateVault, savePrivateVault } from '../storage/vault-storage.js';

export const AI_PROVIDERS = {
  GEMINI: 'gemini',
  OPENAI_COMPATIBLE: 'openai_compatible'
};

export const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fastest & Multimodal — Recommended)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Reliable & High Quota)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Complex Reasoning & Deep Analysis)' }
];

export const DEFAULT_AI_CONFIG = {
  provider: AI_PROVIDERS.GEMINI,
  apiKey: '',
  model: 'gemini-2.0-flash',
  customEndpoint: 'https://api.openai.com/v1',
  customModel: 'gpt-4o-mini',
  temperature: 0.2
};

export async function getAiCredentials() {
  const vault = await loadPrivateVault();
  const keys = vault.keys || {};
  const settings = vault.settings?.ai || {};

  return {
    provider: settings.provider || AI_PROVIDERS.GEMINI,
    apiKey: settings.provider === AI_PROVIDERS.OPENAI_COMPATIBLE ? (keys.openai || '') : (keys.gemini || ''),
    model: settings.model || DEFAULT_AI_CONFIG.model,
    customEndpoint: settings.customEndpoint || DEFAULT_AI_CONFIG.customEndpoint,
    customModel: settings.customModel || DEFAULT_AI_CONFIG.customModel,
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
    if (provider === AI_PROVIDERS.OPENAI_COMPATIBLE) {
      vault.keys.openai = newConfig.apiKey.trim();
    } else {
      vault.keys.gemini = newConfig.apiKey.trim();
    }
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
  return Boolean(creds.apiKey && creds.apiKey.trim().length > 5);
}

export async function testAiConnection(customCreds = null) {
  const creds = customCreds || (await getAiCredentials());
  const apiKey = (creds.apiKey || '').trim();

  if (!apiKey) {
    return {
      success: false,
      code: 'MISSING_API_KEY',
      message: 'No API key provided. Please paste your Google Gemini API key or OpenAI key.'
    };
  }

  try {
    if (creds.provider === AI_PROVIDERS.OPENAI_COMPATIBLE) {
      const endpoint = (creds.customEndpoint || DEFAULT_AI_CONFIG.customEndpoint).replace(/\/+$/, '');
      const model = creds.customModel || DEFAULT_AI_CONFIG.customModel;

      const res = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Ping. Reply with PONG.' }],
          max_tokens: 10
        })
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        return {
          success: false,
          code: res.status === 401 ? 'INVALID_API_KEY' : (res.status === 429 ? 'QUOTA_EXCEEDED' : 'API_ERROR'),
          message: `Endpoint returned HTTP ${res.status}: ${errorText.slice(0, 100)}`
        };
      }

      return {
        success: true,
        provider: 'OpenAI Compatible',
        model,
        message: 'Successfully connected to OpenAI-compatible endpoint.'
      };
    }

    // Default: Google Gemini API
    const model = creds.model || DEFAULT_AI_CONFIG.model;
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
  const apiKey = (options.apiKey || creds.apiKey || '').trim();

  if (!apiKey) {
    throw new Error('NO_API_KEY: Please configure your API key in Vibe Settings.');
  }

  const systemInstruction = options.systemInstruction || '';
  const temperature = options.temperature ?? creds.temperature ?? DEFAULT_AI_CONFIG.temperature;

  if (creds.provider === AI_PROVIDERS.OPENAI_COMPATIBLE) {
    const endpoint = (creds.customEndpoint || DEFAULT_AI_CONFIG.customEndpoint).replace(/\/+$/, '');
    const model = creds.customModel || DEFAULT_AI_CONFIG.customModel;
    const messages = [];

    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: options.maxTokens || 2048
      })
    });

    if (!res.ok) {
      throw new Error(`OpenAI API Error HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Google Gemini API
  const model = options.model || creds.model || DEFAULT_AI_CONFIG.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const bodyPayload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: options.maxTokens || 2048
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

export async function callAiMultimodal(prompt, mediaParts = [], options = {}) {
  const creds = await getAiCredentials();
  const apiKey = (options.apiKey || creds.apiKey || '').trim();

  if (!apiKey) {
    throw new Error('NO_API_KEY: Please configure your Gemini API key in Settings for multimodal circular analysis.');
  }

  const model = options.model || creds.model || DEFAULT_AI_CONFIG.model;
  const systemInstruction = options.systemInstruction || '';
  const temperature = options.temperature ?? 0.2;

  // Format parts for Gemini API
  // mediaParts items can be: { mimeType: 'image/jpeg', base64: '...' } or { inlineData: { mimeType, data } }
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
      maxOutputTokens: options.maxTokens || 3000
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

export function parseJsonFromAiResponse(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Direct parse
  try {
    return JSON.parse(rawText.trim());
  } catch {
    // 2. Extract markdown code block: ```json ... ```
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch {
        // Fall through
      }
    }

    // 3. Extract outermost { ... } or [ ... ]
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

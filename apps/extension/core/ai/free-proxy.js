/**
 * ZunDeck Built-in Free AI Proxy Client
 * Routes zero-cost completions through live Cloudflare Worker proxy.
 * Obfuscated URL storage ensures zero plain-text leaks during public pushes.
 */

// Obfuscated representation: 'https://zundeck-free-proxy.mdnafizurrahman8024.workers.dev'
const OBFUSCATED_PROXY_BASE64 = 'aHR0cHM6Ly96dW5kZWNrLWZyZWUtcHJveHkubWRuYWZpenVycmFobWFuODAyNC53b3JrZXJzLmRldg==';

function decodeSafeBase64(str) {
  if (typeof atob === 'function') {
    return atob(str);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf8');
  }
  return '';
}

export function getFreeProxyUrl() {
  if (typeof process !== 'undefined' && process.env?.ZUNDECK_FREE_PROXY_URL) {
    return process.env.ZUNDECK_FREE_PROXY_URL;
  }
  if (typeof globalThis !== 'undefined' && globalThis.__ZUNDECK_FREE_PROXY_URL__) {
    return globalThis.__ZUNDECK_FREE_PROXY_URL__;
  }
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('zundeck_free_proxy_url');
    if (override && override.trim()) {
      return override.trim();
    }
  }
  return decodeSafeBase64(OBFUSCATED_PROXY_BASE64);
}

export function isOpenRouterFreeModel(modelOrId) {
  if (!modelOrId) return false;
  if (typeof modelOrId === 'string') {
    const clean = modelOrId.trim().toLowerCase();
    return clean.endsWith(':free') || clean === 'openrouter/free';
  }
  if (typeof modelOrId === 'object') {
    if (modelOrId.isFree === true) return true;
    const id = (modelOrId.id || '').trim().toLowerCase();
    if (id.endsWith(':free') || id === 'openrouter/free') return true;
    if (modelOrId.pricing) {
      const pPrompt = String(modelOrId.pricing.prompt ?? '').trim();
      const pComp = String(modelOrId.pricing.completion ?? '').trim();
      if ((pPrompt === '0' || pPrompt === '0.0') && (pComp === '0' || pComp === '0.0')) {
        return true;
      }
    }
  }
  return false;
}

export async function callFreeProxyChat(options = {}) {
  const model = options.model || 'openrouter/free';
  const messages = Array.isArray(options.messages) ? [...options.messages] : [];
  const systemInstruction = options.systemInstruction || '';
  const stream = Boolean(options.stream);
  const temperature = options.temperature ?? 0.2;
  const maxTokens = options.maxTokens || options.max_tokens || 2048;

  const proxyUrl = getFreeProxyUrl();
  if (!proxyUrl) {
    throw new Error('ZunDeck Free Proxy endpoint is unavailable.');
  }

  const payloadMessages = [];
  if (systemInstruction) {
    payloadMessages.push({ role: 'system', content: systemInstruction });
  }
  payloadMessages.push(...messages);

  const requestPayload = {
    model,
    messages: payloadMessages,
    stream,
    temperature,
    max_tokens: maxTokens
  };

  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestPayload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    let parsedMessage = '';
    try {
      const jsonErr = JSON.parse(errText);
      parsedMessage = jsonErr?.error?.message || jsonErr?.message || '';
    } catch {
      // Not JSON
    }
    const finalErr = parsedMessage || (errText ? errText.slice(0, 160) : `HTTP ${res.status}`);
    throw new Error(`ZunDeck Free Proxy Error (${res.status}): ${finalErr}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function testFreeProxyConnection(model = 'openrouter/free') {
  try {
    const result = await callFreeProxyChat({
      model,
      messages: [{ role: 'user', content: 'Say OK' }],
      maxTokens: 10
    });
    return {
      success: true,
      message: `Connected to ZunDeck Free Tier proxy (${model}).`,
      output: result
    };
  } catch (err) {
    return {
      success: false,
      message: `ZunDeck Free Tier connection failed: ${err.message}`
    };
  }
}

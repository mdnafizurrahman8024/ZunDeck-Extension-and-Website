/**
 * Unified Cross-Platform AI Model Cache & Sync Storage
 * Supports Browser Extension (chrome.storage.local) and Web Companion (localStorage)
 * Implements Stale-While-Revalidate with 6-Hour TTL and 7-Day [NEW] Badge Tracking
 */

export const MODEL_CACHE_KEY = 'zundeck_ai_models_cache';
export const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 Hours
export const NEW_BADGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

const memoryStore = new Map();

function isChromeExtension() {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function isLocalStorageAvailable() {
  return typeof localStorage !== 'undefined';
}

async function readStorage(key) {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve(res ? res[key] : null));
    });
  }
  if (isLocalStorageAvailable()) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
  return memoryStore.get(key) || null;
}

async function writeStorage(key, value) {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  memoryStore.set(key, value);
  return true;
}

export async function getAllCachedModelData() {
  const data = await readStorage(MODEL_CACHE_KEY);
  return data && typeof data === 'object' ? data : {};
}

export async function getProviderModelCache(provider) {
  const all = await getAllCachedModelData();
  return all[provider] || null;
}

export function isCacheStale(cacheEntry) {
  if (!cacheEntry || !cacheEntry.lastUpdated) return true;
  return (Date.now() - cacheEntry.lastUpdated) > CACHE_TTL_MS;
}

export async function saveProviderModelCache(provider, fetchedModels = []) {
  const all = await getAllCachedModelData();
  const existingEntry = all[provider] || { knownIds: {}, models: [] };
  const knownIds = { ...(existingEntry.knownIds || {}) };
  const now = Date.now();

  const processedModels = fetchedModels.map((m) => {
    const id = m.id;
    let firstSeen = knownIds[id];
    let isBrandNew = false;

    if (!firstSeen) {
      firstSeen = now;
      knownIds[id] = now;
      isBrandNew = true;
    }

    const isWithin7Days = (now - firstSeen) <= NEW_BADGE_TTL_MS;

    return {
      ...m,
      firstSeenAt: firstSeen,
      isNew: isBrandNew || isWithin7Days
    };
  });

  all[provider] = {
    provider,
    models: processedModels,
    lastUpdated: now,
    knownIds
  };

  await writeStorage(MODEL_CACHE_KEY, all);
  return all[provider];
}

export function formatLastSyncTimestamp(timestamp) {
  if (!timestamp) return 'Never synced';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

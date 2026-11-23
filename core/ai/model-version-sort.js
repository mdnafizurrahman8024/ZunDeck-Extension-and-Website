/**
 * Semantic Version & Timestamp Sorting Engine for AI Models
 * Ensures newest and highest-capability models always rank at the top of lists.
 */

export function extractModelVersionNumbers(modelId = '') {
  const clean = String(modelId || '').toLowerCase();

  // Match version patterns like:
  // "gpt-6.2", "4.20", "v4.1", "5-5", "3.8", "6-2"
  const versionMatch = clean.match(/(?:v|gpt-|gemini-|grok-|claude-)?(\d+)(?:[.\-_](\d+))?(?:[.\-_](\d+))?/);

  if (versionMatch) {
    const major = parseInt(versionMatch[1] || '0', 10);
    const minor = parseInt(versionMatch[2] || '0', 10);
    const patch = parseInt(versionMatch[3] || '0', 10);
    return [major, minor, patch];
  }

  return [0, 0, 0];
}

const TIER_WEIGHTS = {
  // Flagship / Ultra tiers
  sol: 100,
  hydrogen: 100,
  opus: 95,
  pro: 90,
  astra: 85,
  neon: 80,
  carbon: 75,
  sonnet: 70,
  large: 65,
  reasoning: 60,
  // Mid / Fast tiers
  terra: 50,
  flash: 45,
  haiku: 40,
  fast: 35,
  luna: 30,
  lite: 20,
  mini: 10
};

function getTierWeight(modelId = '') {
  const clean = String(modelId || '').toLowerCase();
  for (const [kw, weight] of Object.entries(TIER_WEIGHTS)) {
    if (clean.includes(kw)) return weight;
  }
  return 0;
}

export function compareModelsNewestFirst(a, b) {
  // 1. Created timestamp comparison (if both have valid numeric timestamps)
  const aCreated = a?.created ? Number(a.created) : 0;
  const bCreated = b?.created ? Number(b.created) : 0;

  if (aCreated > 0 && bCreated > 0 && aCreated !== bCreated) {
    return bCreated - aCreated;
  }

  // 2. Semantic version comparison
  const [aMaj, aMin, aPatch] = extractModelVersionNumbers(a?.id || a?.name);
  const [bMaj, bMin, bPatch] = extractModelVersionNumbers(b?.id || b?.name);

  if (aMaj !== bMaj) return bMaj - aMaj;
  if (aMin !== bMin) return bMin - aMin;
  if (aPatch !== bPatch) return bPatch - aPatch;

  // 3. Capability tier weighting
  const aTier = getTierWeight(a?.id);
  const bTier = getTierWeight(b?.id);
  if (aTier !== bTier) return bTier - aTier;

  // 4. Alphabetical fallback
  return String(a?.id || '').localeCompare(String(b?.id || ''));
}

export function sortModelsNewestFirst(models = []) {
  if (!Array.isArray(models)) return [];
  return [...models].sort(compareModelsNewestFirst);
}

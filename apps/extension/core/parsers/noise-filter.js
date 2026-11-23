import { stripDangerousMarkup } from '../security/sanitizer.js';

export const NOISE_PATTERNS = [
  /^(ad\b|sponsored|promoted|advertisement|adchoices)\b/i,
  /^ad\s*[•·-]/i,
  /^(people also viewed|more profiles for you|suggested for you|pages people also view|pages that match your search|similar researchers|explore more|you might like)\b/i,
  /^(connect\b|follow\b|message\b|send inmail|endorse\b|recommend\b|apply now|save job|dismiss|share|repost|like\b|comment\b|send\b)/i,
  /^(like\s*[•·-]\s*comment|connect with)/i,
  /^(show all \d+ (experiences|skills|licenses|publications|educations|honors))/i,
  /^(\.\.\.see more|see less|view full profile|show more results|\.\.\.)/i,
  /^(accept all cookies|cookie settings|manage cookies|manage privacy settings|we value your privacy|privacy policy|terms of service)\b/i,
  /^(sign in to view|join now to see|log in)\b/i
];

export const NOISY_SELECTORS = [
  '.ad-banner',
  '.adsbygoogle',
  'iframe[src*="ad"]',
  'iframe[src*="doubleclick"]',
  '.cookie-banner',
  '.consent-modal',
  '.artdeco-modal',
  '[data-ad-slot]',
  '[aria-label*="Advert"]',
  'header.global-nav',
  'footer.global-footer',
  '.people-also-viewed',
  '.pv-browsemap-section'
];

export function isNoiseLine(line = '') {
  if (!line || typeof line !== 'string') return true;
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return true;

  // Check noise patterns
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

export function stripHtmlTags(html = '') {
  if (!html || typeof html !== 'string') return '';
  const noMarkup = stripDangerousMarkup(html);
  return noMarkup
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

export function sanitizeWebText(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return '';
  
  // First strip dangerous HTML if any was passed
  const stripped = stripHtmlTags(rawText);

  // Normalize Unicode characters and bullets
  const normalized = stripped
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u25E6\u2043\u2219]/g, '•');

  return normalized.trim();
}

export function cleanTextLines(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return '';

  const sanitized = sanitizeWebText(rawText);
  const lines = sanitized.split(/\r?\n/);
  const cleanLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (isNoiseLine(trimmed)) continue;
    cleanLines.push(trimmed);
  }

  return cleanLines.join('\n');
}

export function hashContent(content = '') {
  if (!content) return '0';
  const str = String(content).toLowerCase().replace(/[^a-z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

export function filterElementNoise(container) {
  if (!container || !container.querySelectorAll) return;

  for (const sel of NOISY_SELECTORS) {
    try {
      const elements = container.querySelectorAll(sel);
      elements.forEach((el) => el.remove());
    } catch {
      // Ignore selector errors in older DOM implementations
    }
  }
}

export function deduplicateItems(existingItems = [], newItems = [], keyFn = null) {
  const getKey = keyFn || ((item) => {
    if (typeof item === 'string') return hashContent(item);
    if (!item) return '';
    return hashContent(`${item.title || ''}_${item.institution || item.company || ''}_${item.year || item.period || ''}`);
  });

  const seenKeys = new Set(existingItems.map(getKey));
  const uniqueNewItems = [];

  for (const item of newItems) {
    const key = getKey(item);
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueNewItems.push(item);
    }
  }

  return [...existingItems, ...uniqueNewItems];
}

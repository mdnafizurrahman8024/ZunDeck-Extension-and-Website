const MOTHER_BASE_URL = 'https://mdnafizurrahman8024.github.io/';

export function resolveMediaUrl(pathOrUrl, fallbackSvg = '') {
  if (!pathOrUrl) return fallbackSvg;
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  const clean = pathOrUrl.replace(/^\.?\//, '');
  return `${MOTHER_BASE_URL}${clean}`;
}

export const PLACEHOLDER_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="100%" height="100%" fill="%230d9488"/><circle cx="80" cy="60" r="32" fill="%23ffffff" opacity="0.9"/><path d="M30 140 C30 105 50 95 80 95 C110 95 130 105 130 140 Z" fill="%23ffffff" opacity="0.9"/></svg>';
export const PLACEHOLDER_BANNER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320" viewBox="0 0 1200 320"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23042f2e"/><stop offset="50%" stop-color="%230d9488"/><stop offset="100%" stop-color="%230369a1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/></svg>';

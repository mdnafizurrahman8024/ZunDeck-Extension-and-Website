export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (/^(?:https?:|\/|#|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

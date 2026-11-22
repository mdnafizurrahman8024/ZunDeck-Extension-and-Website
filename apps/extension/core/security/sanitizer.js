export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeUrl(url = '') {
  if (!url) return '';
  const trimmed = String(url).trim();

  // Block dangerous schemes
  if (/^(?:javascript|vbscript|data):/i.test(trimmed)) {
    // Only allow safe data:image/ images
    if (/^data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
      return trimmed;
    }
    return '#';
  }

  if (/^(?:https?:|\/|#|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  return '#';
}

export function stripDangerousMarkup(html = '') {
  if (typeof html !== 'string') return '';

  return html
    // Strip <script> tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip <iframe>, <object>, <embed>, <applet> tags
    .replace(/<\/?(?:iframe|object|embed|applet|meta|link|base)[^>]*>/gi, '')
    // Strip inline event handlers: onclick, onerror, onload, onmouseover, etc.
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Strip javascript: expressions inside attributes
    .replace(/(href|src|action)\s*=\s*["']?\s*javascript:[^"'>]*/gi, '$1="#"');
}

export function sanitizeValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return stripDangerousMarkup(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object') {
    const cleaned = {};
    for (const [k, v] of Object.entries(value)) {
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }
  return value;
}

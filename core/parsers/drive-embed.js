import { escapeHtml, sanitizeUrl } from '../security/index.js';

export const DOC_TYPES = [
  { id: 'presentation', label: 'Presentation Slides', icon: 'fa-solid fa-file-powerpoint', color: '#ea580c' },
  { id: 'word', label: 'Word Document', icon: 'fa-solid fa-file-word', color: '#2563eb' },
  { id: 'pdf', label: 'PDF', icon: 'fa-solid fa-file-pdf', color: '#dc2626' },
  { id: 'drive', label: 'Google Drive', icon: 'fa-brands fa-google-drive', color: '#059669' },
  { id: 'external', label: 'External Resource', icon: 'fa-solid fa-arrow-up-right-from-square', color: '#6366f1' }
];

export function isSafeDocumentUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return false;
  }
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('./');
}

export function parseDriveUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { service: null, id: null, embedUrl: null, openUrl: null, isSafe: false };
  }

  const trimmed = rawUrl.trim();
  if (!isSafeDocumentUrl(trimmed)) {
    return { service: null, id: null, embedUrl: null, openUrl: null, isSafe: false };
  }

  // 1. Google Presentation / Slides
  const slidesMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i);
  if (slidesMatch) {
    const id = slidesMatch[1];
    return {
      service: 'presentation',
      id,
      embedUrl: `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`,
      openUrl: `https://docs.google.com/presentation/d/${id}/edit`,
      isSafe: true
    };
  }

  // 2. Google Docs
  const docMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
  if (docMatch) {
    const id = docMatch[1];
    return {
      service: 'document',
      id,
      embedUrl: `https://docs.google.com/document/d/${id}/preview`,
      openUrl: `https://docs.google.com/document/d/${id}/edit`,
      isSafe: true
    };
  }

  // 3. Google Spreadsheets / Sheets
  const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
  if (sheetMatch) {
    const id = sheetMatch[1];
    return {
      service: 'spreadsheet',
      id,
      embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      openUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
      isSafe: true
    };
  }

  // 4. Google Drive Files (PDF, PPTX, DOCX, Images, etc.)
  // Matches /file/d/<ID>/... or open?id=<ID> or uc?id=<ID>
  let driveId = null;
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch) {
    driveId = driveFileMatch[1];
  } else {
    const driveQueryMatch = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
    if (driveQueryMatch) {
      driveId = driveQueryMatch[1];
    }
  }

  if (driveId) {
    return {
      service: 'drive',
      id: driveId,
      // Strictly convert drive.google.com/file/d/<ID> to /preview
      // Never misroute .pptx or other files to docs.google.com/presentation/...
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      openUrl: `https://drive.google.com/file/d/${driveId}/view`,
      isSafe: true
    };
  }

  // 5. Direct PDF or general web URL
  const sanitized = sanitizeUrl(trimmed);
  return {
    service: /\.pdf($|\?)/i.test(trimmed) ? 'direct-pdf' : 'external',
    id: null,
    embedUrl: sanitized,
    openUrl: sanitized,
    isSafe: true
  };
}

export function getDriveEmbedUrl(rawUrl) {
  const parsed = parseDriveUrl(rawUrl);
  return parsed.isSafe ? parsed.embedUrl : null;
}

export function getDriveOpenUrl(rawUrl) {
  const parsed = parseDriveUrl(rawUrl);
  return parsed.isSafe ? parsed.openUrl : null;
}

export function detectDocType(url = '', filename = '') {
  const lowerUrl = (url || '').toLowerCase();
  const lowerName = (filename || '').toLowerCase();

  if (lowerUrl.includes('docs.google.com/presentation') || lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt') || lowerUrl.includes('.pptx')) {
    return 'Presentation Slides';
  }
  if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || lowerUrl.includes('docs.google.com/document') || lowerUrl.includes('.docx')) {
    return 'Word Document';
  }
  if (lowerName.endsWith('.pdf') || lowerUrl.includes('.pdf')) {
    return 'PDF';
  }
  if (lowerUrl.includes('drive.google.com')) {
    return 'Google Drive';
  }
  return 'External Resource';
}

export function renderDrivePreviewModalHtml(doc = {}) {
  const title = escapeHtml(doc.title || 'Document Preview');
  const rawUrl = doc.url || '';
  const parsed = parseDriveUrl(rawUrl);
  const embedUrl = parsed.isSafe ? parsed.embedUrl : '';
  const openUrl = parsed.isSafe ? parsed.openUrl : '#';
  const docType = escapeHtml(doc.docType || detectDocType(rawUrl, doc.filename));

  return `
    <div class="drive-preview-modal-overlay" id="drive-preview-modal">
      <div class="drive-preview-window">
        <header class="drive-preview-header">
          <div class="drive-preview-title-col">
            <span class="drive-preview-badge">${docType}</span>
            <h3 class="drive-preview-title">${title}</h3>
          </div>
          <div class="drive-preview-actions">
            <a href="${sanitizeUrl(openUrl)}" target="_blank" rel="noopener noreferrer" class="btn-preview-external" title="Open in New Tab or Google Drive">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> Open in New Tab / Drive
            </a>
            <button type="button" class="btn-preview-close" id="btn-close-drive-preview" aria-label="Close Preview">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>
        <div class="drive-preview-body">
          ${embedUrl ? `
            <iframe src="${sanitizeUrl(embedUrl)}" class="drive-preview-iframe" title="${title}" allow="autoplay" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
          ` : `
            <div class="drive-preview-unavailable">
              <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; color: #ef4444; margin-bottom: 8px;"></i>
              <p>Preview is not available for this URL.</p>
              <a href="${sanitizeUrl(openUrl)}" target="_blank" rel="noopener" class="btn-primary" style="margin-top: 12px;">Open Resource Directly</a>
            </div>
          `}
        </div>
        <footer class="drive-preview-tip-footer">
          <i class="fa-solid fa-circle-info"></i>
          <span>Make sure Google Drive sharing is set to <strong>"Anyone with the link &rarr; Viewer"</strong> for the preview to load.</span>
        </footer>
      </div>
    </div>
  `;
}

import { escapeHtml, sanitizeUrl } from '../security/index.js';

export const BADGE_PRESETS = [
  { id: 'award', label: 'Award', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', icon: 'fa-solid fa-trophy' },
  { id: 'certification', label: 'Certification', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: 'fa-solid fa-award' },
  { id: 'volunteer', label: 'Volunteer', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', icon: 'fa-solid fa-hand-holding-heart' },
  { id: 'leadership', label: 'Leadership', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)', icon: 'fa-solid fa-user-tie' },
  { id: 'pi', label: 'Principal Investigator', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', icon: 'fa-solid fa-microscope' },
  { id: 'accepted', label: 'Accepted', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', icon: 'fa-solid fa-circle-check' },
  { id: 'manuscript-ready', label: 'Manuscript Ready', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: 'fa-solid fa-file-lines' },
  { id: 'open-source', label: 'Open Source', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', icon: 'fa-solid fa-code-branch' },
  { id: 'featured', label: 'Featured', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', icon: 'fa-solid fa-star' }
];

export function getBadgePresets() {
  return BADGE_PRESETS;
}

export function findBadgePreset(label) {
  if (!label || typeof label !== 'string') return null;
  const normalized = label.trim().toLowerCase();
  return BADGE_PRESETS.find((p) => p.label.toLowerCase() === normalized) || null;
}

export function renderBadgePill(label, customColor = null) {
  if (!label) return '';
  const preset = findBadgePreset(label);
  const color = customColor || (preset ? preset.color : '#0d9488');
  const bg = preset ? preset.bg : 'rgba(13, 148, 136, 0.12)';
  const icon = preset ? `<i class="${preset.icon}" style="margin-right: 4px;"></i>` : '';

  return `<span class="badge-pill" style="color: ${color}; background: ${bg}; border: 1px solid ${color}40; padding: 2px 8px; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; display: inline-flex; align-items: center;">${icon}${escapeHtml(label)}</span>`;
}

export function renderBadgePickerHtml(currentBadge = '', options = {}) {
  const inputId = options.inputId || 'badge-input';
  const customColorId = options.colorId || 'badge-color-input';
  const safeCurrent = escapeHtml(currentBadge);

  const presetsHtml = BADGE_PRESETS.map((preset) => {
    const isSelected = preset.label.toLowerCase() === (currentBadge || '').trim().toLowerCase();
    return `
      <button type="button" class="badge-preset-btn ${isSelected ? 'active' : ''}"
        data-badge-label="${escapeHtml(preset.label)}"
        data-badge-color="${preset.color}"
        style="--b-color: ${preset.color}; --b-bg: ${preset.bg};"
        title="Apply ${preset.label}">
        <i class="${preset.icon}"></i>
        <span>${escapeHtml(preset.label)}</span>
      </button>
    `;
  }).join('\n');

  return `
    <div class="badge-picker-widget">
      <div class="badge-presets-row">
        ${presetsHtml}
      </div>
      <div class="badge-custom-row">
        <input type="text" id="${inputId}" class="form-input badge-text-input" placeholder="Or type custom badge..." value="${safeCurrent}">
        <input type="color" id="${customColorId}" class="badge-color-picker" value="${options.customColor || '#0d9488'}" title="Choose badge color">
        ${currentBadge ? `<button type="button" class="btn-clear-badge" data-action="clear-badge" title="Clear badge">&times;</button>` : ''}
      </div>
    </div>
  `.trim();
}

export function createItemMetadata(overrides = {}) {
  return {
    id: overrides.id || `item-${Math.random().toString(36).slice(2, 9)}`,
    title: overrides.title || '',
    date: overrides.date || overrides.period || '',
    organization: overrides.organization || overrides.institution || overrides.venue || '',
    credentialId: overrides.credentialId || '',
    verificationUrl: sanitizeUrl(overrides.verificationUrl || overrides.url || ''),
    summary: overrides.summary || overrides.description || overrides.details || '',
    tags: Array.isArray(overrides.tags) ? overrides.tags : [],
    badge: overrides.badge || '',
    badgeColor: overrides.badgeColor || ''
  };
}

export function sanitizeItemMetadata(item) {
  if (!item || typeof item !== 'object') return {};
  return {
    ...item,
    title: escapeHtml(item.title || ''),
    date: escapeHtml(item.date || item.period || ''),
    organization: escapeHtml(item.organization || item.institution || item.venue || ''),
    credentialId: escapeHtml(item.credentialId || ''),
    verificationUrl: sanitizeUrl(item.verificationUrl || item.url || ''),
    summary: escapeHtml(item.summary || item.description || item.details || ''),
    tags: Array.isArray(item.tags) ? item.tags.map(escapeHtml) : [],
    badge: escapeHtml(item.badge || '')
  };
}

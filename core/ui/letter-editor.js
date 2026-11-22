import { LETTER_MODES, getLetterModeById, calculateLetterStats } from '../engines/letter-studio.js';

export const DRAFTS_STORAGE_KEY = 'zundeck_letter_drafts';

export function getWordCountProgress(wordCount, modeId = 'sop') {
  const mode = getLetterModeById(modeId);
  const { min, max, recommended } = mode.targetWordCount || { min: 500, max: 1000, recommended: 750 };

  const percentage = Math.min(100, Math.round((wordCount / max) * 100));

  let status = 'optimal';
  let color = '#0d9488'; // teal
  let label = `${wordCount} words (Target: ${recommended})`;

  if (wordCount < min) {
    status = 'under';
    color = '#f59e0b'; // amber
    label = `${wordCount} words (${min - wordCount} below recommended minimum)`;
  } else if (wordCount > max) {
    status = 'over';
    color = '#ef4444'; // red
    label = `${wordCount} words (${wordCount - max} over target limit)`;
  } else if (wordCount >= max - 50) {
    status = 'warning';
    color = '#eab308'; // yellow
    label = `${wordCount} words (Approaching limit)`;
  }

  return {
    wordCount,
    percentage,
    status,
    color,
    label,
    min,
    max,
    recommended
  };
}

export function loadDrafts() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const drafts = loadDrafts();
    const existingIndex = drafts.findIndex((d) => d.id === draft.id);
    const updatedDraft = {
      ...draft,
      lastModified: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = updatedDraft;
    } else {
      drafts.unshift(updatedDraft);
    }

    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    return true;
  } catch {
    return false;
  }
}

export function deleteDraft(draftId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const drafts = loadDrafts().filter((d) => d.id !== draftId);
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    return true;
  } catch {
    return false;
  }
}

export function createNewDraft(modeId = 'sop', title = '', targetDetails = {}) {
  const mode = getLetterModeById(modeId);
  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    modeId,
    title: title || `${mode.name} — Draft ${new Date().toLocaleDateString()}`,
    targetDetails: {
      institution: targetDetails.institution || '',
      program: targetDetails.program || '',
      professor: targetDetails.professor || '',
      focusArea: targetDetails.focusArea || ''
    },
    personalNotes: '',
    subject: '',
    content: '',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
}

export function getParagraphAiPrompt(paragraphText, actionType = 'polish') {
  const actions = {
    polish: 'Polish this paragraph for academic clarity, active voice, and precision without inflating claims or changing facts.',
    shorten: 'Shorten this paragraph by 25-35%, cutting filler phrases while preserving all concrete technical details and metrics.',
    formalize: 'Make this paragraph more formal and authoritative, suitable for an elite fellowship or faculty committee review.',
    strengthen_evidence: 'Refocus this paragraph around empirical evidence, methodological keywords, and scientific contributions.'
  };

  const instruction = actions[actionType] || actions.polish;

  return `System Rule: Zero fabrication. Preserve all real achievements, names, and metrics.
Action: ${instruction}

Paragraph:
"${paragraphText}"`;
}

export { calculateLetterStats };

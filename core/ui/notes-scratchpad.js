export const NOTE_CATEGORIES = [
  { id: 'all', label: 'All Notes', icon: 'fa-layer-group' },
  { id: 'Research', label: 'Research', icon: 'fa-microscope', color: '#0ea5e9' },
  { id: 'Project', label: 'Project', icon: 'fa-code-branch', color: '#10b981' },
  { id: 'CV Idea', label: 'CV Idea', icon: 'fa-file-lines', color: '#8b5cf6' },
  { id: 'Design', label: 'Design', icon: 'fa-palette', color: '#f59e0b' },
  { id: 'SOP', label: 'SOP & Story', icon: 'fa-pen-nib', color: '#0d9488' }
];

export function createNote(noteData = {}) {
  const now = new Date().toISOString();
  return {
    id: noteData.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: noteData.title || 'Untitled Note',
    content: noteData.content || '',
    tag: noteData.tag || 'Research',
    pinned: Boolean(noteData.pinned),
    createdAt: noteData.createdAt || now,
    updatedAt: now
  };
}

export function updateNote(notes = [], id, updates = {}) {
  return notes.map((note) => {
    if (note.id !== id) return note;
    return {
      ...note,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  });
}

export function deleteNote(notes = [], id) {
  return notes.filter((note) => note.id !== id);
}

export function togglePinNote(notes = [], id) {
  return notes.map((note) => {
    if (note.id !== id) return note;
    return {
      ...note,
      pinned: !note.pinned,
      updatedAt: new Date().toISOString()
    };
  });
}

export function filterAndSortNotes(notes = [], { query = '', tag = 'all' } = {}) {
  const q = String(query).trim().toLowerCase();

  const filtered = notes.filter((n) => {
    const matchesTag = tag === 'all' || n.tag === tag;
    const matchesQuery = !q ||
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tag.toLowerCase().includes(q);
    return matchesTag && matchesQuery;
  });

  return filtered.sort((a, b) => {
    // Pinned notes always come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Otherwise sorted by most recently updated
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

export function formatNoteDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

export function sendNoteToTarget(note, targetType = 'sop') {
  if (!note) return null;
  const snippet = `[Idea from Note: ${note.title} (${note.tag})]\n${note.content}`;

  return {
    targetType,
    noteId: note.id,
    title: note.title,
    tag: note.tag,
    text: snippet
  };
}

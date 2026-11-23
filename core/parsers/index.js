export function parseJsonSafe(raw, fallback = null) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function parseBibtexToPublication(rawBibtex) {
  const titleMatch = rawBibtex.match(/title\s*=\s*[{"]([^}"]+)[}"]/i);
  const authorMatch = rawBibtex.match(/author\s*=\s*[{"]([^}"]+)[}"]/i);
  const yearMatch = rawBibtex.match(/year\s*=\s*[{"]?(\d{4})[}"]?/i);
  const journalMatch = rawBibtex.match(/journal\s*=\s*[{"]([^}"]+)[}"]/i);
  const doiMatch = rawBibtex.match(/doi\s*=\s*[{"]([^}"]+)[}"]/i);

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Untitled Manuscript',
    authors: authorMatch ? authorMatch[1].trim() : '',
    year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
    journal: journalMatch ? journalMatch[1].trim() : '',
    doi: doiMatch ? doiMatch[1].trim() : '',
    status: 'published'
  };
}

export * from './doi-orcid-fetcher.js';
export * from './drive-embed.js';

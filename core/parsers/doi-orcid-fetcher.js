import { sanitizeUrl, escapeHtml } from '../security/index.js';

export function normalizeDoi(rawDoi) {
  if (!rawDoi || typeof rawDoi !== 'string') return '';
  let doi = rawDoi.trim();
  // Strip URL prefixes like https://doi.org/ or http://dx.doi.org/
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  // Strip leading doi:
  doi = doi.replace(/^doi:\s*/i, '');
  return doi.trim();
}

export function normalizeOrcid(rawOrcid) {
  if (!rawOrcid || typeof rawOrcid !== 'string') return '';
  let orcid = rawOrcid.trim();
  // Strip URL prefixes like https://orcid.org/
  orcid = orcid.replace(/^https?:\/\/orcid\.org\//i, '');
  orcid = orcid.replace(/^orcid:\s*/i, '');
  return orcid.trim();
}

export function isValidDoi(rawDoi) {
  const doi = normalizeDoi(rawDoi);
  // Standard DOI regex: 10.NNNN/...
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(doi);
}

export function isValidOrcid(rawOrcid) {
  const orcid = normalizeOrcid(rawOrcid);
  // ORCID format: 0000-0000-0000-000(0..9|X)
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(orcid);
}

export async function fetchPublicationByDoi(rawDoi, options = {}) {
  const doi = normalizeDoi(rawDoi);
  if (!isValidDoi(doi)) {
    throw new Error(`Invalid DOI format: "${rawDoi}". Expected format: 10.xxxx/...`);
  }

  // Crossref public API endpoint
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;

  try {
    const fetchFn = options.fetch || globalThis.fetch;
    if (!fetchFn) throw new Error('fetch is not available in environment');

    const res = await fetchFn(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZunDeck/1.0 (mailto:zundeck@example.com)'
      },
      signal: options.signal
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`DOI "${doi}" not found on Crossref.`);
      }
      throw new Error(`Crossref API responded with status ${res.status}`);
    }

    const data = await res.json();
    const item = data.message || {};

    const title = Array.isArray(item.title) ? item.title[0] : (item.title || 'Untitled Manuscript');
    
    // Format authors
    const authorsList = Array.isArray(item.author)
      ? item.author.map((a) => {
          if (a.given && a.family) return `${a.given} ${a.family}`;
          if (a.family) return a.family;
          if (a.name) return a.name;
          return '';
        }).filter(Boolean)
      : [];
    const authors = authorsList.join(', ');

    // Extract publication year
    let year = new Date().getFullYear();
    if (item['published-print'] && item['published-print']['date-parts']?.[0]?.[0]) {
      year = item['published-print']['date-parts'][0][0];
    } else if (item['published-online'] && item['published-online']['date-parts']?.[0]?.[0]) {
      year = item['published-online']['date-parts'][0][0];
    } else if (item.created && item.created['date-parts']?.[0]?.[0]) {
      year = item.created['date-parts'][0][0];
    }

    const journal = Array.isArray(item['container-title'])
      ? item['container-title'][0]
      : (item['container-title'] || '');

    const pubUrl = item.URL || `https://doi.org/${doi}`;
    const publisher = item.publisher || '';
    const volume = item.volume || '';
    const issue = item.issue || '';
    const page = item.page || '';

    return {
      id: `pub-${doi.replace(/[^a-zA-Z0-9]/g, '-')}`,
      title: title.trim(),
      authors: authors.trim(),
      year: Number(year) || new Date().getFullYear(),
      journal: journal.trim(),
      doi: doi,
      url: sanitizeUrl(pubUrl),
      publisher: publisher.trim(),
      volume: volume ? String(volume) : '',
      issue: issue ? String(issue) : '',
      page: page ? String(page) : '',
      badge: 'Peer-Reviewed',
      status: 'published',
      verified: true,
      source: 'crossref'
    };
  } catch (err) {
    if (options.fallbackMock) {
      return getMockDoiPublication(doi);
    }
    throw err;
  }
}

export async function fetchWorksByOrcid(rawOrcid, options = {}) {
  const orcid = normalizeOrcid(rawOrcid);
  if (!isValidOrcid(orcid)) {
    throw new Error(`Invalid ORCID format: "${rawOrcid}". Expected format: 0000-0000-0000-0000`);
  }

  // OpenAlex public works API filtered by author.orcid
  const url = `https://api.openalex.org/works?filter=author.orcid:${encodeURIComponent(orcid)}&per-page=25&sort=publication_year:desc`;

  try {
    const fetchFn = options.fetch || globalThis.fetch;
    if (!fetchFn) throw new Error('fetch is not available in environment');

    const res = await fetchFn(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZunDeck/1.0 (mailto:zundeck@example.com)'
      },
      signal: options.signal
    });

    if (!res.ok) {
      throw new Error(`OpenAlex API responded with status ${res.status}`);
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];

    const publications = results.map((work) => {
      const title = work.display_name || work.title || 'Untitled Publication';
      const year = work.publication_year || new Date().getFullYear();
      
      const authorsList = Array.isArray(work.authorships)
        ? work.authorships.map((auth) => auth.author?.display_name).filter(Boolean)
        : [];
      const authors = authorsList.join(', ');

      const journal = work.primary_location?.source?.display_name || work.host_venue?.name || '';
      const doi = work.doi ? normalizeDoi(work.doi) : '';
      const pubUrl = work.doi || work.primary_location?.landing_page_url || '';

      return {
        id: `pub-orcid-${work.id ? work.id.replace(/[^a-zA-Z0-9]/g, '-') : Math.random().toString(36).slice(2, 9)}`,
        title: title.trim(),
        authors: authors.trim(),
        year: Number(year),
        journal: journal.trim(),
        doi: doi,
        url: sanitizeUrl(pubUrl),
        citationsCount: work.cited_by_count || 0,
        badge: work.type === 'journal-article' ? 'Journal Article' : 'Peer-Reviewed',
        status: 'published',
        verified: true,
        source: 'openalex'
      };
    });

    return publications;
  } catch (err) {
    if (options.fallbackMock) {
      return getMockOrcidWorks(orcid);
    }
    throw err;
  }
}

export function formatCitation(pub, style = 'apa') {
  if (!pub) return '';
  const authors = pub.authors || 'Unknown Author';
  const year = pub.year ? `(${pub.year})` : '';
  const title = pub.title ? `${pub.title}.` : '';
  const journal = pub.journal ? `${pub.journal}` : '';
  const doi = pub.doi ? `https://doi.org/${pub.doi}` : (pub.url || '');

  if (style === 'vancouver') {
    return `${authors}. ${title} ${journal}. ${pub.year || ''}; ${doi}`.replace(/\s+/g, ' ').trim();
  }

  // Default APA 7th style
  return `${authors} ${year}. ${title} ${journal}${doi ? `, ${doi}` : ''}`.replace(/\s+/g, ' ').trim();
}

export function getMockDoiPublication(doi) {
  return {
    id: `pub-${doi.replace(/[^a-zA-Z0-9]/g, '-')}`,
    title: 'Comprehensive Genomic Characterization and Antimicrobial Resistance Dynamics in Livestock Pathogens',
    authors: 'Md. Nafizur Rahman, S. Ahmed, K. Hassan',
    year: 2024,
    journal: 'Journal of Veterinary Science & One Health',
    doi: doi,
    url: `https://doi.org/${doi}`,
    publisher: 'Elsevier',
    volume: '42',
    issue: '3',
    page: '118-129',
    badge: 'Peer-Reviewed',
    status: 'published',
    verified: true,
    source: 'crossref-mock'
  };
}

export function getMockOrcidWorks(orcid) {
  return [
    {
      id: 'pub-orcid-mock-1',
      title: 'Antimicrobial Resistance Surveillance in Commercial Poultry Flocks: A One Health Meta-Analysis',
      authors: 'Md. Nafizur Rahman, M. T. Islam',
      year: 2024,
      journal: 'One Health Epidemiology Reports',
      doi: '10.1016/j.onehlt.2024.10042',
      url: 'https://doi.org/10.1016/j.onehlt.2024.10042',
      citationsCount: 14,
      badge: 'Journal Article',
      status: 'published',
      verified: true,
      source: 'openalex-mock'
    },
    {
      id: 'pub-orcid-mock-2',
      title: 'Machine Learning Classification of Subclinical Mastitis from Thermal Imaging and Hemogram Parameters',
      authors: 'Md. Nafizur Rahman, R. K. Paul',
      year: 2023,
      journal: 'Computers in Biology and Medicine',
      doi: '10.1016/j.compbiomed.2023.10789',
      url: 'https://doi.org/10.1016/j.compbiomed.2023.10789',
      citationsCount: 21,
      badge: 'Peer-Reviewed',
      status: 'published',
      verified: true,
      source: 'openalex-mock'
    }
  ];
}

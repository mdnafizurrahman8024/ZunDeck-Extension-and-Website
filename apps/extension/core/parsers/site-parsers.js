import { sanitizeWebText, cleanTextLines, isNoiseLine } from './noise-filter.js';
import { sanitizeUrl } from '../security/sanitizer.js';

export function detectSiteType(url = '') {
  if (!url || typeof url !== 'string') return 'general';
  const lower = url.toLowerCase();
  if (lower.includes('linkedin.com')) return 'linkedin';
  if (lower.includes('scholar.google.com')) return 'scholar';
  if (lower.includes('orcid.org')) return 'orcid';
  if (lower.includes('researchgate.net')) return 'researchgate';
  if (lower.includes('github.com')) return 'github';
  return 'general';
}

export function parseLinkedInProfile(textOrHtml = '') {
  const clean = cleanTextLines(textOrHtml);
  const lines = clean.split('\n');

  const result = {
    identity: { fullName: '', roleBadge: '', location: '', bioParagraphs: [] },
    education: [],
    experience: [],
    skills: [],
    publications: []
  };

  let currentSection = 'header';
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect section transitions
    const lower = line.toLowerCase();
    if (lower === 'about' || lower === 'summary') {
      currentSection = 'about';
      continue;
    } else if (lower === 'experience' || lower === 'work experience') {
      currentSection = 'experience';
      continue;
    } else if (lower === 'education') {
      currentSection = 'education';
      continue;
    } else if (lower === 'skills' || lower === 'skills & endorsements') {
      currentSection = 'skills';
      continue;
    } else if (lower === 'publications' || lower === 'honors & awards') {
      currentSection = 'publications';
      continue;
    }

    if (currentSection === 'header') {
      if (!result.identity.fullName && line.length < 50 && !line.includes('•')) {
        result.identity.fullName = line;
      } else if (!result.identity.roleBadge && result.identity.fullName) {
        result.identity.roleBadge = line;
      } else if (!result.identity.location && line.length < 60) {
        result.identity.location = line;
      }
    } else if (currentSection === 'about') {
      result.identity.bioParagraphs.push(line);
    } else if (currentSection === 'skills') {
      if (line.length < 40 && !isNoiseLine(line)) {
        result.skills.push(line.replace(/^[•\-\*]\s*/, ''));
      }
    } else if (currentSection === 'experience') {
      buffer.push(line);
      if (buffer.length >= 3) {
        result.experience.push({
          role: buffer[0] || 'Role',
          company: buffer[1] || 'Company',
          period: buffer[2] || '',
          summary: buffer.slice(3).join(' ')
        });
        buffer = [];
      }
    } else if (currentSection === 'education') {
      buffer.push(line);
      if (buffer.length >= 3) {
        result.education.push({
          institution: buffer[0] || 'University',
          degree: buffer[1] || 'Degree',
          period: buffer[2] || ''
        });
        buffer = [];
      }
    }
  }

  return result;
}

export function parseScholarProfile(textOrHtml = '') {
  const clean = cleanTextLines(textOrHtml);
  const lines = clean.split('\n');

  const result = {
    identity: { fullName: '', institution: '', metrics: [] },
    publications: []
  };

  let inMetrics = false;
  let inPubs = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (!result.identity.fullName && i === 0) {
      result.identity.fullName = line;
      continue;
    }
    if (!result.identity.institution && i === 1) {
      result.identity.institution = line;
      continue;
    }

    const lower = line.toLowerCase();
    if (lower.includes('citations') && lower.includes('h-index')) {
      inMetrics = true;
      continue;
    }
    if (lower === 'title' || lower.includes('cited by') || lower === 'year') {
      inPubs = true;
      inMetrics = false;
      continue;
    }

    if (inPubs && line.length > 5) {
      const yearMatch = line.match(/\b(19\d\d|20\d\d)\b/);
      result.publications.push({
        title: line.replace(/\b(19\d\d|20\d\d)\b/, '').trim(),
        year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
        status: 'published'
      });
    }
  }

  return result;
}

export function parseOrcidProfile(textOrHtml = '') {
  const clean = cleanTextLines(textOrHtml);
  const lines = clean.split('\n');

  const result = {
    identity: { fullName: '', orcid: '', bioParagraphs: [] },
    education: [],
    experience: [],
    publications: []
  };

  const orcidMatch = clean.match(/\b000[0-9]-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9Xx]\b/);
  if (orcidMatch) {
    result.identity.orcid = orcidMatch[0];
  }

  for (const line of lines) {
    if (!result.identity.fullName && line.length < 40 && !line.includes(':')) {
      result.identity.fullName = line;
    } else if (line.toLowerCase().includes('doi.org')) {
      const doiMatch = line.match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/);
      result.publications.push({
        title: line.split('http')[0].trim() || 'Orcid Work',
        doi: doiMatch ? doiMatch[0] : '',
        status: 'published'
      });
    }
  }

  return result;
}

export function parseGitHubProfile(textOrHtml = '') {
  const clean = cleanTextLines(textOrHtml);
  const lines = clean.split('\n');

  const result = {
    identity: { fullName: '', login: '', tagline: '', bioParagraphs: [] },
    projects: []
  };

  if (lines[0]) result.identity.fullName = lines[0];
  if (lines[1]) result.identity.login = lines[1];
  if (lines[2]) result.identity.tagline = lines[2];

  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('Pinned') || line.includes('Popular repositories')) continue;
    if (line.length > 4 && line.length < 50 && !line.includes(' ')) {
      result.projects.push({
        title: line,
        category: 'Open Source',
        badge: 'GitHub'
      });
    }
  }

  return result;
}

export function parseGeneralWebpage(textOrHtml = '') {
  const clean = cleanTextLines(textOrHtml);
  const lines = clean.split('\n');

  const emailMatch = clean.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const phoneMatch = clean.match(/(\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})/);

  return {
    identity: {
      fullName: lines[0] || 'Web Profile',
      tagline: lines[1] || '',
      email: emailMatch ? emailMatch[1] : '',
      phone: phoneMatch ? phoneMatch[1] : '',
      bioParagraphs: lines.slice(2, 6)
    },
    rawSnippets: lines
  };
}

export function parseWebpageProfile(siteType = 'general', textOrHtml = '') {
  switch (siteType) {
    case 'linkedin':
      return parseLinkedInProfile(textOrHtml);
    case 'scholar':
      return parseScholarProfile(textOrHtml);
    case 'orcid':
      return parseOrcidProfile(textOrHtml);
    case 'github':
      return parseGitHubProfile(textOrHtml);
    default:
      return parseGeneralWebpage(textOrHtml);
  }
}

import { cleanTextLines, isNoiseLine } from './noise-filter.js';
import { sanitizeUrl } from '../security/sanitizer.js';

export function parseCvTextToProfile(rawText = '') {
  if (!rawText || typeof rawText !== 'string') {
    return null;
  }

  const clean = cleanTextLines(rawText);
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  const candidate = {
    schemaVersion: 'ZunProfileV1',
    identity: {
      fullName: '',
      shortName: '',
      roleBadge: '',
      tagline: '',
      email: '',
      phone: '',
      location: { city: '', country: '', rawAddress: '' },
      bioParagraphs: []
    },
    links: {
      scholar: '',
      orcid: '',
      researchgate: '',
      github: '',
      linkedin: '',
      personalWebsite: '',
      custom: []
    },
    education: [],
    research: [],
    projects: [],
    publications: [],
    certifications: [],
    skills: {
      technical: { title: 'Technical & Domain Skills', icon: 'fa-laptop-code', skills: [] }
    },
    awards: []
  };

  // 1. Extract contact details via regex
  const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) candidate.identity.email = emailMatch[0];

  const phoneMatch = rawText.match(/(\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);
  if (phoneMatch) candidate.identity.phone = phoneMatch[0].trim();

  const linkedinMatch = rawText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i);
  if (linkedinMatch) candidate.links.linkedin = linkedinMatch[0];

  const githubMatch = rawText.match(/https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+/i);
  if (githubMatch) candidate.links.github = githubMatch[0];

  const orcidMatch = rawText.match(/https?:\/\/orcid\.org\/\b000[0-9]-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9Xx]\b/i) ||
                     rawText.match(/\b000[0-9]-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9Xx]\b/);
  if (orcidMatch) candidate.links.orcid = orcidMatch[0].startsWith('http') ? orcidMatch[0] : `https://orcid.org/${orcidMatch[0]}`;

  const scholarMatch = rawText.match(/https?:\/\/scholar\.google\.com\/citations\?[^\s]+/i);
  if (scholarMatch) candidate.links.scholar = scholarMatch[0];

  // 2. Scan lines for sections
  let section = 'header';
  let buffer = [];

  const sectionKeywords = {
    education: /^(education|academic background|academic qualifications|degrees)(\s*[:\-]|\s*$)/i,
    research: /^(research\s*(&|and)?\s*experience|research appointments|research projects|research activities|investigations|research)(\s*[:\-]|\s*$)/i,
    experience: /^(experience\s*(&|and)?\s*research|work experience|professional experience|employment history|experience)(\s*[:\-]|\s*$)/i,
    publications: /^(publications|selected publications|peer-reviewed articles|papers|manuscripts)(\s*[:\-]|\s*$)/i,
    certifications: /^(certifications|licenses|professional certifications|training|courses)(\s*[:\-]|\s*$)/i,
    skills: /^(skills|technical skills|competencies|expertise|proficiencies)(\s*[:\-]|\s*$)/i,
    awards: /^(honors|awards|scholarships|achievements|distinctions)(\s*[:\-]|\s*$)/i,
    bio: /^(about(\s+me)?|summary|professional summary|biography|profile)(\s*[:\-]|\s*$)/i
  };

  const flushBuffer = (sec) => {
    if (!buffer.length) return;

    if (sec === 'education') {
      const yearMatch = buffer.join(' ').match(/\b(19\d\d|20\d\d)(\s*[-–—]\s*(Present|\d{4}))?/i);
      candidate.education.push({
        id: `edu-cv-${candidate.education.length + 1}`,
        degree: buffer[0] || 'Degree',
        institution: buffer[1] || 'Institution',
        period: yearMatch ? yearMatch[0] : '',
        details: buffer.slice(2).join(' ')
      });
    } else if (sec === 'research' || sec === 'experience') {
      const yearMatch = buffer.join(' ').match(/\b(19\d\d|20\d\d)(\s*[-–—]\s*(Present|\d{4}))?/i);
      const targetList = sec === 'research' ? candidate.research : candidate.projects;
      targetList.push({
        id: `${sec}-cv-${targetList.length + 1}`,
        title: buffer[0] || 'Position / Project',
        role: buffer[0] || 'Role',
        institution: buffer[1] || 'Organization',
        period: yearMatch ? yearMatch[0] : '',
        summary: buffer.slice(2).join(' ')
      });
    } else if (sec === 'publications') {
      const yearMatch = buffer.join(' ').match(/\b(19\d\d|20\d\d)\b/);
      const doiMatch = buffer.join(' ').match(/10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/);
      candidate.publications.push({
        id: `pub-cv-${candidate.publications.length + 1}`,
        title: buffer[0] || 'Publication Title',
        authors: buffer[1] || '',
        year: yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear(),
        doi: doiMatch ? doiMatch[0] : '',
        status: 'published'
      });
    } else if (sec === 'certifications') {
      candidate.certifications.push({
        id: `cert-cv-${candidate.certifications.length + 1}`,
        title: buffer[0] || 'Certification',
        issuer: buffer[1] || 'Issuing Authority',
        date: buffer[2] || ''
      });
    } else if (sec === 'bio') {
      candidate.identity.bioParagraphs.push(buffer.join(' '));
    }
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for section headers
    let matchedSec = null;
    for (const [secKey, regex] of Object.entries(sectionKeywords)) {
      if (regex.test(line) && line.length < 40) {
        matchedSec = secKey;
        break;
      }
    }

    if (matchedSec) {
      flushBuffer(section);
      section = matchedSec;
      continue;
    }

    if (section === 'header') {
      if (!candidate.identity.fullName && line.length < 50 && !line.includes('@')) {
        candidate.identity.fullName = line;
        candidate.identity.shortName = line.split(' ')[0] || line;
      } else if (!candidate.identity.roleBadge && candidate.identity.fullName && !line.includes('@') && !line.includes('http')) {
        candidate.identity.roleBadge = line;
      } else if (!candidate.identity.tagline && candidate.identity.roleBadge && !line.includes('@')) {
        candidate.identity.tagline = line;
      }
    } else if (section === 'skills') {
      const skillsArray = line.split(/[,•|;]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 45);
      skillsArray.forEach((sk) => {
        if (!candidate.skills.technical.skills.some((x) => x.name.toLowerCase() === sk.toLowerCase())) {
          candidate.skills.technical.skills.push({ name: sk });
        }
      });
    } else {
      buffer.push(line);
      // Group items by line count or blank boundaries
      if (buffer.length >= 4) {
        flushBuffer(section);
      }
    }
  }

  flushBuffer(section);

  // Link identity.links alias to root links for compatibility
  candidate.identity.links = candidate.links;

  return candidate;
}

export async function parseCvFile(file) {
  if (!file) return null;

  // In browser, read as text
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        try {
          const profile = parseCvTextToProfile(text);
          resolve(profile);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  return null;
}

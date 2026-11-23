import { callAiText, callAiMultimodal, parseJsonFromAiResponse, isAiConfigured } from './byok-client.js';
import { sanitizeValue } from '../security/sanitizer.js';

export const CIRCULAR_INPUT_MODES = [
  { id: 'live_tab', label: 'Live Web Tab Scan', icon: 'fa-solid fa-globe', desc: 'Scan active job or PhD listing page' },
  { id: 'screen_snip', label: 'Paste Screenshot (Ctrl+V)', icon: 'fa-solid fa-camera', desc: 'Paste clipboard image or snip' },
  { id: 'photo_upload', label: 'Photo / Image Upload', icon: 'fa-solid fa-image', desc: 'Upload JPG/PNG photo of printed notice' },
  { id: 'doc_upload', label: 'PDF / Word Circular', icon: 'fa-solid fa-file-pdf', desc: 'Upload .pdf or .docx circular' },
  { id: 'manual_text', label: 'Paste Circular Text', icon: 'fa-solid fa-clipboard', desc: 'Paste raw requirement text' }
];

export function computeOfflineMatch(profile = {}, opportunityText = '') {
  const text = (opportunityText || '').toLowerCase();
  if (!text) {
    return {
      matchScore: 0,
      matchedStrengths: [],
      missingKeywords: [],
      opportunityMeta: { roleTitle: 'Target Opportunity', institution: 'Target Institution' }
    };
  }

  // Extract comprehensive candidate skills, research, publications, and education
  const candidateSkillWords = [];
  if (profile.skills && typeof profile.skills === 'object') {
    Object.values(profile.skills).forEach((cat) => {
      if (Array.isArray(cat?.skills)) {
        cat.skills.forEach((s) => {
          if (typeof s === 'string') candidateSkillWords.push(s.toLowerCase());
          else if (s && typeof s === 'object') {
            if (s.name) candidateSkillWords.push(s.name.toLowerCase());
            if (s.desc) candidateSkillWords.push(s.desc.toLowerCase());
          }
        });
      } else if (Array.isArray(cat)) {
        cat.forEach((s) => {
          if (typeof s === 'string') candidateSkillWords.push(s.toLowerCase());
          else if (s?.name) candidateSkillWords.push(s.name.toLowerCase());
        });
      }
    });
  }

  const researchText = (profile.research || []).flatMap((r) => [
    r.title || '',
    r.category || '',
    r.summary || '',
    ...(Array.isArray(r.tags) ? r.tags : [])
  ]).join(' ').toLowerCase();

  const publicationsText = (profile.publications || []).flatMap((p) => [
    p.title || '',
    p.journal || '',
    p.category || '',
    ...(Array.isArray(p.tags) ? p.tags : [])
  ]).join(' ').toLowerCase();

  const educationText = (profile.education || []).flatMap((e) => [
    e.degree || '',
    e.field || '',
    e.institution || ''
  ]).join(' ').toLowerCase();

  const identityText = [
    profile.identity?.roleBadge || '',
    profile.identity?.tagline || '',
    ...(Array.isArray(profile.identity?.statusPills) ? profile.identity.statusPills : [])
  ].join(' ').toLowerCase();

  const allCandidateCorpus = [
    ...candidateSkillWords,
    researchText,
    publicationsText,
    educationText,
    identityText,
    JSON.stringify(profile.projects || ''),
    JSON.stringify(profile.certifications || '')
  ].join(' ').toLowerCase();

  const matchedStrengths = [];
  const missingKeywords = [];

  // Structured keyword catalog with boundary and synonym detection
  const checkPool = [
    { kw: 'python', label: 'Python', re: /\bpython\b/i },
    { kw: 'r', label: 'R Programming', re: /\b(r|rstudio)\b/i, candRe: /\b(r|rstudio|rtutor)\b/i },
    { kw: 'machine learning', label: 'Machine Learning', re: /machine learning/i },
    { kw: 'deep learning', label: 'Deep Learning', re: /deep learning/i },
    { kw: 'bioinformatics', label: 'Bioinformatics', re: /bioinformatics/i },
    { kw: 'data analysis', label: 'Data Analysis', re: /data analy[st]/i, candRe: /data analy/i },
    { kw: 'genomics', label: 'Genomics', re: /genomic/i },
    { kw: 'molecular biology', label: 'Molecular Biology', re: /molecular/i },
    { kw: 'epidemiology', label: 'Epidemiology', re: /epidemiolog/i },
    { kw: 'pathology', label: 'Pathology', re: /patholog/i },
    { kw: 'virology', label: 'Virology', re: /virolog/i },
    { kw: 'clinical research', label: 'Clinical Research', re: /clinical/i },
    { kw: 'sql', label: 'SQL', re: /\bsql\b/i },
    { kw: 'nextflow', label: 'Nextflow', re: /nextflow/i },
    { kw: 'blast', label: 'BLAST', re: /\bblast\b/i },
    { kw: 'docker', label: 'Docker', re: /docker/i },
    { kw: 'statistics', label: 'Statistics', re: /statistic/i },
    { kw: 'project management', label: 'Project Management', re: /project management/i },
    { kw: 'scientific writing', label: 'Scientific Writing', re: /scientific writing|manuscript/i },
    { kw: 'dvm', label: 'Veterinary / DVM', re: /\b(dvm|veterinary)\b/i },
    { kw: 'bachelor', label: 'Bachelor / Undergraduate', re: /\bbachelor\b/i, candRe: /\b(bachelor|undergraduate|dvm)\b/i },
    { kw: 'master', label: "Master's Degree", re: /\bmaster\b/i },
    { kw: 'phd', label: 'PhD Degree', re: /\bphd\b/i },
    { kw: 'postdoctoral', label: 'Postdoctoral', re: /postdoc/i },
    { kw: 'fellowship', label: 'Fellowship', re: /fellowship/i }
  ];

  let potentialMatches = 0;
  let actualMatches = 0;

  for (const item of checkPool) {
    if (item.re.test(text)) {
      potentialMatches++;
      const candRegex = item.candRe || item.re;
      const hasSkill = candRegex.test(allCandidateCorpus);

      if (hasSkill) {
        actualMatches++;
        matchedStrengths.push(item.label);
      } else {
        missingKeywords.push(item.label);
      }
    }
  }

  // Detect institution / title
  const titleMatch = opportunityText.match(/(?:position|role|opening|call for|job title|scholarship for)[:\s]+([^\n.,;]+)/i);
  const instMatch = opportunityText.match(/(?:university|institute|laboratory|organization|college|company)[:\s]+([^\n.,;]+)/i);

  let score = 70;
  if (potentialMatches > 0) {
    const matchRatio = actualMatches / potentialMatches;
    score = Math.min(98, Math.max(30, Math.round(35 + (matchRatio * 50) + (actualMatches >= 2 ? 15 : 0))));
  }

  return {
    matchScore: score,
    matchedStrengths: matchedStrengths.slice(0, 8),
    missingKeywords: missingKeywords.slice(0, 8),
    opportunityMeta: {
      roleTitle: titleMatch ? titleMatch[1].trim() : 'Research / Professional Candidate',
      institution: instMatch ? instMatch[1].trim() : 'Target University / Institution',
      requiredSkills: [...matchedStrengths, ...missingKeywords].slice(0, 10)
    }
  };
}

export async function matchOpportunity(profile, inputData = {}) {
  const { mode, text, mediaPart } = inputData;
  const configured = await isAiConfigured();

  // If unconfigured or offline text mode, use deterministic heuristic
  if (!configured && !mediaPart) {
    return computeOfflineMatch(profile, text || '');
  }

  const profileSummary = {
    name: profile.identity?.fullName || 'Candidate',
    badge: profile.identity?.roleBadge || '',
    education: (profile.education || []).map((e) => `${e.degree} from ${e.institution}`),
    research: (profile.research || []).map((r) => r.title),
    publications: (profile.publications || []).map((p) => p.title),
    skills: (profile.skills?.technical?.skills || []).map((s) => (typeof s === 'string' ? s : s.name))
  };

  const systemInstruction = `You are a Universal Job, PhD & Scholarship ATS Matcher.
Analyze candidate profile fit against an opportunity circular (text or image/photo/screenshot).
Respond ONLY with a JSON object:
{
  "matchScore": number (0-100),
  "roleTitle": "Clean extracted opportunity role title",
  "institution": "Clean extracted university, lab, or company name",
  "deadline": "Extracted application deadline or 'Not specified'",
  "matchedStrengths": ["Strength 1", "Strength 2", ...],
  "missingKeywords": ["Missing skill/requirement 1", "Missing skill/requirement 2", ...],
  "recommendations": "2 concise sentences advising how candidate can position themselves"
}`;

  try {
    let rawAiResponse = '';

    if (mediaPart) {
      // Multimodal vision call for images, screenshots, circular photos
      const prompt = `Match this opportunity circular against candidate profile:\n${JSON.stringify(profileSummary, null, 2)}`;
      rawAiResponse = await callAiMultimodal(prompt, [mediaPart], { systemInstruction });
    } else {
      // Text call
      const prompt = `Target Opportunity Circular:\n${text}\n\nCandidate Profile:\n${JSON.stringify(profileSummary, null, 2)}`;
      rawAiResponse = await callAiText(prompt, { systemInstruction });
    }

    const parsed = parseJsonFromAiResponse(rawAiResponse);
    if (parsed && typeof parsed.matchScore === 'number') {
      return {
        matchScore: Math.max(0, Math.min(100, Math.round(parsed.matchScore))),
        matchedStrengths: Array.isArray(parsed.matchedStrengths) ? parsed.matchedStrengths : [],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        recommendations: parsed.recommendations || '',
        opportunityMeta: {
          roleTitle: parsed.roleTitle || 'Target Opportunity',
          institution: parsed.institution || 'Target Institution',
          deadline: parsed.deadline || 'Not specified'
        }
      };
    }
  } catch (err) {
    // Fall back to offline computation if API call fails
  }

  return computeOfflineMatch(profile, text || '');
}

export function createTailoredCvProfileFromMatch(profile, matchResult = {}) {
  const cloned = JSON.parse(JSON.stringify(profile || {}));
  cloned.cvProfiles = Array.isArray(cloned.cvProfiles) ? cloned.cvProfiles : [];

  const meta = matchResult.opportunityMeta || {};
  const strengths = Array.isArray(matchResult.matchedStrengths) ? matchResult.matchedStrengths : [];
  const roleTitle = meta.roleTitle || 'Targeted Opportunity';

  const tailoredId = `cv-tailored-${Date.now()}`;
  const tailoredProfile = {
    id: tailoredId,
    name: `${roleTitle} (${meta.institution || 'Targeted'})`,
    targetRole: roleTitle,
    templateId: 'cv-acad-flagship',
    highlightedKeywords: strengths,
    includedSections: ['education', 'research', 'publications', 'skills', 'certifications'],
    createdAt: new Date().toISOString()
  };

  cloned.cvProfiles.unshift(tailoredProfile);
  return {
    updatedProfile: cloned,
    createdCvProfile: tailoredProfile
  };
}

export function createTargetedLetterDraftFromMatch(profile, matchResult = {}, mode = 'sop') {
  const meta = matchResult.opportunityMeta || {};
  const strengths = Array.isArray(matchResult.matchedStrengths) ? matchResult.matchedStrengths.join(', ') : '';
  const gaps = Array.isArray(matchResult.missingKeywords) ? matchResult.missingKeywords.join(', ') : '';

  const institution = meta.institution || 'Target University';
  const program = meta.roleTitle || 'Graduate Program';

  const draftScaffold = {
    id: `draft-matched-${Date.now()}`,
    mode: ['sop', 'motivation', 'cover', 'email'].includes(mode) ? mode : 'sop',
    targetInstitution: institution,
    targetProgram: program,
    targetProfessor: meta.professor || 'Admissions Committee / Principal Investigator',
    targetFocus: strengths ? `Aligned core strengths: ${strengths}` : 'Research alignment and methodological fit',
    targetNotes: gaps ? `Bridge qualifications and enthusiasm for: ${gaps}` : '',
    subject: `Application for ${program} — ${profile.identity?.fullName || 'Candidate'}`,
    createdAt: new Date().toISOString()
  };

  return draftScaffold;
}

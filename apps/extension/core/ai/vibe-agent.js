import { sanitizeCss, sanitizeValue } from '../security/sanitizer.js';
import { scanForSecrets } from '../security/secret-scanner.js';
import { createCheckpoint, calculateDiffSummary } from '../storage/checkpoint-timeline.js';
import { callAiText, parseJsonFromAiResponse, isAiConfigured } from './byok-client.js';

export const VIBE_TOOLS = [
  {
    name: 'patch_profile_data',
    description: 'Apply schema-validated content edits to identity, education, research, publications, projects, certifications, skills, location coordinates, or custom sections.',
    parameters: {
      type: 'object',
      properties: {
        identity: { type: 'object', description: 'Updated identity fields (fullName, roleBadge, tagline, bioParagraphs, location, contacts)' },
        addPublications: { type: 'array', description: 'New publications to append' },
        removePublicationIds: { type: 'array', items: { type: 'string' }, description: 'IDs of publications to delete' },
        addEducation: { type: 'array', description: 'New education items to append' },
        addResearch: { type: 'array', description: 'New research appointments to append' },
        addProjects: { type: 'array', description: 'New project cards to append' },
        addCertifications: { type: 'array', description: 'New certifications to append' },
        addSkills: { type: 'array', items: { type: 'string' }, description: 'Skills to add' },
        addCustomSections: { type: 'array', description: 'Custom sections to append (title, layout, items)' },
        mapCoordinates: {
          type: 'object',
          properties: {
            latitude: { type: 'number' },
            longitude: { type: 'number' },
            locationName: { type: 'string' }
          }
        },
        reorderSection: { type: 'string', description: 'Section name to reorder (e.g. publications, research, projects)' },
        orderIds: { type: 'array', items: { type: 'string' }, description: 'New ID sequence' }
      }
    }
  },
  {
    name: 'update_theme_and_layout',
    description: 'Update safe CSS theme tokens, colors, fonts, templates, columns, lighting glow, perimeter gradient, ticker/marquee motion, or scoped safe custom CSS.',
    parameters: {
      type: 'object',
      properties: {
        portfolioTemplateId: { type: 'string', description: 'Target template ID (e.g. acad-flagship, tech-minimalist, corp-executive)' },
        cvTemplateId: { type: 'string', description: 'Target CV template ID (e.g. cv-acad-flagship, cv-acad-europass, cv-tech-minimalist)' },
        theme: { type: 'string', enum: ['dark', 'light', 'slate', 'solarized', 'contrast'] },
        accentColor: { type: 'string', description: 'Hex or CSS color string (e.g. #0d9488, #10b981, #3b82f6, #f59e0b)' },
        fontFamily: { type: 'string', description: 'Font pairing (Inter, Plus Jakarta Sans, Merriweather, JetBrains Mono)' },
        gridColumns: { type: 'number', description: 'Card grid columns (1, 2, 3, or 4)' },
        seeAllLimit: { type: 'number', description: 'Initial items visible before See All (e.g. 3, 5, 8)' },
        glowLevel: { type: 'string', enum: ['radiant', 'subtle', 'none'], description: 'Card lighting ambient glow' },
        perimeterGradient: { type: 'string', enum: ['active', 'subtle', 'off'], description: 'Perimeter shifting gradient border' },
        tickerSpeed: { type: 'string', enum: ['slow', 'normal', 'fast', 'paused'], description: 'Auto-scrolling news ticker animation' },
        gallerySpeed: { type: 'string', enum: ['slow', 'normal', 'fast', 'paused'], description: 'Photo marquee speed' },
        showMap: { type: 'boolean', description: 'Whether to display the interactive fieldwork map' },
        showFloatingCvPill: { type: 'boolean', description: 'Whether to display floating CV PDF download pill' },
        scopedCss: { type: 'string', description: 'Safe CSS rules without @import or javascript:' }
      }
    }
  },
  {
    name: 'tailor_cv_profile',
    description: 'Create or update a targeted CV profile with specific section visibility toggles and role focus.',
    parameters: {
      type: 'object',
      properties: {
        profileId: { type: 'string', description: 'ID for targeted CV profile' },
        profileName: { type: 'string', description: 'Display name for targeted CV profile' },
        targetRole: { type: 'string', description: 'Target opportunity or job title' },
        includedSections: { type: 'array', items: { type: 'string' }, description: 'Visible section IDs' },
        templateId: { type: 'string', description: 'CV template ID' }
      },
      required: ['profileName']
    }
  },
  {
    name: 'draft_or_refine_letter',
    description: 'Draft or polish an SOP, Motivation Letter, Cover Letter, or Cold Email adhering strictly to real user profile facts.',
    parameters: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['sop', 'motivation', 'cover', 'email'], description: 'Letter document type' },
        targetInstitution: { type: 'string', description: 'University or Company name' },
        targetProgram: { type: 'string', description: 'Program title or job role' },
        targetProfessor: { type: 'string', description: 'Professor, lab PI, or hiring manager' },
        subject: { type: 'string', description: 'Letter / email subject line' },
        body: { type: 'string', description: 'Refined or newly drafted letter body' }
      },
      required: ['mode', 'body']
    }
  }
];

export function buildCandidateProfileSummary(activeProfile = {}) {
  const identity = activeProfile.identity || {};
  const education = Array.isArray(activeProfile.education) ? activeProfile.education : [];
  const research = Array.isArray(activeProfile.research) ? activeProfile.research : [];
  const publications = Array.isArray(activeProfile.publications) ? activeProfile.publications : [];
  const projects = Array.isArray(activeProfile.projects) ? activeProfile.projects : [];
  const skills = activeProfile.skills || {};
  const displayConfig = activeProfile.displayConfig || {};

  const eduList = education.map((e) => {
    const degree = e.degree || e.title || '';
    const inst = e.institution || e.school || '';
    const field = e.fieldOfStudy || e.field || '';
    const year = e.year || e.period || '';
    return `- ${degree} in ${field} at ${inst} (${year})`.trim();
  }).join('\n');

  const pubList = publications.slice(0, 10).map((p) => {
    const title = p.title || '';
    const journal = p.journal || p.venue || '';
    const year = p.year || '';
    return `- "${title}" (${journal}, ${year})`.trim();
  }).join('\n');

  const expList = research.slice(0, 5).map((r) => {
    const role = r.role || r.title || '';
    const inst = r.institution || r.organization || '';
    const period = r.period || '';
    return `- ${role} at ${inst} (${period})`.trim();
  }).join('\n');

  const techSkills = (skills.technical?.skills || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean).join(', ');
  const domainSkills = (skills.domain?.skills || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean).join(', ');

  return `Candidate Workspace Profile Context:
- Full Name: ${identity.fullName || 'Md. Nafizur Rahman'}
- Title / Role: ${identity.roleBadge || identity.tagline || 'Doctor of Veterinary Medicine (DVM) | Pathogen Surveillance'}
- Bio: ${(identity.bioParagraphs || []).join(' ') || identity.bio || ''}
- Location: ${identity.location || 'Rajshahi, Bangladesh'}
- Education Records:
${eduList || '- Doctor of Veterinary Medicine (DVM), University of Rajshahi'}
- Research & Appointments:
${expList || '- Researcher in Pathogen Genomics & AMR Surveillance'}
- Verified Publications (${publications.length} total):
${pubList || '- Multiple peer-reviewed articles'}
- Technical Skills: ${techSkills || 'Python, Nextflow, BLAST+, R, Linux, Biopython'}
- Domain Expertise: ${domainSkills || 'Antimicrobial Resistance, Pathogen Surveillance, Veterinary Medicine'}
- Active Portfolio Template: ${displayConfig.portfolioTemplateId || 'acad-flagship'}
- Active Theme: ${displayConfig.theme || 'dark'}
- Active Accent Color: ${displayConfig.accentColor || '#0d9488'}
- Grid Columns: ${displayConfig.gridColumns || 2}
- Font Pairing: ${displayConfig.fontFamily || 'Plus Jakarta Sans'}`;
}

const SYSTEM_PROMPT = `You are ZunDeck Vibe Agent, an intelligent and safe AI partner for academic portfolios, ATS CVs, and SOP letters.
You communicate naturally, thoughtfully, and fluently in English or Bengali depending on the user's language.

You have access to the user's authentic workspace profile context.

TWO DISTINCT INTERACTION MODES:
1. CONVERSATIONAL Q&A / BRAINSTORMING / ADVICE:
   When the user asks a question, makes an inquiry (e.g. about their education, credentials, research, background, advice on portfolio design, general questions, greetings, or feedback):
   - Answer their question directly, thoroughly, and factually based on their profile data or domain knowledge.
   - Do NOT apply any fake theme patches, fake changes, or edit tools.
   - Return valid JSON:
     {
       "mode": "conversational",
       "explanation": "Your direct, helpful, and natural answer here in English or Bengali."
     }

2. EXPLICIT EDIT / VIBE CODING COMMANDS:
   Only when the user explicitly requests an edit, customization, theme change, layout tweak, content addition/removal, CV tailoring, or document draft:
   - Use one of the 4 permitted structured tools:
     - patch_profile_data(jsonPatch)
     - update_theme_and_layout(configPatch)
     - tailor_cv_profile(profilePatch)
     - draft_or_refine_letter(letterPatch)
   - Return valid JSON:
     {
       "mode": "edit",
       "explanation": "Short 1-2 sentence description of the exact modifications applied",
       "tool": "patch_profile_data" | "update_theme_and_layout" | "tailor_cv_profile" | "draft_or_refine_letter",
       "arguments": { ... }
     }

CRITICAL RULES:
- Never fabricate achievements, fake citations, fake degrees, or false metrics.
- Answer user questions accurately using the provided profile snapshot.
- Return ONLY valid JSON block with zero markdown fences or filler preamble.
`;

export function applyVibeTool(activeProfile, toolName, args = {}) {
  const cloned = JSON.parse(JSON.stringify(activeProfile || {}));

  if (toolName === 'patch_profile_data') {
    // 1. Identity patch
    if (args.identity && typeof args.identity === 'object') {
      cloned.identity = cloned.identity || {};
      for (const [k, v] of Object.entries(args.identity)) {
        if (v !== undefined && v !== null && k !== 'secretKeys') {
          cloned.identity[k] = sanitizeValue(v);
        }
      }
    }

    // 2. Add collections
    const appendItems = (key, items) => {
      if (Array.isArray(items) && items.length) {
        cloned[key] = Array.isArray(cloned[key]) ? cloned[key] : [];
        items.forEach((item, idx) => {
          const sanitized = sanitizeValue(item);
          if (typeof sanitized === 'object' && !sanitized.id) {
            sanitized.id = `${key}-${Date.now()}-${idx}`;
          }
          cloned[key].push(sanitized);
        });
      }
    };

    appendItems('publications', args.addPublications);
    appendItems('education', args.addEducation);
    appendItems('research', args.addResearch);
    appendItems('projects', args.addProjects);
    appendItems('certifications', args.addCertifications);

    // 3. Remove publications if specified
    if (Array.isArray(args.removePublicationIds) && Array.isArray(cloned.publications)) {
      cloned.publications = cloned.publications.filter((p) => !args.removePublicationIds.includes(p.id));
    }

    // 4. Add skills
    if (Array.isArray(args.addSkills) && args.addSkills.length) {
      cloned.skills = cloned.skills || {};
      cloned.skills.technical = cloned.skills.technical || { title: 'Technical Skills', skills: [] };
      args.addSkills.forEach((sk) => {
        const name = typeof sk === 'string' ? sk.trim() : (sk?.name || '').trim();
        if (name && !cloned.skills.technical.skills.some((s) => (s.name || s).toLowerCase() === name.toLowerCase())) {
          cloned.skills.technical.skills.push({ name });
        }
      });
    }

    // 5. Add Custom Sections
    if (Array.isArray(args.addCustomSections) && args.addCustomSections.length) {
      cloned.customSections = Array.isArray(cloned.customSections) ? cloned.customSections : [];
      args.addCustomSections.forEach((sec, idx) => {
        const sanitized = sanitizeValue(sec);
        if (typeof sanitized === 'object') {
          sanitized.id = sanitized.id || `custom-sec-${Date.now()}-${idx}`;
          cloned.customSections.push(sanitized);
        }
      });
    }

    // 6. Map coordinates
    if (args.mapCoordinates && typeof args.mapCoordinates === 'object') {
      cloned.locationMap = cloned.locationMap || {};
      if (typeof args.mapCoordinates.latitude === 'number') cloned.locationMap.latitude = args.mapCoordinates.latitude;
      if (typeof args.mapCoordinates.longitude === 'number') cloned.locationMap.longitude = args.mapCoordinates.longitude;
      if (args.mapCoordinates.locationName) cloned.locationMap.locationName = sanitizeValue(args.mapCoordinates.locationName);
      cloned.locationMap.enabled = true;
    }

    // 7. Reorder items
    if (args.reorderSection && Array.isArray(args.orderIds) && Array.isArray(cloned[args.reorderSection])) {
      const section = cloned[args.reorderSection];
      const reordered = [];
      args.orderIds.forEach((id) => {
        const found = section.find((x) => x.id === id);
        if (found) reordered.push(found);
      });
      section.forEach((x) => {
        if (!reordered.includes(x)) reordered.push(x);
      });
      cloned[args.reorderSection] = reordered;
    }

    return cloned;
  }

  if (toolName === 'update_theme_and_layout') {
    cloned.displayConfig = cloned.displayConfig || {};

    if (args.portfolioTemplateId) cloned.displayConfig.portfolioTemplateId = sanitizeValue(args.portfolioTemplateId);
    if (args.cvTemplateId) cloned.displayConfig.cvTemplateId = sanitizeValue(args.cvTemplateId);
    if (args.theme) cloned.displayConfig.theme = sanitizeValue(args.theme);
    if (args.accentColor) cloned.displayConfig.accentColor = sanitizeValue(args.accentColor);
    if (args.fontFamily) cloned.displayConfig.fontFamily = sanitizeValue(args.fontFamily);
    if (args.gridColumns && Number.isInteger(args.gridColumns)) {
      cloned.displayConfig.gridColumns = Math.max(1, Math.min(4, args.gridColumns));
    }
    if (args.seeAllLimit && Number.isInteger(args.seeAllLimit)) {
      cloned.displayConfig.seeAllLimit = Math.max(1, Math.min(20, args.seeAllLimit));
    }
    if (args.glowLevel) cloned.displayConfig.glowLevel = sanitizeValue(args.glowLevel);
    if (args.perimeterGradient) cloned.displayConfig.perimeterGradient = sanitizeValue(args.perimeterGradient);
    if (args.tickerSpeed) cloned.displayConfig.tickerSpeed = sanitizeValue(args.tickerSpeed);
    if (args.gallerySpeed) cloned.displayConfig.gallerySpeed = sanitizeValue(args.gallerySpeed);
    if (typeof args.showMap === 'boolean') cloned.displayConfig.showMap = args.showMap;
    if (typeof args.showFloatingCvPill === 'boolean') cloned.displayConfig.showFloatingCvPill = args.showFloatingCvPill;
    if (args.mapCoordinates && typeof args.mapCoordinates === 'object') {
      cloned.locationMap = cloned.locationMap || {};
      if (typeof args.mapCoordinates.latitude === 'number') cloned.locationMap.latitude = args.mapCoordinates.latitude;
      if (typeof args.mapCoordinates.longitude === 'number') cloned.locationMap.longitude = args.mapCoordinates.longitude;
      if (args.mapCoordinates.locationName) cloned.locationMap.locationName = sanitizeValue(args.mapCoordinates.locationName);
    }
    if (args.scopedCss) {
      cloned.displayConfig.customCss = sanitizeCss(args.scopedCss);
    }

    return cloned;
  }

  if (toolName === 'tailor_cv_profile') {
    cloned.cvProfiles = Array.isArray(cloned.cvProfiles) ? cloned.cvProfiles : [];
    const profId = args.profileId || `cv-prof-${Date.now()}`;
    const existingIdx = cloned.cvProfiles.findIndex((p) => p.id === profId);

    const cvProf = {
      id: profId,
      name: sanitizeValue(args.profileName || 'Tailored Profile'),
      targetRole: sanitizeValue(args.targetRole || ''),
      templateId: sanitizeValue(args.templateId || 'cv-acad-flagship'),
      includedSections: Array.isArray(args.includedSections) ? args.includedSections : ['education', 'research', 'publications', 'skills'],
      lastModified: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      cloned.cvProfiles[existingIdx] = cvProf;
    } else {
      cloned.cvProfiles.push(cvProf);
    }

    return cloned;
  }

  if (toolName === 'draft_or_refine_letter') {
    cloned.letterDrafts = Array.isArray(cloned.letterDrafts) ? cloned.letterDrafts : [];
    const draft = {
      id: `draft-${Date.now()}`,
      mode: args.mode || 'sop',
      targetInstitution: sanitizeValue(args.targetInstitution || ''),
      targetProgram: sanitizeValue(args.targetProgram || ''),
      targetProfessor: sanitizeValue(args.targetProfessor || ''),
      subject: sanitizeValue(args.subject || ''),
      body: sanitizeValue(args.body || ''),
      lastModified: new Date().toISOString()
    };
    cloned.letterDrafts.unshift(draft);
    return cloned;
  }

  return cloned;
}

export function parseOfflineVibeIntent(userPrompt = '', activeProfile = {}) {
  const prompt = userPrompt.trim().toLowerCase();

  // 1. Check for profile data mutations (skills, publications, etc.) using userPrompt to preserve casing
  const addSkillMatch = userPrompt.match(/(?:add skill|skill add|skills add|দক্ষতা যোগ করো|স্কিল যোগ করো)\s*[:]?\s*(.+)/i);
  if (addSkillMatch) {
    const rawSkills = addSkillMatch[1].split(/[,•|]/).map((s) => s.trim()).filter(Boolean);
    return {
      explanation: `Added skill(s): ${rawSkills.join(', ')}.`,
      tool: 'patch_profile_data',
      arguments: { addSkills: rawSkills }
    };
  }

  // 2. Check for CV tailoring intent
  if (prompt.includes('tailor cv') || prompt.includes('tailor resume') || prompt.includes('সিভি কাস্টমাইজ') || prompt.includes('tailored cv')) {
    const isBioinfo = prompt.includes('bioinformatics') || prompt.includes('computational');
    return {
      explanation: `Created tailored CV profile for ${isBioinfo ? 'Bioinformatics Analyst' : 'Target Opportunity'}.`,
      tool: 'tailor_cv_profile',
      arguments: {
        profileName: isBioinfo ? 'Bioinformatics Analyst' : 'Targeted Candidate CV',
        targetRole: isBioinfo ? 'Bioinformatics Analyst' : 'Target Opportunity Candidate',
        includedSections: ['education', 'research', 'publications', 'skills']
      }
    };
  }

  // 3. Check for Letter / SOP intent
  if (prompt.includes('draft sop') || prompt.includes('write sop') || prompt.includes('cover letter') || prompt.includes('লেটার ড্রাফট') || prompt.includes('cold email')) {
    const isCover = prompt.includes('cover letter') || prompt.includes('কভার লেটার');
    const isEmail = prompt.includes('cold email') || prompt.includes('ইমেইল');
    const isMotivation = prompt.includes('motivation') || prompt.includes('মোটিভেশন');
    const mode = isEmail ? 'email' : (isCover ? 'cover' : (isMotivation ? 'motivation' : 'sop'));

    return {
      explanation: `Prepared targeted ${mode.toUpperCase()} draft.`,
      tool: 'draft_or_refine_letter',
      arguments: {
        mode,
        targetInstitution: 'Target Institution'
      }
    };
  }

  // 4. Check for Conversational Q&A / Inquiry intent
  const isQuestion = prompt.includes('?') ||
    /^(who|what|where|when|why|how|is|are|do|does|can|could|tell|summarize|explain|who's|whats|how's)\b/i.test(prompt) ||
    /^(কে|কী|কোথায়|কেন|কীভাবে|বলো|জানাও|তুমি কি|আপনি কি)\b/i.test(prompt) ||
    prompt.includes('do you know') ||
    prompt.includes('did he study') ||
    prompt.includes('did she study') ||
    prompt.includes('তুমি কি জানো') ||
    prompt.includes('আপনি কি জানেন');

  if (isQuestion) {
    const name = activeProfile.identity?.fullName || 'Md. Nafizur Rahman';
    // Education inquiry (e.g. "do you know Md Nafizur Rahman studied at University of Rajshahi, DVM?")
    if (prompt.includes('stud') || prompt.includes('university') || prompt.includes('degree') || prompt.includes('dvm') || prompt.includes('rajshahi') || prompt.includes('education') || prompt.includes('পড়াশোনা') || prompt.includes('বিশ্ববিদ্যালয়')) {
      const edus = Array.isArray(activeProfile.education) ? activeProfile.education : [];
      const dvm = edus.find((e) => ((e.degree || '').toLowerCase().includes('dvm')) || ((e.institution || '').toLowerCase().includes('rajshahi')));
      if (dvm) {
        return {
          mode: 'conversational',
          explanation: `Yes, absolutely! According to verified workspace records, ${name} completed ${dvm.degree || 'Doctor of Veterinary Medicine (DVM)'} at ${dvm.institution || 'University of Rajshahi'}${dvm.period || dvm.year ? ` (${dvm.period || dvm.year})` : ''}.`,
          tool: 'conversational_response',
          arguments: {}
        };
      }
      return {
        mode: 'conversational',
        explanation: `Yes! ${name}'s verified profile includes academic records from ${edus.map(e => `${e.degree || 'Degree'} at ${e.institution || 'University'}`).join(', ') || 'University of Rajshahi'}.`,
        tool: 'conversational_response',
        arguments: {}
      };
    }

    // Identity / Author / Role inquiry
    if (prompt.includes('who are you') || prompt.includes('who is') || prompt.includes('name') || prompt.includes('নাম') || prompt.includes('কে')) {
      const role = activeProfile.identity?.roleBadge || activeProfile.identity?.tagline || 'Doctor of Veterinary Medicine & Researcher';
      return {
        mode: 'conversational',
        explanation: `This portfolio belongs to ${name}, ${role}. I am the ZunDeck Vibe Agent and can help you answer questions, explore your credentials, or apply live customizations to your portfolio, ATS CV, and SOP.`,
        tool: 'conversational_response',
        arguments: {}
      };
    }

    // Research / Publications inquiry
    if (prompt.includes('research') || prompt.includes('publication') || prompt.includes('paper') || prompt.includes('amr') || prompt.includes('pathogen') || prompt.includes('গবেষণা')) {
      const pubs = Array.isArray(activeProfile.publications) ? activeProfile.publications : [];
      return {
        mode: 'conversational',
        explanation: `The portfolio features ${pubs.length} verified publications and research appointments focused on pathogen genomics, antimicrobial resistance (AMR), and One Health molecular epidemiology.`,
        tool: 'conversational_response',
        arguments: {}
      };
    }

    // General conversational question
    return {
      mode: 'conversational',
      explanation: `I am your ZunDeck Vibe Agent. I can answer questions about your profile facts, review publications and experience, or help customize themes, layouts, CVs, and documents. What would you like to explore?`,
      tool: 'conversational_response',
      arguments: {}
    };
  }

  // Greeting inquiry
  if (/^(hello|hi|hey|greetings|নমস্কার|হ্যালো|সালাম)\b/i.test(prompt)) {
    const name = activeProfile.identity?.fullName || 'Md Nafizur Rahman';
    return {
      mode: 'conversational',
      explanation: `Hello! I am your ZunDeck Vibe Agent for ${name}'s portfolio and CV. You can ask me questions about your academic records or command any visual and content customizations.`,
      tool: 'conversational_response',
      arguments: {}
    };
  }

  // 5. Styling & Layout attributes accumulator
  const args = {};
  const explanationParts = [];

  // Theme detection
  if (prompt.includes('dark') || prompt.includes('ডার্ক') || prompt.includes('dark mode')) {
    args.theme = 'dark';
    explanationParts.push('Dark theme');
  } else if (prompt.includes('light') || prompt.includes('লাইট') || prompt.includes('light mode')) {
    args.theme = 'light';
    explanationParts.push('Light theme');
  } else if (prompt.includes('slate') || prompt.includes('স্লেট')) {
    args.theme = 'slate';
    explanationParts.push('Slate theme');
  } else if (prompt.includes('solarized')) {
    args.theme = 'solarized';
    explanationParts.push('Solarized theme');
  } else if (prompt.includes('contrast')) {
    args.theme = 'contrast';
    explanationParts.push('High Contrast theme');
  }

  // Accent color detection
  if (prompt.includes('emerald') || prompt.includes('সবুজ') || prompt.includes('#10b981')) {
    args.accentColor = '#10b981';
    explanationParts.push('Emerald accent (#10b981)');
  } else if (prompt.includes('teal') || prompt.includes('টিয়াল') || prompt.includes('#0d9488')) {
    args.accentColor = '#0d9488';
    explanationParts.push('Teal accent (#0d9488)');
  } else if (prompt.includes('amber') || prompt.includes('orange') || prompt.includes('কমলা') || prompt.includes('#f59e0b')) {
    args.accentColor = '#f59e0b';
    explanationParts.push('Amber accent (#f59e0b)');
  } else if (prompt.includes('blue') || prompt.includes('নীল') || prompt.includes('#3b82f6') || prompt.includes('#2563eb')) {
    args.accentColor = '#3b82f6';
    explanationParts.push('Vibrant Blue accent (#3b82f6)');
  } else if (prompt.includes('cyan') || prompt.includes('#06b6d4')) {
    args.accentColor = '#06b6d4';
    explanationParts.push('Cyan accent (#06b6d4)');
  }

  // Template switching
  if (prompt.includes('flagship') || prompt.includes('academic flagship')) {
    args.portfolioTemplateId = 'acad-flagship';
    explanationParts.push('Academic Flagship template');
  } else if (prompt.includes('minimalist') || prompt.includes('minimal') || prompt.includes('swiss')) {
    args.portfolioTemplateId = 'tech-minimalist';
    explanationParts.push('Clean Minimalist template');
  } else if (prompt.includes('executive') || prompt.includes('corporate') || prompt.includes('bento')) {
    args.portfolioTemplateId = 'corp-executive';
    explanationParts.push('Corporate Executive template');
  }

  // Typography
  if (prompt.includes('jetbrains mono') || prompt.includes('monospace') || prompt.includes('terminal')) {
    args.fontFamily = 'JetBrains Mono';
    explanationParts.push('JetBrains Mono typography');
  } else if (prompt.includes('inter')) {
    args.fontFamily = 'Inter';
    explanationParts.push('Inter typography');
  } else if (prompt.includes('plus jakarta sans') || prompt.includes('jakarta')) {
    args.fontFamily = 'Plus Jakarta Sans';
    explanationParts.push('Plus Jakarta Sans typography');
  }

  // Visual effects: Radiant Glow & Perimeter Gradient
  if (prompt.includes('radiant glow') || prompt.includes('glow') || prompt.includes('lighting')) {
    args.glowLevel = 'radiant';
    args.perimeterGradient = 'active';
    explanationParts.push('Radiant glow & perimeter gradient');
  }

  // Updates Ticker & Marquee
  if (prompt.includes('ticker') || prompt.includes('news ticker')) {
    args.tickerSpeed = 'normal';
    explanationParts.push('Auto-scrolling updates ticker');
  }
  if (prompt.includes('gallery marquee') || prompt.includes('marquee')) {
    args.gallerySpeed = 'normal';
    explanationParts.push('Gallery marquee loop');
  }

  // Interactive Map & Floating CV Pill
  if (prompt.includes('map') || prompt.includes('coordinates') || prompt.includes('gps')) {
    args.showMap = true;
    args.mapCoordinates = { latitude: 24.374043, longitude: 88.644182, locationName: 'Rajshahi, Bangladesh' };
    explanationParts.push('Interactive field coordinates map');
  }
  if (prompt.includes('floating pill') || prompt.includes('floating cv') || prompt.includes('pdf pill')) {
    args.showFloatingCvPill = true;
    explanationParts.push('Floating quick-action CV pill');
  }

  // Grid columns
  if (prompt.includes('1 column') || prompt.includes('single column') || prompt.includes('১ কলাম')) {
    args.gridColumns = 1;
    explanationParts.push('1-column layout');
  } else if (prompt.includes('2 column') || prompt.includes('2 columns') || prompt.includes('২ কলাম')) {
    args.gridColumns = 2;
    explanationParts.push('2-column layout');
  } else if (prompt.includes('3 column') || prompt.includes('3 columns') || prompt.includes('৩ কলাম')) {
    args.gridColumns = 3;
    explanationParts.push('3-column layout');
  } else if (prompt.includes('4 column') || prompt.includes('4 columns') || prompt.includes('৪ কলাম')) {
    args.gridColumns = 4;
    explanationParts.push('4-column layout');
  }

  if (Object.keys(args).length > 0) {
    return {
      explanation: `Updated styling: ${explanationParts.join(', ')}.`,
      tool: 'update_theme_and_layout',
      arguments: args
    };
  }

  // Default fallback for general refinement
  return {
    explanation: 'Refined workspace styling and layout configuration.',
    tool: 'update_theme_and_layout',
    arguments: { theme: activeProfile.displayConfig?.theme || 'dark' }
  };
}

export async function processVibeAgentMessage(userPrompt, activeProfile, options = {}) {
  if (!userPrompt || typeof userPrompt !== 'string') {
    throw new Error('User prompt cannot be empty.');
  }

  const configured = await isAiConfigured();
  let aiResponseJson = null;

  if (configured && !options.forceOffline) {
    try {
      const profileSummary = buildCandidateProfileSummary(activeProfile);
      const promptPayload = `
${profileSummary}

User Inquiry / Command: "${userPrompt}"

Instructions:
- If this is a question, greeting, or conversational inquiry, answer directly, factually, and conversationally in the user's language, and set "mode": "conversational". Do NOT invoke any edit tools.
- Only if the user explicitly asks to edit, restyle, add, delete, or customize content or documents, choose the appropriate tool and set "mode": "edit".

Return JSON only:`;

      const rawAiText = await callAiText(promptPayload, {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2
      });

      aiResponseJson = parseJsonFromAiResponse(rawAiText);
    } catch {
      // Graceful fallback to offline intent parser if API call fails
      aiResponseJson = null;
    }
  }

  // Fallback to deterministic offline intent parser if online call failed or unconfigured
  if (!aiResponseJson) {
    aiResponseJson = parseOfflineVibeIntent(userPrompt, activeProfile);
  }

  // Distinguish Conversational Q&A vs Explicit Edit Commands
  const isConversational = aiResponseJson.mode === 'conversational' ||
    aiResponseJson.tool === 'conversational_response' ||
    !aiResponseJson.tool;

  if (isConversational) {
    return {
      success: true,
      isConversational: true,
      hasChanges: false,
      toolUsed: 'conversational_response',
      argsUsed: {},
      explanation: aiResponseJson.explanation || aiResponseJson.answer || aiResponseJson.text || 'I am ready to help you explore your portfolio or make live customizations.',
      diffSummary: null,
      checkpointId: null,
      updatedProfile: activeProfile
    };
  }

  const { tool, arguments: args, explanation } = aiResponseJson;

  // 1. Apply Tool & Mutate Cloned Profile
  const updatedProfile = applyVibeTool(activeProfile, tool, args || {});
  const diffSummary = calculateDiffSummary(activeProfile, updatedProfile);

  // 2. Save Checkpoint into Timeline
  const checkpoint = await createCheckpoint(
    activeProfile,
    explanation || `Vibe Edit: ${tool}`,
    diffSummary,
    'vibe-agent'
  );

  return {
    success: true,
    isConversational: false,
    hasChanges: true,
    toolUsed: tool,
    argsUsed: args || {},
    explanation: explanation || 'Applied requested changes safely.',
    diffSummary,
    checkpointId: checkpoint?.id || null,
    updatedProfile
  };
}

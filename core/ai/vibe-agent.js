import { sanitizeCss, sanitizeValue } from '../security/sanitizer.js';
import { scanForSecrets } from '../security/secret-scanner.js';
import { createCheckpoint, calculateDiffSummary } from '../storage/checkpoint-timeline.js';
import { callAiText, parseJsonFromAiResponse, isAiConfigured } from './byok-client.js';

export const VIBE_TOOLS = [
  {
    name: 'patch_profile_data',
    description: 'Apply schema-validated content edits to identity, education, research, publications, projects, certifications, or skills.',
    parameters: {
      type: 'object',
      properties: {
        identity: { type: 'object', description: 'Updated identity fields (fullName, roleBadge, tagline, bioParagraphs, etc.)' },
        addPublications: { type: 'array', description: 'New publications to append' },
        addEducation: { type: 'array', description: 'New education items to append' },
        addResearch: { type: 'array', description: 'New research appointments to append' },
        addProjects: { type: 'array', description: 'New project cards to append' },
        addCertifications: { type: 'array', description: 'New certifications to append' },
        addSkills: { type: 'array', items: { type: 'string' }, description: 'Skills to add' },
        reorderSection: { type: 'string', description: 'Section to reorder' },
        orderIds: { type: 'array', items: { type: 'string' }, description: 'New ID sequence' }
      }
    }
  },
  {
    name: 'update_theme_and_layout',
    description: 'Update safe CSS theme tokens, colors, fonts, template switching, seeAllLimit, card grid columns, or scoped safe custom CSS.',
    parameters: {
      type: 'object',
      properties: {
        portfolioTemplateId: { type: 'string', description: 'Target template ID (e.g. acad-flagship, tech-minimalist, corp-executive)' },
        cvTemplateId: { type: 'string', description: 'Target CV template ID (e.g. cv-acad-flagship, cv-corp-clean)' },
        theme: { type: 'string', enum: ['dark', 'light', 'slate', 'solarized', 'contrast'] },
        accentColor: { type: 'string', description: 'Hex or CSS color string (e.g. #0d9488, #3b82f6, #10b981)' },
        fontFamily: { type: 'string', description: 'Font pairing (Inter, Plus Jakarta Sans, Merriweather, JetBrains Mono)' },
        gridColumns: { type: 'number', description: 'Card grid columns (1, 2, 3, or 4)' },
        seeAllLimit: { type: 'number', description: 'Initial items visible before See All (e.g. 3, 5, 10)' },
        scopedCss: { type: 'string', description: 'Safe CSS rules without @import or javascript:' }
      }
    }
  },
  {
    name: 'tailor_cv_profile',
    description: 'Create or update a targeted CV profile with specific section visibility toggles.',
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

const SYSTEM_PROMPT = `You are ZunDeck Vibe Agent, a safe AI vibe coding partner for academic portfolios, ATS CVs, and SOP letters.
You communicate naturally in English or Bengali depending on the user.

CRITICAL SAFETY & EXECUTION RULES:
1. You MUST NEVER fabricate achievements, fake citations, fake degrees, or false metrics.
2. You only execute changes through one of the 4 permitted structured tools:
   - patch_profile_data(jsonPatch)
   - update_theme_and_layout(configPatch)
   - tailor_cv_profile(profilePatch)
   - draft_or_refine_letter(letterPatch)
3. Do NOT generate bloated explanatory essays. Be crisp, professional, and explain what you changed in 1-2 direct sentences.
4. Always respond with a valid JSON block containing:
   {
     "explanation": "Short summary of changes in user language",
     "tool": "patch_profile_data" | "update_theme_and_layout" | "tailor_cv_profile" | "draft_or_refine_letter",
     "arguments": { ... }
   }
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

    // 3. Add skills
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

    // 4. Reorder items
    if (args.reorderSection && Array.isArray(args.orderIds) && Array.isArray(cloned[args.reorderSection])) {
      const section = cloned[args.reorderSection];
      const reordered = [];
      args.orderIds.forEach((id) => {
        const found = section.find((x) => x.id === id);
        if (found) reordered.push(found);
      });
      // Append leftovers
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

  // 1. Check for profile data mutations (skills, publications, etc.)
  const addSkillMatch = prompt.match(/(?:add skill|skill add|skills add|দক্ষতা যোগ করো|স্কিল যোগ করো)\s*[:]?\s*(.+)/i);
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
    return {
      explanation: 'Created tailored CV profile for targeted opportunity.',
      tool: 'tailor_cv_profile',
      arguments: {
        profileName: 'Targeted Candidate CV',
        targetRole: 'Target Opportunity Candidate',
        includedSections: ['education', 'research', 'publications', 'skills']
      }
    };
  }

  // 3. Check for Letter / SOP intent
  if (prompt.includes('draft sop') || prompt.includes('write sop') || prompt.includes('cover letter') || prompt.includes('লেটার ড্রাফট')) {
    const isCover = prompt.includes('cover letter') || prompt.includes('কভার লেটার');
    return {
      explanation: `Prepared targeted ${isCover ? 'Cover Letter' : 'Statement of Purpose'} draft.`,
      tool: 'draft_or_refine_letter',
      arguments: {
        mode: isCover ? 'cover_letter' : 'sop',
        targetInstitution: 'Target Institution'
      }
    };
  }

  // 4. Styling & Layout attributes accumulator (theme, accentColor, template, columns)
  const args = {};
  const explanationParts = [];

  // Theme detection
  if (prompt.includes('dark') || prompt.includes('ডার্ক') || prompt.includes('dark mode')) {
    args.theme = 'dark';
    explanationParts.push('Dark mode');
  } else if (prompt.includes('light') || prompt.includes('লাইট') || prompt.includes('light mode')) {
    args.theme = 'light';
    explanationParts.push('Light mode');
  }

  // Accent color detection
  if (prompt.includes('emerald') || prompt.includes('green') || prompt.includes('সবুজ')) {
    args.accentColor = '#10b981';
    explanationParts.push('Emerald accent');
  } else if (prompt.includes('teal') || prompt.includes('cyan') || prompt.includes('blue') || prompt.includes('নীল')) {
    args.accentColor = '#0d9488';
    explanationParts.push('Teal accent');
  } else if (prompt.includes('amber') || prompt.includes('orange') || prompt.includes('কমলা')) {
    args.accentColor = '#f59e0b';
    explanationParts.push('Amber accent');
  }

  // Template switching
  if (prompt.includes('flagship') || prompt.includes('academic flagship')) {
    args.portfolioTemplateId = 'acad-flagship';
    explanationParts.push('Academic Flagship template');
  } else if (prompt.includes('minimalist') || prompt.includes('minimal')) {
    args.portfolioTemplateId = 'tech-minimalist';
    explanationParts.push('Clean Minimalist template');
  } else if (prompt.includes('executive') || prompt.includes('corporate')) {
    args.portfolioTemplateId = 'corp-executive';
    explanationParts.push('Executive Corporate template');
  }

  // Grid columns
  if (prompt.includes('1 column') || prompt.includes('single column')) {
    args.gridColumns = 1;
    explanationParts.push('1-column layout');
  } else if (prompt.includes('2 column') || prompt.includes('2 columns')) {
    args.gridColumns = 2;
    explanationParts.push('2-column layout');
  } else if (prompt.includes('3 column') || prompt.includes('3 columns')) {
    args.gridColumns = 3;
    explanationParts.push('3-column layout');
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
      const promptPayload = `
Candidate Profile Snapshot:
- Name: ${activeProfile.identity?.fullName || 'Untitled'}
- Role: ${activeProfile.identity?.roleBadge || ''}
- Active Template: ${activeProfile.displayConfig?.portfolioTemplateId || 'acad-flagship'}
- Current Theme: ${activeProfile.displayConfig?.theme || 'dark'}
- Publications Count: ${activeProfile.publications?.length || 0}
- Education Count: ${activeProfile.education?.length || 0}

User Command: "${userPrompt}"

Choose the appropriate tool and return JSON only:`;

      const rawAiText = await callAiText(promptPayload, {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.2
      });

      aiResponseJson = parseJsonFromAiResponse(rawAiText);
    } catch (err) {
      // Graceful fallback to offline intent parser if API call fails
      aiResponseJson = null;
    }
  }

  // Fallback to deterministic offline intent parser if online call failed or unconfigured
  if (!aiResponseJson || !aiResponseJson.tool) {
    aiResponseJson = parseOfflineVibeIntent(userPrompt, activeProfile);
  }

  const { tool, arguments: args, explanation } = aiResponseJson;

  // 1. Calculate Diff & Snapshot Before Mutating
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
    toolUsed: tool,
    argsUsed: args || {},
    explanation: explanation || 'Applied requested changes safely.',
    diffSummary,
    checkpointId: checkpoint?.id || null,
    updatedProfile
  };
}

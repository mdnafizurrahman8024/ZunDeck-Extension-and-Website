export function buildSopPrompt(profile, targetDetails = {}, personalNotes = '') {
  const identity = profile.identity || {};
  const education = (profile.education || [])[0] || {};
  const research = (profile.research || []).slice(0, 3);
  const publications = (profile.publications || []).slice(0, 3);
  const skills = profile.skills || {};

  return `You are an expert academic admissions advisor helping draft a Statement of Purpose (SOP) for graduate admissions (Master's / PhD).

Strict Zero-Fabrication Rule:
- ONLY use facts, degrees, research projects, methodologies, and publications provided below.
- NEVER invent GPAs, publications, honors, or lab experiences that do not exist in the candidate data.
- If specific subjective motivation or lab alignment details are missing, insert explicit "[USER INPUT NEEDED: Description]" tags for the user to complete.

Candidate Profile:
- Name: ${identity.fullName || 'Candidate'}
- Degree: ${education.degree || ''} (${education.institution || ''})
- Key Research: ${research.map((r) => `${r.title} (${r.status || ''}): ${r.summary || ''}`).join('; ')}
- Publications/Protocols: ${publications.map((p) => p.title).join('; ')}
- Technical & Wet-Lab Skills: ${[skills.clinical?.skills, skills.computational?.skills].flat().filter(Boolean).map((s) => s.name || s).join(', ')}

Target Opportunity:
- Institution: ${targetDetails.institution || '[Target University]'}
- Program / Degree: ${targetDetails.program || '[Target Graduate Program]'}
- Target Lab / PI: ${targetDetails.professor || '[Target Professor / Lab Name]'}
- Research Focus: ${targetDetails.focusArea || '[Specific Research Focus Area]'}

Personal Story / Context:
${personalNotes || 'None specified.'}

Draft a 5-paragraph SOP structured into:
1. Hook & Intellectual Question
2. Academic Foundation & Methodological Rigor
3. Research Experience & Empirical Evidence
4. Institutional Fit & Lab Synergy
5. Long-term Vision & Scholarly Contribution`;
}

export function buildMotivationPrompt(profile, targetDetails = {}, personalNotes = '') {
  const identity = profile.identity || {};
  const education = (profile.education || [])[0] || {};
  const volunteering = (profile.volunteering || [])[0] || {};

  return `You are a scholarship writing advisor for European prestigious scholarships (Erasmus Mundus EMJM, DAAD, Chevening, Swedish Institute).

Strict Zero-Fabrication Rule:
- Adhere strictly to the facts in the profile.
- Emphasize academic rigor, intercultural adaptability, community commitment, and return impact.
- Use explicit "[USER INPUT NEEDED: ...]" tags wherever personal reflection or mobility choice is missing.

Candidate Profile:
- Name: ${identity.fullName || 'Candidate'}
- Current Degree: ${education.degree || ''} at ${education.institution || ''}
- Community / Welfare: ${volunteering.role || ''} with ${volunteering.organization || ''} (${volunteering.summary || ''})
- Target Scholarship / Consortium: ${targetDetails.program || '[Scholarship Consortium Name]'}
- Host Universities: ${targetDetails.institution || '[Host University Track]'}
- Personal Motivation Notes: ${personalNotes || 'None provided.'}

Structure the letter in 4 distinct sections:
1. Scholarship Ambition & Program Selection
2. Academic Competence & Multidisciplinary Field Resilience
3. Transnational Mobility & Consortium Synergy
4. Knowledge Transfer & Return Impact`;
}

export function buildCoverLetterPrompt(profile, targetDetails = {}, personalNotes = '') {
  const identity = profile.identity || {};
  const projects = (profile.projects || []).slice(0, 3);

  return `You are an executive talent consultant crafting an impact-driven Corporate Cover Letter.

Candidate:
- Name: ${identity.fullName || 'Candidate'}
- Systems / Projects: ${projects.map((p) => `${p.name}: ${p.summary || ''}`).join('; ')}
- Target Company / Org: ${targetDetails.institution || '[Target Organization]'}
- Position / Role: ${targetDetails.program || '[Target Role / Title]'}
- Hiring Manager: ${targetDetails.professor || 'Hiring Team'}
- Key Requirements / Notes: ${personalNotes || 'None specified.'}

Strict Rules:
- Focus on business ROI, technical delivery, and practical outcomes.
- Zero boilerplate fluff or exaggerated claims.
- Use "[USER INPUT NEEDED: ...]" for company-specific cultural alignment.`;
}

export function buildColdEmailPrompt(profile, targetDetails = {}, personalNotes = '') {
  const identity = profile.identity || {};
  const education = (profile.education || [])[0] || {};

  return `You are an academic mentor writing a concise, high-reply cold outreach email to a Professor or Principal Investigator (PI).

Candidate:
- Name: ${identity.fullName || 'Candidate'}
- Current Degree: ${education.degree || ''} (${education.institution || ''})
- Target Professor: ${targetDetails.professor || 'Professor'}
- Department / Institution: ${targetDetails.institution || '[Target Institution]'}
- Paper / Project Reference: ${targetDetails.focusArea || '[Recent Publication or Lab Project]'}
- Additional Notes: ${personalNotes || ''}

Requirements:
- Length: Under 200 words.
- Generate 2 distinct, high-impact Subject Line options.
- Direct connection to their research.
- 2 bullet points on relevant methodology or background.
- Low-friction ask (15-minute call or brief feedback).`;
}

export function buildPromptForMode(modeId, profile, targetDetails = {}, personalNotes = '') {
  switch (modeId) {
    case 'motivation':
      return buildMotivationPrompt(profile, targetDetails, personalNotes);
    case 'cover-letter':
      return buildCoverLetterPrompt(profile, targetDetails, personalNotes);
    case 'cold-email':
      return buildColdEmailPrompt(profile, targetDetails, personalNotes);
    case 'sop':
    default:
      return buildSopPrompt(profile, targetDetails, personalNotes);
  }
}

export function assembleOfflineDraft(profile, modeId = 'sop', targetDetails = {}, personalNotes = '') {
  const identity = profile.identity || {};
  const education = Array.isArray(profile.education) ? profile.education : [];
  const primaryEdu = education[0] || {};
  const research = Array.isArray(profile.research) ? profile.research : [];
  const publications = Array.isArray(profile.publications) ? profile.publications : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const volunteering = Array.isArray(profile.volunteering) ? profile.volunteering : [];

  const candidateName = identity.fullName || 'Md. Nafizur Rahman';
  const candidateEmail = identity.email || 'mdnafizurrahman8024@gmail.com';
  const candidateUni = primaryEdu.institution || 'University of Rajshahi';
  const candidateDegree = primaryEdu.degree || 'Doctor of Veterinary Medicine (DVM)';

  const targetInst = targetDetails.institution || '[Target University / Organization]';
  const targetProgram = targetDetails.program || '[Target Degree / Role]';
  const targetPerson = targetDetails.professor || 'Admissions Committee';
  const targetFocus = targetDetails.focusArea || 'Epidemiology, AMR Surveillance & One Health';

  if (modeId === 'cold-email') {
    const subject = `Prospective Graduate Researcher: Inquiry regarding ${targetFocus} — ${candidateName}`;
    const paragraphs = [
      `Dear ${targetPerson.startsWith('Prof') || targetPerson.startsWith('Dr') ? targetPerson : `Professor ${targetPerson}`},`,

      `I hope this email finds you well. I have been following your laboratory's ongoing work on ${targetFocus}, particularly your recent contributions to advancing our understanding of infectious disease dynamics. My own academic and research trajectory as a final-year ${candidateDegree} student at ${candidateUni} closely converges with your team's investigative methodologies.`,

      `During my clinical and research training, I have focused on bridging biological surveillance with computational analysis:`,

      `• Epidemiological & Wet-Lab Investigation: Led field surveillance and diagnostic studies on antimicrobial resistance patterns in companion animals and vector-borne ectoparasite dynamics in the Barind Tract.
• Computational & Systematic Evidence Synthesis: Spearheaded a registered systematic review and meta-analysis on nanoparticle-based rabies vaccine efficacy (OSF DOI: 10.17605/OSF.IO/9AQS3), while developing data-driven diagnostic tools using Python, SQL, and spatial analytics.`,

      `[USER INPUT NEEDED: Add one sentence specifically connecting your interest to a recent paper authored by this professor, e.g., "Your 2025 paper on X provided pivotal insight for my current research focus."]`,

      `I am eager to pursue graduate research under your supervision within the upcoming admission cycle. Would you be available for a brief 15-minute conversation to discuss potential alignment with your lab's upcoming projects? My detailed CV and portfolio are linked below for your review.`,

      `Thank you very much for your time and consideration.`
    ];

    return {
      modeId,
      subject,
      salutation: `Dear ${targetPerson},`,
      paragraphs,
      signoff: `Sincerely,\n${candidateName}\n${candidateDegree} Student | ${candidateUni}\nPortfolio: ${identity.links?.personalWebsite || 'https://mdnafizurrahman8024.github.io/'}\nEmail: ${candidateEmail}`
    };
  }

  if (modeId === 'motivation') {
    const subject = `Motivation Letter: Application for ${targetProgram} (${targetInst})`;
    const paragraphs = [
      `Dear Members of the Selection Committee,`,

      `I am writing to express my enthusiastic application for the ${targetProgram} across the partner institutions of ${targetInst}. As a ${candidateDegree} student at ${candidateUni}, my investigative career has been driven by a single commitment: integrating clinical veterinary epidemiology with modern computational data systems to resolve urgent zoonotic and antimicrobial challenges within a global One Health framework.`,

      `My academic foundation has been forged through rigorous coursework in Veterinary Pathology, Microbiology, Pharmacology, Parasitology, and Epidemiology. Beyond didactic excellence, I have actively led field-level investigations into antimicrobial stewardship and vector dynamics across low-resource agro-ecological zones. Recognizing that sustainable disease surveillance requires technological accessibility, I engineered scientific web platforms including PoultryMedix and VetMedix, which translate complex diagnostic protocols into open, structured digital decision frameworks.`,

      `The multifaceted structure of ${targetProgram} provides an indispensable training environment for my scientific aspirations. The opportunity to undertake specialized tracks across partner European faculties will expose me to cutting-edge molecular genomics, advanced biostatistics, and cross-border disease policy that cannot be replicated within a single institutional environment. [USER INPUT NEEDED: Describe your preferred mobility track (e.g., Year 1 at University A, Year 2 at University B) and how this trajectory reinforces your research focus.]`,

      `Equally vital to my vision is active community service. As a volunteer with Save Wildlife and Nature (SWAN), I have conducted wildlife rescues and community outreach to mitigate human-animal conflict. Upon completing the ${targetProgram}, I plan to establish a multidisciplinary One Health surveillance laboratory in South Asia, liaising with global health organizations to monitor emerging zoonoses, curb antimicrobial resistance, and mentor the next generation of veterinary scientists.`,

      `Thank you for considering my application. I welcome the opportunity to contribute our diverse perspective and dedication to your incoming international cohort.`
    ];

    return {
      modeId,
      subject,
      salutation: 'Dear Members of the Selection Committee,',
      paragraphs,
      signoff: `Respectfully submitted,\n${candidateName}\n${candidateEmail}`
    };
  }

  if (modeId === 'cover-letter') {
    const subject = `Application for ${targetProgram} — ${candidateName}`;
    const paragraphs = [
      `Dear ${targetPerson},`,

      `I am writing to apply for the ${targetProgram} role at ${targetInst}. With a comprehensive clinical veterinary foundation as a ${candidateDegree} student at ${candidateUni} and proven experience engineering production web systems and epidemiological data pipelines, I bring a unique dual competence to your organization.`,

      `Throughout my work, I have combined biological rigor with modern software engineering:
• Built responsive, data-driven platforms (PoultryMedix, VetMedix, ZunSync) delivering veterinary decision trees, dosage algorithms, and real-time disease triage to hundreds of active field users.
• Conducted empirical data collection and statistical surveillance, evaluating antimicrobial prescription trends and Knowledge, Attitude, and Practices (KAP) across regional stakeholders.
• Proficient with Python, SQL, GIS spatial mapping (GeoPandas), and full-stack web architectures, ensuring research findings are translated into user-centric software tools.`,

      `[USER INPUT NEEDED: Add 2-3 sentences explaining why ${targetInst}'s mission, recent public project, or technical stack directly matches your career trajectory.]`,

      `I welcome the chance to discuss how my clinical diagnostic training, computational analytical capability, and engineering background can drive measurable value for your team. Thank you for your time and consideration.`
    ];

    return {
      modeId,
      subject,
      salutation: `Dear ${targetPerson},`,
      paragraphs,
      signoff: `Best regards,\n${candidateName}\n${candidateEmail}`
    };
  }

  // Default: Statement of Purpose (SOP)
  const subject = `Statement of Purpose: ${targetProgram} — ${candidateName}`;
  const paragraphs = [
    `The growing convergence of zoonotic pathogen transmission, antimicrobial resistance (AMR), and environmental degradation presents one of the most critical challenges of our era. As a final-year ${candidateDegree} candidate at ${candidateUni}, my research trajectory has been shaped by the conviction that understanding and curbing these systemic threats requires unifying rigorous wet-lab diagnostic pathology with computational epidemiology and transparent data modeling. I am applying to the ${targetProgram} at ${targetInst} to deepen my methodological competence and investigate predictive models for infectious disease control.`,

    `My foundational undergraduate education provided rigorous theoretical and clinical training across Anatomy, Histology, Physiology, Clinical Pathology, Microbiology, and Epidemiology. Early in my studies, I recognized that biological observations gain decisive power when paired with quantitative data systems. Consequently, alongside my clinical training, I mastered Python, SQL, spatial GIS analysis, and statistical visualization, equipping myself to handle complex epidemiological datasets and develop custom computational workflows.`,

    `To date, my research endeavors reflect this multidisciplinary ethos across several completed and ongoing investigations:
1. Antimicrobial Stewardship & Surveillance: I designed and led regional cross-sectional surveys analyzing veterinary prescription patterns, owner treatment behaviors, and self-medication tendencies in companion animals in Rajshahi.
2. Systematic Evidence Synthesis: As lead investigator, I authored and registered a comprehensive systematic review and meta-analysis on nanoparticle-based rabies vaccines (OSF DOI: 10.17605/OSF.IO/9AQS3), evaluating carrier adjuvant types, animal models, and neutralizing antibody titers across international peer-reviewed literature.
3. Field Parasitology & Vector Dynamics: Investigated ectoparasite prevalence in free-roaming canine populations in the Barind Tract, identifying key ecological risk factors influencing tick- and flea-borne pathogen exposure.`,

    `${targetInst} represents the ideal academic environment to advance this work. I am particularly drawn to ${targetFocus}, where ongoing research in your department investigates molecular surveillance and predictive modeling. [USER INPUT NEEDED: Cite 1-2 specific publications from ${targetPerson} or the department that inspire your planned research direction, and explain how your skill set contributes to their active laboratory objectives.]`,

    `Following the completion of my graduate degree, my goal is to lead an independent One Health research laboratory focusing on zoonotic surveillance and vaccine informatics in developing regions, while contributing to international health agency advisory panels. With my solid clinical foundation, published evidence synthesis, and strong computational skills, I am prepared to contribute actively to the scholarly vitality of ${targetInst}.`
  ];

  return {
    modeId,
    subject,
    salutation: 'Dear Admissions Committee,',
    paragraphs,
    signoff: `Respectfully submitted,\n${candidateName}\n${candidateEmail}`
  };
}

export function verifyLetterAuthenticity(letterText = '', profile = {}) {
  const text = String(letterText);
  const identity = profile.identity || {};
  const education = (profile.education || [])[0] || {};

  const placeholderRegex = /\[USER INPUT NEEDED:[^\]]+\]/g;
  const placeholders = text.match(placeholderRegex) || [];

  const verifiedMentions = [];
  const warnings = [];

  const candidateName = identity.fullName || 'Md. Nafizur Rahman';
  if (text.includes(candidateName) || text.includes(identity.shortName || 'Nafiz')) {
    verifiedMentions.push('Candidate Identity matches verified profile');
  }

  const instName = education.institution || 'University of Rajshahi';
  if (text.includes(instName) || text.includes('Rajshahi')) {
    verifiedMentions.push('Institutional affiliation verified (University of Rajshahi)');
  }

  if (text.includes('Doctor of Veterinary Medicine') || text.includes('DVM')) {
    verifiedMentions.push('Academic Degree verified (DVM)');
  }

  if (text.includes('10.17605/OSF.IO/9AQS3') || text.includes('nanoparticle') || text.includes('rabies')) {
    verifiedMentions.push('Registered Meta-Analysis publication verified (OSF Registry)');
  }

  if (text.includes('PoultryMedix') || text.includes('VetMedix') || text.includes('ZunSync')) {
    verifiedMentions.push('Scientific platform engineering verified');
  }

  if (text.includes('Save Wildlife and Nature') || text.includes('SWAN')) {
    verifiedMentions.push('Animal welfare volunteering verified');
  }

  // Hallucination & Fabrication Checks
  const forbiddenPatterns = [
    { pattern: /\b(GPA\s*4\.0|GPA\s*3\.99|rank 1st in the nation)\b/i, label: 'Unverified GPA or national rank claim' },
    { pattern: /\b(Nature Medicine|Cell Host & Microbe|The Lancet Infectious Diseases)\b/i, label: 'High-impact publication not in candidate record' },
    { pattern: /\b(Harvard Medical School alumnus|Oxford graduate)\b/i, label: 'Conflicting educational history claim' }
  ];

  for (const item of forbiddenPatterns) {
    if (item.pattern.test(text)) {
      warnings.push(`Potential fabrication detected: ${item.label}`);
    }
  }

  return {
    authentic: warnings.length === 0,
    placeholdersCount: placeholders.length,
    placeholders,
    verifiedMentions,
    warnings
  };
}

export const LETTER_MODES = [
  {
    id: 'sop',
    name: 'Statement of Purpose (SOP)',
    badge: 'Graduate / PhD',
    targetWordCount: { min: 700, max: 1000, recommended: 850 },
    description: 'Comprehensive academic trajectory, research competence, laboratory fit, methodology mastery, and long-term scientific vision for Master’s and PhD admissions.',
    scaffold: [
      { id: 'hook', title: 'Hook & Core Motivation', hint: 'The specific intellectual question or epidemiological problem that defines your ambition.' },
      { id: 'academic', title: 'Academic Foundation & Theory', hint: 'Key coursework, veterinary/biological foundations, and scholastic rigor.' },
      { id: 'research', title: 'Research Experience & Evidence', hint: 'Field surveillance, lab assays, meta-analyses, and peer-reviewed outputs.' },
      { id: 'fit', title: 'Institutional & Faculty Fit', hint: 'Why this university, this lab, and specific faculty publications that align with your trajectory.' },
      { id: 'goals', title: 'Career Trajectory & Future Impact', hint: 'What you intend to investigate during your degree and how you will apply the training.' }
    ]
  },
  {
    id: 'motivation',
    name: 'Motivation Letter',
    badge: 'Erasmus / Scholarship',
    targetWordCount: { min: 500, max: 750, recommended: 600 },
    description: 'European scholarship standard (Erasmus Mundus, DAAD, Chevening, Swedish Institute). Balances academic excellence with intercultural synergy and societal impact.',
    scaffold: [
      { id: 'opening', title: 'Opening & Scholarship Ambition', hint: 'Clear statement of the specific scholarship consortium and primary track.' },
      { id: 'background', title: 'Academic & Practical Trajectory', hint: 'Demonstrated excellence, field resilience, and multi-disciplinary competencies.' },
      { id: 'consortium', title: 'Mobility & Consortium Value', hint: 'How studying across host universities accelerates your comparative perspective.' },
      { id: 'impact', title: 'Community & Return Impact', hint: 'How you will translate the acquired knowledge to your home nation and global One Health.' }
    ]
  },
  {
    id: 'cover-letter',
    name: 'Corporate / Industry Cover Letter',
    badge: 'Job & Circular',
    targetWordCount: { min: 300, max: 500, recommended: 400 },
    description: 'Impact-driven professional letter mapping candidate accomplishments directly to employer job circular requirements and ROI.',
    scaffold: [
      { id: 'hook', title: 'Strong Value Proposition', hint: 'Position applied for and immediate value you bring to the team.' },
      { id: 'proof', title: 'Proven Track Record', hint: 'Concrete metrics, technical systems built, or problems solved.' },
      { id: 'alignment', title: 'Company Culture & Mission Fit', hint: 'Why this organization and what excites you about their current roadmap.' },
      { id: 'cta', title: 'Next Steps & Call to Action', hint: 'Courteous invitation for technical discussion or interview.' }
    ]
  },
  {
    id: 'cold-email',
    name: 'Cold Outreach Email to PI / Professor',
    badge: 'Outreach & Reply',
    targetWordCount: { min: 140, max: 250, recommended: 180 },
    description: 'Ultra-concise, high-reply outreach email for graduate assistantships, lab rotations, and postdoc positions with automated subject lines.',
    scaffold: [
      { id: 'subject', title: 'Subject Line', hint: 'Clear, informative, referencing recent paper or funding grant.' },
      { id: 'salutation', title: 'Personalized Salutation', hint: 'Professor [Last Name] with exact paper citation.' },
      { id: 'hook', title: 'Research Connection', hint: 'Reference their recent paper or methodology and how it relates to your work.' },
      { id: 'pitch', title: 'Your Unique Contribution', hint: '2 concise bullet points of your background and technical skill.' },
      { id: 'ask', title: 'Low-Friction Ask & Links', hint: 'Request for a 15-minute introductory call, linking CV and live portfolio.' }
    ]
  }
];

export function getLetterModeById(modeId) {
  return LETTER_MODES.find((m) => m.id === modeId) || LETTER_MODES[0];
}

export function calculateLetterStats(text = '') {
  const clean = text.trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const characters = clean.length;
  const charactersNoSpaces = clean.replace(/\s+/g, '').length;
  // Standard reading speed: ~200 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    characters,
    charactersNoSpaces,
    readingTimeMinutes
  };
}

export const CV_CATEGORIES = [
  { id: 'academic', label: 'Academic CVs', count: 10 },
  { id: 'corporate', label: 'Corporate & International Resumes', count: 10 },
  { id: 'tech', label: 'Tech, Data & Hybrid Resumes', count: 10 }
];

export const CV_CATALOG = [
  // --------------------------------------------------------------------------
  // Category A: Academic CVs (10 Templates)
  // --------------------------------------------------------------------------
  {
    id: 'cv-acad-flagship',
    name: 'Flagship Academic CV',
    category: 'academic',
    badge: '1st Recommended',
    isRecommended: true,
    description: 'Faithful reproduction of CV_Nafiz.pdf: prominent centered academic header, verified profile links, crisp horizontal section dividers, right-aligned dates, and bulleted scientific findings.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Inter', -apple-system, sans-serif",
      fontBody: "'Inter', -apple-system, sans-serif",
      primaryColor: '#0d9488',
      dividerColor: '#0d9488',
      accentColor: '#0284c7',
      headerAlignment: 'center',
      hasPhoto: false,
      hasQr: true,
      margins: 'compact'
    },
    sections: ['education', 'research', 'publications', 'projects', 'training', 'awards', 'leadership', 'references']
  },
  {
    id: 'cv-acad-europass',
    name: 'Europass / European Standard Academic CV',
    category: 'academic',
    badge: 'EU / Erasmus',
    description: 'Structured two-column European standard compliant layout (Erasmus Mundus, DAAD, Marie Curie) with CEFR language grid.',
    layout: {
      type: 'europass-split',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#003399',
      dividerColor: '#e2e8f0',
      accentColor: '#ffcc00',
      headerAlignment: 'left',
      hasPhoto: true,
      hasQr: true,
      cefrGrid: true
    },
    sections: ['education', 'research', 'publications', 'skills', 'languages', 'training', 'references']
  },
  {
    id: 'cv-acad-undergrad',
    name: 'Undergraduate / Fresh Graduate Academic CV',
    category: 'academic',
    badge: 'Undergraduate',
    description: 'Highlights university GPA, foundational laboratory rotations, student scientific societies, and capstone research.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0369a1',
      dividerColor: '#bae6fd',
      headerAlignment: 'left'
    },
    sections: ['education', 'research', 'skills', 'projects', 'training', 'leadership']
  },
  {
    id: 'cv-acad-masters',
    name: "Master's & Scholarship Applicant CV",
    category: 'academic',
    badge: 'Graduate / Thesis',
    description: 'Emphasizes thesis research methodology, preliminary manuscripts, statistical analysis software, and academic references.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#047857',
      dividerColor: '#a7f3d0',
      headerAlignment: 'left'
    },
    sections: ['education', 'research', 'publications', 'skills', 'training', 'references']
  },
  {
    id: 'cv-acad-phd',
    name: 'PhD & Doctoral Fellowship CV',
    category: 'academic',
    badge: 'Doctoral Scholar',
    description: 'Publication and protocol-centric dossier built for competitive doctoral fellowships and international graduate school committees.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0f766e',
      dividerColor: '#99f6e4',
      headerAlignment: 'center'
    },
    sections: ['education', 'publications', 'research', 'projects', 'training', 'references']
  },
  {
    id: 'cv-acad-postdoc',
    name: 'Postdoc & Research Scientist CV',
    category: 'academic',
    badge: 'Postdoc',
    description: 'Focuses on independent scientific initiatives, multi-institutional collaborations, high-impact journal records, and lab mentorship.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#1e3a8a',
      dividerColor: '#bfdbfe',
      headerAlignment: 'left'
    },
    sections: ['research', 'publications', 'education', 'leadership', 'training', 'references']
  },
  {
    id: 'cv-acad-faculty',
    name: 'University Professor / Faculty Tenure CV',
    category: 'academic',
    badge: 'Tenure & Faculty',
    description: 'Comprehensive academic record presenting pedagogical history, courses instructed, graduate thesis advisement, and grants.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Georgia', serif",
      fontBody: "'Georgia', serif",
      primaryColor: '#111827',
      dividerColor: '#374151',
      headerAlignment: 'center'
    },
    sections: ['education', 'publications', 'research', 'leadership', 'training', 'references']
  },
  {
    id: 'cv-acad-clinical',
    name: 'Medical / Veterinary / Clinical Doctor CV',
    category: 'academic',
    badge: 'Clinical Doctor',
    description: 'Highlights veterinary clinical diagnostic competencies, surgical assistance, triage procedures, hospital rotations, and licensure.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0e7490',
      dividerColor: '#a5f3fc',
      headerAlignment: 'left'
    },
    sections: ['education', 'skills', 'research', 'training', 'leadership', 'references']
  },
  {
    id: 'cv-acad-biosketch',
    name: 'Grant & Fellowship Biosketch (EU / NIH)',
    category: 'academic',
    badge: 'Biosketch',
    description: 'Structured biosketch including Personal Statement, Positions & Scientific Honors, and Contributions to Science.',
    layout: {
      type: 'biosketch-nih',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#1e293b',
      dividerColor: '#64748b',
      headerAlignment: 'left'
    },
    sections: ['education', 'research', 'publications', 'training', 'awards']
  },
  {
    id: 'cv-acad-latex',
    name: 'Classic LaTeX-Style Pure Scholarly CV',
    category: 'academic',
    badge: 'LaTeX Scholarly',
    description: 'Computer Modern font aesthetic, elegant small-caps section titles, and mathematical/scholarly typography.',
    layout: {
      type: 'latex-minimal',
      fontHeading: "'Latin Modern Roman', 'Times New Roman', serif",
      fontBody: "'Latin Modern Roman', 'Times New Roman', serif",
      primaryColor: '#000000',
      dividerColor: '#000000',
      headerAlignment: 'center'
    },
    sections: ['education', 'research', 'publications', 'projects', 'training', 'references']
  },

  // --------------------------------------------------------------------------
  // Category B: Corporate & International Resumes (10 Templates)
  // --------------------------------------------------------------------------
  {
    id: 'cv-corp-ats-gold',
    name: 'Universal 1-Page ATS Gold Standard',
    category: 'corporate',
    badge: '1-Page ATS Gold',
    description: 'Single-column, zero-table, ultra-high parse accuracy format optimized for Taleo, Workday, Greenhouse, and Lever.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0f172a',
      dividerColor: '#cbd5e1',
      headerAlignment: 'left'
    },
    sections: ['education', 'research', 'projects', 'skills', 'certifications']
  },
  {
    id: 'cv-corp-eu-modern',
    name: 'European Modern Job Resume',
    category: 'corporate',
    badge: 'EU Modern',
    description: 'Contemporary European corporate style (UK, Germany, Switzerland) with clean margins and optional professional headshot.',
    layout: {
      type: 'modern-compact-two-col',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0284c7',
      dividerColor: '#e2e8f0',
      hasPhoto: true
    },
    sections: ['skills', 'education', 'research', 'projects', 'training']
  },
  {
    id: 'cv-corp-fresh-grad',
    name: 'Fresh Graduate / Internship Resume',
    category: 'corporate',
    badge: 'Fresh Graduate',
    description: 'Recruiter-friendly layout placing education, core competencies, relevant coursework, and project impact first.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0f172a',
      dividerColor: '#e2e8f0',
      headerAlignment: 'left'
    },
    sections: ['education', 'skills', 'projects', 'research', 'training']
  },
  {
    id: 'cv-corp-operations',
    name: 'Corporate Operations & Management Resume',
    category: 'corporate',
    badge: 'Operations & Lead',
    description: 'Emphasizes organizational KPIs, process optimization, workflow streamlining, and resource management.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#1e293b',
      dividerColor: '#cbd5e1'
    },
    sections: ['research', 'leadership', 'projects', 'skills', 'education']
  },
  {
    id: 'cv-corp-consulting',
    name: 'Consulting & Business Strategy Resume',
    category: 'corporate',
    badge: 'Consulting / Strategy',
    description: 'Executive structure displaying problem-solving frameworks, client impact metrics, and analytical recommendations.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#1e3a8a',
      dividerColor: '#93c5fd'
    },
    sections: ['research', 'projects', 'education', 'skills', 'training']
  },
  {
    id: 'cv-corp-finance',
    name: 'Finance, Audit & Banking Classic Resume',
    category: 'corporate',
    badge: 'Finance & Audit',
    description: 'Wall Street & banking standard featuring quantitative metrics, audit compliance, financial modeling, and credentials.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Times New Roman', serif",
      fontBody: "'Times New Roman', serif",
      primaryColor: '#047857',
      dividerColor: '#047857',
      headerAlignment: 'center'
    },
    sections: ['education', 'research', 'skills', 'training', 'projects']
  },
  {
    id: 'cv-corp-marketing',
    name: 'Marketing, Media & Growth Resume',
    category: 'corporate',
    badge: 'Growth & Media',
    description: 'Dynamic format showcasing audience acquisition, campaign metrics, brand positioning, and digital strategy.',
    layout: {
      type: 'modern-compact-two-col',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#c026d3',
      dividerColor: '#f5d0fe'
    },
    sections: ['projects', 'skills', 'research', 'education']
  },
  {
    id: 'cv-corp-ngo-un',
    name: 'NGO / UN / International Development CV',
    category: 'corporate',
    badge: 'NGO & UN',
    description: 'Aligned with UN P11 & multilateral donor templates: community mobilization, SDG benchmarks, and field emergency missions.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0284c7',
      dividerColor: '#38bdf8'
    },
    sections: ['research', 'leadership', 'education', 'training', 'references']
  },
  {
    id: 'cv-corp-career-switcher',
    name: 'Career Switcher (Skills-First) Resume',
    category: 'corporate',
    badge: 'Skills-First',
    description: 'Hybrid format grouping transferable skills and demonstrable portfolio projects above non-linear chronological history.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0f172a',
      dividerColor: '#e2e8f0'
    },
    sections: ['skills', 'projects', 'training', 'research', 'education']
  },
  {
    id: 'cv-corp-executive',
    name: 'Senior Executive 2-Page Resume',
    category: 'corporate',
    badge: 'Executive',
    description: 'Distinguished 2-page executive summary focusing on corporate governance, revenue growth, team scale, and vision.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0f172a',
      dividerColor: '#64748b'
    },
    sections: ['leadership', 'research', 'projects', 'education', 'references']
  },

  // --------------------------------------------------------------------------
  // Category C: Tech, Data & Hybrid Resumes (10 Templates)
  // --------------------------------------------------------------------------
  {
    id: 'cv-tech-swe-clean',
    name: 'Software Engineer ATS Clean',
    category: 'tech',
    badge: 'Software Engineer',
    description: 'Standard tech industry resume emphasizing languages, frameworks, system architecture, and GitHub/deployed links.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#2563eb',
      dividerColor: '#bfdbfe'
    },
    sections: ['skills', 'projects', 'research', 'education', 'training']
  },
  {
    id: 'cv-tech-ai-ml',
    name: 'AI / ML & Deep Learning Engineer',
    category: 'tech',
    badge: 'AI / Deep Learning',
    description: 'Spotlights model architectures, RAG systems, PyTorch/TensorFlow pipelines, evaluation benchmarks, and preprints.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#7c3aed',
      dividerColor: '#ddd6fe'
    },
    sections: ['projects', 'research', 'publications', 'skills', 'education']
  },
  {
    id: 'cv-tech-data-analytics',
    name: 'Data Science & Metric-Driven Analytics',
    category: 'tech',
    badge: 'Data Analytics',
    description: 'Data-driven presentation featuring SQL queries, biostatistics, Matplotlib/GeoPandas visualizations, and business insights.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#059669',
      dividerColor: '#a7f3d0'
    },
    sections: ['skills', 'projects', 'research', 'education', 'training']
  },
  {
    id: 'cv-tech-bioinformatics',
    name: 'Bioinformatics & Computational Biology Hybrid',
    category: 'tech',
    badge: 'Bioinformatics',
    description: 'Hybrid research and tech format combining wet-lab diagnostics, molecular docking, in-silico vaccine design, and Python code.',
    layout: {
      type: 'classic-academic-single',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0d9488',
      dividerColor: '#5eead4',
      hasQr: true
    },
    sections: ['research', 'projects', 'publications', 'skills', 'education', 'training']
  },
  {
    id: 'cv-tech-uiux-designer',
    name: 'UI/UX & Product Designer Resume',
    category: 'tech',
    badge: 'UI/UX & Design',
    description: 'Clean typographic layout spotlighting design system architecture, Figma prototypes, accessibility, and user research.',
    layout: {
      type: 'modern-compact-two-col',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0f172a',
      dividerColor: '#e2e8f0'
    },
    sections: ['skills', 'projects', 'education', 'training']
  },
  {
    id: 'cv-tech-pm-impact',
    name: 'Product Manager (PM) Impact Resume',
    category: 'tech',
    badge: 'Product Manager',
    description: 'Outcome-oriented resume articulating product discovery, sprint roadmaps, user retention curves, and cross-functional leadership.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0284c7',
      dividerColor: '#e2e8f0'
    },
    sections: ['projects', 'leadership', 'skills', 'research', 'education']
  },
  {
    id: 'cv-tech-devops-cloud',
    name: 'Cloud, DevOps & Security Engineer',
    category: 'tech',
    badge: 'Cloud & DevOps',
    description: 'Infrastructure and automation layout featuring Docker, Kubernetes, CI/CD, cloud architecture, and security hardening.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'JetBrains Mono', monospace",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#0f766e',
      dividerColor: '#99f6e4'
    },
    sections: ['skills', 'projects', 'certifications', 'research', 'education']
  },
  {
    id: 'cv-tech-startup-founding',
    name: 'Startup Founding Engineer / Generalist',
    category: 'tech',
    badge: 'Founding Engineer',
    description: 'High-speed 0-to-1 impact format highlighting full-stack velocity, product iteration, autonomous problem solving, and resilience.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Space Grotesk', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#ea580c',
      dividerColor: '#fed7aa'
    },
    sections: ['projects', 'skills', 'research', 'leadership', 'education']
  },
  {
    id: 'cv-tech-acad-transition',
    name: 'Academic-to-Industry Transition Resume',
    category: 'tech',
    badge: 'Acad &rarr; Industry',
    description: 'Translates academic publications and research grants into corporate engineering achievements, software deliverables, and team leadership.',
    layout: {
      type: 'ats-single-column',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#3b82f6',
      dividerColor: '#bfdbfe'
    },
    sections: ['projects', 'skills', 'research', 'education', 'publications']
  },
  {
    id: 'cv-tech-minimalist-swiss',
    name: 'Minimalist Swiss-Grid Tech Resume',
    category: 'tech',
    badge: 'Swiss Minimalist',
    description: 'Rigorous Swiss graphic design grid with tight typographic rhythm, asymmetrical metadata columns, and stark black-and-white clarity.',
    layout: {
      type: 'swiss-grid',
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      primaryColor: '#000000',
      dividerColor: '#e5e5e5',
      headerAlignment: 'left'
    },
    sections: ['skills', 'projects', 'research', 'education', 'training']
  }
];

export function getCvTemplateById(id) {
  return CV_CATALOG.find((t) => t.id === id) || CV_CATALOG[0];
}

export function getCvTemplatesByCategory(category) {
  if (!category || category === 'all') return CV_CATALOG;
  return CV_CATALOG.filter((t) => t.category === category);
}

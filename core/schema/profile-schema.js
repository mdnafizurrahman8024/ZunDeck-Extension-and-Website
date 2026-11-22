export const SCHEMA_VERSION = 'ZunProfileV1';

export function createDefaultProfile() {
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      title: 'Md. Nafizur Rahman | Academic & Research Portfolio',
      description: 'DVM Student • One Health & AMR Researcher • Computational Biologist • Full-Stack Developer',
      lastModified: new Date().toISOString()
    },
    identity: {
      fullName: 'Md. Nafizur Rahman',
      shortName: 'Nafiz',
      roleBadge: 'Doctor of Veterinary Medicine (DVM)',
      tagline: 'DVM Student • One Health & AMR Researcher • Computational Biologist • Full-Stack Developer',
      bioParagraphs: [
        'My academic journey is built upon a strong foundation in Anatomy, Histology, Physiology, Pathology, Parasitology, Microbiology, Medicine, Surgery, Epidemiology, and Public Health.',
        'Throughout my journey, I have integrated traditional veterinary science with modern Data Analytics, developing proficiency in Python, SQL, and data visualization tools like GeoPandas and Matplotlib to drive evidence-based research.'
      ],
      avatar: 'ZUN.png',
      banner: 'Banner.png',
      quote: 'Knowledge. Investigation. Practice. Impact.',
      availabilityStatus: 'Open for Research Collaborations & Graduate Opportunities',
      location: {
        city: 'Rajshahi',
        country: 'Bangladesh',
        lat: 24.3745,
        lng: 88.6042,
        rawAddress: 'Faculty of Veterinary and Animal Sciences, University of Rajshahi, Rajshahi-6205, Bangladesh'
      },
      email: 'mdnafizurrahman8024@gmail.com',
      emailUniversity: 's2210968138@ru.ac.bd',
      phone: '+8801849288024',
      whatsapp: 'https://wa.me/8801849288024'
    },
    links: {
      scholar: 'https://scholar.google.com/citations?user=bImpEzMAAAAJ&hl=en',
      orcid: 'https://orcid.org/0009-0008-3918-187X',
      researchgate: 'https://www.researchgate.net/profile/Md-Rahman-1097',
      osf: 'https://doi.org/10.17605/OSF.IO/9AQS3',
      pubmed: '',
      scopus: '',
      github: 'https://github.com/mdnafizurrahman8024',
      linkedin: 'http://www.linkedin.com/in/md-nafizur-rahman-ru',
      googleSites: 'https://sites.google.com/view/md-nafizur-rahman/home',
      personalWebsite: 'https://mdnafizurrahman8024.github.io/',
      gmail: 'mailto:mdnafizurrahman8024@gmail.com',
      whatsapp: 'https://wa.me/8801849288024',
      facebook: 'https://www.facebook.com/mdnafizurrahman8024/',
      instagram: 'https://www.instagram.com/nafizun_8024',
      twitterX: '',
      kaggle: '',
      custom: []
    },
    metrics: [
      { value: '7+', label: 'Research Studies', sublabel: 'Surveillance & Meta-Analysis', target: '#research' },
      { value: '7+', label: 'Scientific Platforms', sublabel: 'AI Systems & Workbench', target: '#projects' },
      { value: '27+', label: 'Certifications', sublabel: 'WHO, Diagnostics & Analytics', target: '#training' },
      { value: '2+ Yrs', label: 'Field Experience', sublabel: 'Epidemiology & Triage', target: '#about' }
    ],
    education: [
      {
        id: 'edu-1',
        period: 'November 2022 – Present',
        degree: 'Doctor of Veterinary Medicine (DVM)',
        institution: 'Faculty of Veterinary and Animal Sciences, University of Rajshahi',
        badge: 'Level-4, Semester-2',
        details: 'Comprehensive clinical, paraclinical, and preclinical curriculum with focus on clinical pathology, epidemiology, and public health.',
        grade: '',
        gpa: '',
        highlights: ['Top quartile standing', 'Departmental research assistantship'],
        icon: 'fa-graduation-cap'
      }
    ],
    updates: [],
    research: [],
    projects: [],
    publications: [],
    skills: {
      clinical: {
        title: 'Veterinary Clinical & Wet-Lab',
        icon: 'fa-microscope',
        accent: 'blue',
        skills: []
      },
      computational: {
        title: 'Computational & Bioinformatics',
        icon: 'fa-laptop-code',
        accent: 'teal',
        skills: []
      }
    },
    certifications: [],
    leadership: [],
    volunteering: [],
    awards: [],
    hobbies: [
      { icon: '📸', title: 'Nature & Wildlife Photography', desc: 'Fauna and macro documentation' },
      { icon: '🍳', title: 'Culinary Art', desc: 'Regional Bengali cuisine' },
      { icon: '🦜', title: 'Wildlife Rescue (SWAN)', desc: 'Reptile and emergency avian rescue' },
      { icon: '✍️', title: 'Bengali Fiction & Poetry', desc: 'Creative writing' }
    ],
    references: [],
    gallery: [],
    documents: [],
    evidenceMedia: [],
    displayConfig: {
      sectionVisibility: {
        about: true,
        education: true,
        updates: true,
        research: true,
        projects: true,
        skills: true,
        publications: true,
        certifications: true,
        leadership: true,
        gallery: true,
        references: true,
        contact: true
      },
      sectionOrder: [
        'about',
        'education',
        'updates',
        'research',
        'projects',
        'skills',
        'publications',
        'certifications',
        'leadership',
        'gallery',
        'references',
        'contact'
      ],
      seeAllLimit: {
        research: 3,
        projects: 3,
        publications: 4,
        certifications: 6,
        gallery: 8,
        updates: 4
      },
      portfolioTemplateId: 'acad-flagship',
      themeTokens: {
        theme: 'dark',
        primaryColor: '#0d9488',
        accentColor: '#0ea5e9'
      },
      contactConfig: {
        showEmail: true,
        showLocation: true,
        showForm: false
      },
      seoMeta: {
        title: 'Md. Nafizur Rahman | Academic & Research Portfolio',
        description: 'Official academic portfolio of Md. Nafizur Rahman',
        author: 'Md. Nafizur Rahman',
        keywords: ['Veterinary Medicine', 'One Health', 'AMR', 'Bioinformatics']
      }
    },
    cvProfiles: [
      {
        id: 'cv-academic',
        name: 'Academic & Research Focus (ATS)',
        targetRole: 'Graduate Research Assistant / PhD Scholar',
        includedSections: ['education', 'research', 'publications', 'skills', 'certifications', 'references'],
        itemOverrides: {}
      },
      {
        id: 'cv-healthtech',
        name: 'HealthTech & Software Focus',
        targetRole: 'Computational Biologist / Full-Stack Engineer',
        includedSections: ['projects', 'skills', 'research', 'education', 'certifications'],
        itemOverrides: {}
      }
    ]
  };
}

export function validateProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object') {
    return { valid: false, errors: ['Profile must be an object'] };
  }
  if (!profile.identity || typeof profile.identity !== 'object') {
    errors.push('identity is required');
  } else {
    if (!profile.identity.fullName || typeof profile.identity.fullName !== 'string') {
      errors.push('identity.fullName is required');
    }
  }
  if (!profile.links || typeof profile.links !== 'object') {
    errors.push('links object is required');
  }
  if (!Array.isArray(profile.metrics)) {
    errors.push('metrics must be an array');
  }
  if (!profile.displayConfig || typeof profile.displayConfig !== 'object') {
    errors.push('displayConfig is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function normalizeProfile(raw) {
  const base = createDefaultProfile();
  if (!raw || typeof raw !== 'object') return base;

  return {
    ...base,
    ...raw,
    meta: { ...base.meta, ...(raw.meta || {}) },
    identity: { ...base.identity, ...(raw.identity || {}) },
    links: { ...base.links, ...(raw.links || {}) },
    metrics: Array.isArray(raw.metrics) ? raw.metrics : base.metrics,
    education: Array.isArray(raw.education) ? raw.education : base.education,
    updates: Array.isArray(raw.updates) ? raw.updates : (Array.isArray(raw.recentUpdates) ? raw.recentUpdates : base.updates),
    research: Array.isArray(raw.research) ? raw.research : (Array.isArray(raw.scientificResearch) ? raw.scientificResearch : base.research),
    projects: Array.isArray(raw.projects) ? raw.projects : (Array.isArray(raw.softwareProjects) ? raw.softwareProjects : base.projects),
    publications: Array.isArray(raw.publications) ? raw.publications : base.publications,
    skills: raw.skills && typeof raw.skills === 'object' ? raw.skills : (raw.capabilities || base.skills),
    certifications: Array.isArray(raw.certifications) ? raw.certifications : (Array.isArray(raw.certificates) ? raw.certificates : (Array.isArray(raw.trainings) ? raw.trainings : base.certifications)),
    leadership: Array.isArray(raw.leadership) ? raw.leadership : base.leadership,
    volunteering: Array.isArray(raw.volunteering) ? raw.volunteering : base.volunteering,
    awards: Array.isArray(raw.awards) ? raw.awards : base.awards,
    hobbies: Array.isArray(raw.hobbies) ? raw.hobbies : base.hobbies,
    references: Array.isArray(raw.references) ? raw.references : base.references,
    gallery: Array.isArray(raw.gallery) ? raw.gallery : base.gallery,
    documents: Array.isArray(raw.documents) ? raw.documents : base.documents,
    evidenceMedia: Array.isArray(raw.evidenceMedia) ? raw.evidenceMedia : base.evidenceMedia,
    displayConfig: {
      ...base.displayConfig,
      ...(raw.displayConfig || {}),
      sectionVisibility: {
        ...base.displayConfig.sectionVisibility,
        ...((raw.displayConfig && raw.displayConfig.sectionVisibility) || {})
      },
      seeAllLimit: {
        ...base.displayConfig.seeAllLimit,
        ...((raw.displayConfig && raw.displayConfig.seeAllLimit) || {})
      }
    },
    cvProfiles: Array.isArray(raw.cvProfiles) && raw.cvProfiles.length > 0 ? raw.cvProfiles : base.cvProfiles
  };
}

import fallbackData from './mother-fallback.json' with { type: 'json' };
import { normalizeProfile } from '../schema/profile-schema.js';

export const MOTHER_SITE_ORIGIN = 'https://mdnafizurrahman8024.github.io';
export const MOTHER_LIVE_DATA_URL = 'https://mdnafizurrahman8024.github.io/data/portfolio-data.json';

let cachedProfile = null;

export function resolveShowcaseMedia(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  const clean = pathOrUrl.replace(/^\.?\//, '');
  return `${MOTHER_SITE_ORIGIN}/${clean}`;
}

export function transformMotherJsonToProfile(src) {
  if (!src || !src.profile) {
    return normalizeProfile(fallbackData);
  }

  const profile = {
    schemaVersion: 'ZunProfileV1',
    meta: {
      title: src.meta?.title || 'Md. Nafizur Rahman | Academic & Research Portfolio',
      description: src.meta?.description || '',
      version: src.meta?.version || '2.2.0',
      lastUpdated: src.meta?.lastUpdated || new Date().toISOString().slice(0, 10),
      source: 'live-sync'
    },
    identity: {
      fullName: src.profile?.name || 'Md. Nafizur Rahman',
      shortName: 'Nafiz',
      salutation: src.profile?.salutation || 'Hi, This is Nafiz',
      roleBadge: src.profile?.designation || 'Doctor of Veterinary Medicine (DVM)',
      institution: src.profile?.institution || 'University of Rajshahi',
      dept: src.profile?.dept || 'Department of Veterinary and Animal Sciences',
      statusPills: src.profile?.statusPills || ['DVM Student (L-4, S-2)', 'One Health & AMR'],
      tagline: src.profile?.shortBio || '',
      bioParagraphs: src.about?.bioParagraphs || (src.about?.lead ? [src.about.lead] : []),
      avatar: resolveShowcaseMedia(src.profile?.avatar || 'ZUN.png'),
      introAvatar: resolveShowcaseMedia('Image-1.png'),
      navAvatar: resolveShowcaseMedia('Image-2.png'),
      banner: resolveShowcaseMedia(src.profile?.banner || 'Banner.png'),
      quote: src.profile?.motto || 'Knowledge. Investigation. Practice. Impact.',
      availabilityStatus: 'Open for Research Collaborations & Graduate Opportunities',
      location: {
        city: 'Rajshahi',
        country: 'Bangladesh',
        lat: 24.3745,
        lng: 88.6042,
        rawAddress: src.profile?.contact?.location || 'Rajshahi-6205, Bangladesh'
      },
      email: src.profile?.contact?.emailPrimary || 'mdnafizurrahman8024@gmail.com',
      emailUniversity: src.profile?.contact?.emailUniversity || 's2210968138@ru.ac.bd',
      phone: src.profile?.contact?.phone || '+8801849288024',
      whatsapp: src.profile?.contact?.whatsapp || 'https://wa.me/8801849288024'
    },
    links: {
      scholar: src.profile?.social?.scholar || '',
      orcid: src.profile?.social?.orcid || '',
      researchgate: src.profile?.social?.researchgate || '',
      osf: src.profile?.social?.osf || '',
      pubmed: '',
      scopus: '',
      github: src.profile?.social?.github || '',
      linkedin: src.profile?.social?.linkedin || '',
      googleSites: src.profile?.googleSitesUrl || '',
      personalWebsite: MOTHER_SITE_ORIGIN,
      gmail: `mailto:${src.profile?.contact?.emailPrimary || 'mdnafizurrahman8024@gmail.com'}`,
      whatsapp: src.profile?.contact?.whatsapp || '',
      facebook: src.profile?.social?.facebook || '',
      instagram: src.profile?.social?.instagram || '',
      twitterX: '',
      kaggle: '',
      custom: []
    },
    metrics: (src.kpis || []).map((k) => ({
      value: k.value,
      label: k.label,
      sublabel: k.sublabel,
      target: k.target
    })),
    education: (src.educationTimeline || []).map((e, i) => ({
      id: `edu-${i + 1}`,
      period: e.period,
      degree: e.degree,
      institution: e.institution,
      badge: e.badge,
      details: e.details,
      icon: e.icon || 'fa-solid fa-graduation-cap'
    })),
    updates: (src.recentUpdates || []).map((u, i) => ({
      id: u.id || `up-${i + 1}`,
      date: u.date,
      badge: u.badge,
      title: u.title,
      text: u.text,
      link: u.link
    })),
    research: (src.scientificResearch || []).map((r, i) => ({
      id: r.id || `res-${i + 1}`,
      title: r.title,
      institution: r.institution,
      period: r.period,
      role: r.role,
      badge: r.badge,
      category: r.category,
      summary: r.summary,
      tags: r.tags || [],
      link: r.link,
      images: (r.images || []).map((img) => resolveShowcaseMedia(img))
    })),
    projects: (src.softwareProjects || []).map((p, i) => ({
      id: p.id || `proj-${i + 1}`,
      title: p.title,
      category: p.category,
      badge: p.badge,
      description: p.description,
      tags: p.tags || [],
      linkDemo: p.liveUrl || p.link,
      linkCode: p.githubUrl || p.link,
      images: (p.images || []).map((img) => resolveShowcaseMedia(img))
    })),
    publications: (src.publications || []).map((pub, i) => ({
      id: pub.id || `pub-${i + 1}`,
      title: pub.title,
      authors: pub.authors,
      journal: pub.journal,
      year: pub.year,
      doi: pub.doi,
      link: pub.link,
      badge: pub.badge,
      category: pub.category,
      status: pub.status || 'published'
    })),
    skills: src.capabilities || {},
    certifications: (src.certificates || src.trainings || []).slice(0, 20).map((c, i) => ({
      id: c.id || `cert-${i + 1}`,
      title: c.title,
      issuer: c.issuer,
      date: c.date,
      badge: c.badge || 'Verified',
      credentialUrl: c.credentialUrl || c.link || '#',
      image: c.image ? resolveShowcaseMedia(c.image) : ''
    })),
    leadership: (src.leadership || []).map((l, i) => ({
      id: l.id || `lead-${i + 1}`,
      role: l.role,
      organization: l.organization,
      period: l.period,
      badge: l.badge,
      description: l.description
    })),
    volunteering: [
      {
        id: 'vol-1',
        role: 'Emergency Wildlife & Snake Rescuer',
        organization: 'Save Wildlife and Nature (SWAN), Bangladesh',
        period: '2025–Present',
        description: 'Responding to emergency rescue calls and human-wildlife coexistence education across Northern Bangladesh.'
      }
    ],
    awards: [
      {
        id: 'aw-1',
        title: 'Winner - AI Battle (Send a Little Hope UK)',
        issuer: 'AI Navigator Programme',
        year: '2026',
        description: 'PoultryMedix AI Platform recognized for real-time veterinary triage and AMR surveillance.'
      }
    ],
    hobbies: [
      { icon: '📸', title: 'Nature & Wildlife Photography', desc: 'Fauna and macro documentation' },
      { icon: '🍳', title: 'Culinary Art & Cooking', desc: 'Regional Bengali cuisine' },
      { icon: '🦜', title: 'Wildlife & Animal Rescue (SWAN)', desc: 'Reptile and emergency avian rescue' },
      { icon: '✍️', title: 'Bengali Fiction & Poetry', desc: 'Creative writing' }
    ],
    references: (src.references || []).map((ref, i) => ({
      id: ref.id || `ref-${i + 1}`,
      name: ref.name,
      designation: ref.designation,
      institution: ref.institution,
      email: ref.email,
      phone: ref.phone
    })),
    gallery: (src.gallery || []).slice(0, 16).map((g, i) => ({
      id: g.id || `gal-${i + 1}`,
      title: g.title,
      category: g.category,
      imageUrl: g.image ? resolveShowcaseMedia(g.image) : '',
      caption: g.caption || g.title
    })),
    documents: [
      {
        id: 'doc-1',
        title: 'Curriculum Vitae (CV) - Md. Nafizur Rahman',
        docType: 'pdf',
        url: resolveShowcaseMedia('CV_Nafiz.pdf'),
        date: 'Nov 2026',
        description: 'Comprehensive academic, clinical, and research CV'
      }
    ],
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
        description: 'Official academic portfolio of Md. Nafizur Rahman, Doctor of Veterinary Medicine (DVM) student at University of Rajshahi.',
        author: 'Md. Nafizur Rahman',
        keywords: ['Veterinary Medicine', 'One Health', 'AMR', 'Bioinformatics']
      }
    },
    cvProfiles: [
      {
        id: 'academic-cv',
        name: 'Academic & Research CV (ATS)',
        targetRole: 'PhD Candidate / Research Fellow',
        includedSections: ['education', 'research', 'publications', 'skills', 'certifications', 'references'],
        itemOverrides: {}
      },
      {
        id: 'healthtech-resume',
        name: 'HealthTech & Bioinformatics Resume',
        targetRole: 'Computational Biologist / Software Engineer',
        includedSections: ['projects', 'skills', 'research', 'education', 'certifications'],
        itemOverrides: {}
      }
    ]
  };

  return normalizeProfile(profile);
}

export function getMotherShowcaseFallback() {
  if (!cachedProfile) {
    cachedProfile = normalizeProfile(fallbackData);
  }
  return cachedProfile;
}

export async function fetchLiveMotherShowcase(timeoutMs = 3500) {
  if (typeof fetch !== 'function') {
    return getMotherShowcaseFallback();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(MOTHER_LIVE_DATA_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-cache'
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      cachedProfile = transformMotherJsonToProfile(data);
      return cachedProfile;
    }
  } catch {
    // Network unavailable or timed out; fall back cleanly
  } finally {
    clearTimeout(timer);
  }

  return getMotherShowcaseFallback();
}

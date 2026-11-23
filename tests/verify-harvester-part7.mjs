import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isNoiseLine,
  stripHtmlTags,
  sanitizeWebText,
  cleanTextLines,
  hashContent,
  deduplicateItems,
  filterElementNoise
} from '../core/parsers/noise-filter.js';

import {
  detectSiteType,
  parseLinkedInProfile,
  parseScholarProfile,
  parseOrcidProfile,
  parseGitHubProfile,
  parseGeneralWebpage,
  parseWebpageProfile
} from '../core/parsers/site-parsers.js';

import {
  parseCvTextToProfile
} from '../core/parsers/cv-file-parser.js';

import {
  normalizeStagedBatch,
  mergeStagedIntoProfile,
  renderStagingReviewHtml
} from '../core/ui/capture-staging-review.js';

import {
  renderCapturePanelHtml,
  CAPTURE_BUCKETS
} from '../core/ui/capture-panel.js';

import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

test('Noise filter identifies ads, sponsored content, and cookie banners', () => {
  const noiseExamples = [
    'Sponsored',
    'Promoted by Google',
    'Ad • www.example.com',
    'Accept all cookies',
    'Manage privacy settings',
    'We value your privacy',
    'People also viewed',
    'Pages that match your search',
    'Connect with John',
    'Follow company',
    'Send InMail',
    'Show more results...',
    '...see more',
    'Like • Comment • Repost • Send'
  ];

  for (const line of noiseExamples) {
    assert.strictEqual(
      isNoiseLine(line),
      true,
      `Expected "${line}" to be recognized as noise`
    );
  }
});

test('Noise filter preserves genuine academic, research and career content', () => {
  const legitExamples = [
    'Doctor of Veterinary Medicine (DVM)',
    'Chattogram Veterinary and Animal Sciences University',
    'Graduate Research Assistant, Laboratory of Zoonotic Virology',
    'Rabies virus whole-genome sequencing and molecular characterization',
    'Published in Veterinary Microbiology, Elsevier',
    'Proficient in Python, BLAST+, Nextstrain, and Biopython',
    'Dean\'s Honor Award for Academic Excellence'
  ];

  for (const line of legitExamples) {
    assert.strictEqual(
      isNoiseLine(line),
      false,
      `Expected legitimate text "${line}" NOT to be flagged as noise`
    );
  }
});

test('HTML sanitization strictly strips malicious tags and scripts while preserving text', () => {
  const dirty = '<div class="bio"><script>alert("hacked")</script>Senior <b>Biologist</b> &amp; Researcher<iframe src="evil.com"></iframe></div>';
  const cleaned = stripHtmlTags(dirty);

  assert.strictEqual(cleaned.includes('<script>'), false);
  assert.strictEqual(cleaned.includes('<iframe>'), false);
  assert.strictEqual(cleaned.includes('alert('), false);
  assert.strictEqual(cleaned.includes('Senior Biologist & Researcher'), true);
});

test('Content hashing and deduplication prevents redundant items', () => {
  const text1 = 'Graduate Research Assistant';
  const text2 = 'graduate research assistant';
  const text3 = 'Veterinary Epidemiologist';

  const hash1 = hashContent(text1);
  const hash2 = hashContent(text2);
  const hash3 = hashContent(text3);

  assert.strictEqual(hash1, hash2, 'Case-insensitive hashing should match');
  assert.notStrictEqual(hash1, hash3, 'Different texts must yield different hashes');

  const existingItems = [
    { title: 'Research Assistant', institution: 'CVASU' },
    { title: 'Lead Developer', institution: 'VetMedix' }
  ];
  const newItems = [
    { title: 'Research Assistant', institution: 'CVASU' }, // duplicate
    { title: 'Postdoctoral Fellow', institution: 'UCL' }    // new
  ];

  const deduped = deduplicateItems(existingItems, newItems);
  assert.strictEqual(deduped.length, 3, 'Duplicate item should not be appended');
  assert.strictEqual(deduped[2].title, 'Postdoctoral Fellow');
});

test('Site type detection accurately recognizes academic and professional domains', () => {
  assert.strictEqual(detectSiteType('https://www.linkedin.com/in/nafiz-rahman/'), 'linkedin');
  assert.strictEqual(detectSiteType('https://scholar.google.com/citations?user=xyz'), 'scholar');
  assert.strictEqual(detectSiteType('https://orcid.org/0009-0002-1825-0097'), 'orcid');
  assert.strictEqual(detectSiteType('https://www.researchgate.net/profile/Md-Rahman'), 'researchgate');
  assert.strictEqual(detectSiteType('https://github.com/mdnafizurrahman8024'), 'github');
  assert.strictEqual(detectSiteType('https://cvasu.ac.bd/faculty/member'), 'general');
});

test('CV Text Parser extracts structured fields from raw text', () => {
  const sampleCvText = `
Dr. Nafizur Rahman
Doctor of Veterinary Medicine & AI Researcher
Email: nafiz.vet@example.com
Phone: +880 1712 345678
LinkedIn: https://linkedin.com/in/nafiz-rahman
GitHub: https://github.com/nafiz-vet
ORCID: https://orcid.org/0009-0002-1825-0097

ABOUT
Dedicated veterinarian and computational biologist specializing in zoonotic surveillance and AI-driven clinical informatics.

EDUCATION
Doctor of Veterinary Medicine (DVM)
Chattogram Veterinary and Animal Sciences University, 2019 - 2024
CGPA: 3.85 / 4.00

RESEARCH & EXPERIENCE
Research Fellow in Molecular Virology
Institute of Biotechnology, 2023 - 2024
Conducted RT-PCR and next-generation sequencing for rabies pathogen surveillance.

PUBLICATIONS
Molecular epidemiology and phylogenetic analysis of rabies virus in Bangladesh.
Veterinary Microbiology, 2023. DOI: 10.1016/j.vetmic.2023.109823

CERTIFICATIONS
Bioinformatics Specialization, Johns Hopkins University, 2023

SKILLS
Python, Nextflow, BLAST+, R, Biopython, Clinical Pathology, Epidemiology
`;

  const parsed = parseCvTextToProfile(sampleCvText);

  assert.ok(parsed.identity.fullName.includes('Nafizur Rahman'));
  assert.strictEqual(parsed.identity.email, 'nafiz.vet@example.com');
  assert.strictEqual(parsed.identity.phone, '+880 1712 345678');
  assert.strictEqual(parsed.links.linkedin, 'https://linkedin.com/in/nafiz-rahman');
  assert.strictEqual(parsed.links.github, 'https://github.com/nafiz-vet');

  assert.strictEqual(parsed.education.length, 1);
  assert.ok(parsed.education[0].degree.includes('Doctor of Veterinary Medicine'));
  assert.ok(parsed.education[0].institution.includes('Chattogram Veterinary'));

  assert.strictEqual(parsed.research.length, 1);
  assert.ok(parsed.research[0].title.includes('Research Fellow'));

  assert.strictEqual(parsed.publications.length, 1);
  assert.ok(parsed.publications[0].title.includes('Molecular epidemiology'));
  assert.strictEqual(parsed.publications[0].doi, '10.1016/j.vetmic.2023.109823');

  assert.strictEqual(parsed.certifications.length, 1);
  assert.ok(parsed.certifications[0].title.includes('Bioinformatics'));

  assert.ok(parsed.skills.technical.skills.length >= 4);
});

test('Staging batch normalization and merge strategies (Append vs Fill-Empty)', () => {
  const stagedBatch = {
    candidateProfile: {
      identity: {
        fullName: 'Dr. Jane Smith',
        email: 'jane@example.com',
        roleBadge: 'Microbiologist'
      },
      education: [
        { degree: 'PhD in Microbiology', institution: 'Oxford University', period: '2016-2020' }
      ],
      skills: {
        technical: {
          skills: [{ name: 'CRISPR-Cas9' }, { name: 'Python' }]
        }
      }
    },
    items: [
      { section: 'publications', text: 'Genomic analysis of viral outbreaks, Nature, 2022' }
    ]
  };

  const staged = normalizeStagedBatch(stagedBatch);
  assert.strictEqual(staged.identity.fullName, 'Dr. Jane Smith');
  assert.strictEqual(staged.education.length, 1);
  assert.strictEqual(staged.publications.length, 1);
  assert.ok(staged.skills.includes('CRISPR-Cas9'));

  // Test 1: Append Strategy (adds new items, preserves existing)
  const baseProfile = JSON.parse(JSON.stringify(fallbackData));
  const origEduCount = baseProfile.education.length;

  const mergedAppend = mergeStagedIntoProfile(baseProfile, staged, 'append');
  assert.strictEqual(mergedAppend.education.length, origEduCount + 1);
  assert.strictEqual(mergedAppend.identity.fullName, 'Dr. Jane Smith');

  // Test 2: Fill-Empty Strategy (only fills empty fields, never overwrites populated ones)
  const baseWithExistingName = JSON.parse(JSON.stringify(fallbackData));
  baseWithExistingName.identity.fullName = 'Original Author';
  delete baseWithExistingName.identity.phone; // empty field

  const stagedWithPhone = {
    identity: { fullName: 'Overwriting Name', phone: '+1 800-555-0100' }
  };
  const mergedFillEmpty = mergeStagedIntoProfile(baseWithExistingName, stagedWithPhone, 'fill-empty');
  assert.strictEqual(mergedFillEmpty.identity.fullName, 'Original Author', 'Should not overwrite populated field');
  assert.strictEqual(mergedFillEmpty.identity.phone, '+1 800-555-0100', 'Should fill empty field');
});

test('UI rendering helpers generate valid, safe HTML with zero magic sparkles or slop', () => {
  // 1. Extension Capture Panel
  const extHtml = renderCapturePanelHtml({ isExtension: true, isRecording: true, counts: { total: 5, experience: 2, education: 1, publications: 2 } });
  assert.ok(extHtml.includes('Recording Natural Scroll'));
  assert.ok(extHtml.includes('Review Staged (5)'));
  assert.ok(extHtml.includes('btn-pause-scroll-capture'));
  assert.strictEqual(extHtml.includes('fa-wand-magic-sparkles'), false, 'Zero magic sparkles allowed');

  // 2. Web Companion Capture Panel (Manual / CV Dropzone mode)
  const webHtml = renderCapturePanelHtml({ isExtension: false });
  assert.ok(webHtml.includes('Drop your CV'));
  assert.ok(webHtml.includes('data-cv-dropzone="true"'));
  assert.ok(webHtml.includes('manual-paste-textarea'));

  // 3. Staging Review Modal
  const reviewHtml = renderStagingReviewHtml({
    identity: { fullName: 'Candidate Name' },
    education: [{ degree: 'B.Sc' }],
    skills: ['Genomics', 'Bioinformatics']
  });
  assert.ok(reviewHtml.includes('Staged Captured Content Review'));
  assert.ok(reviewHtml.includes('Append to Existing'));
  assert.ok(reviewHtml.includes('Fill Empty Fields Only'));
  assert.ok(reviewHtml.includes('An Undo checkpoint will be saved before merging'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTER_MODES, getLetterModeById, calculateLetterStats } from '../core/engines/letter-studio.js';
import {
  buildSopPrompt,
  buildMotivationPrompt,
  buildCoverLetterPrompt,
  buildColdEmailPrompt,
  buildPromptForMode,
  assembleOfflineDraft,
  verifyLetterAuthenticity
} from '../core/engines/letter-prompts.js';
import {
  renderLetterHtml,
  exportLetterDocx,
  exportLetterMarkdown,
  exportLetterPlainText
} from '../core/exporters/letter-exporter.js';
import {
  getWordCountProgress,
  createNewDraft,
  getParagraphAiPrompt
} from '../core/ui/letter-editor.js';
import fallbackData from '../core/data/mother-fallback.json' with { type: 'json' };

test('Letter studio defines 4 dedicated document modes with scaffolds and limits', () => {
  assert.equal(LETTER_MODES.length, 4);

  const sop = getLetterModeById('sop');
  assert.equal(sop.id, 'sop');
  assert.equal(sop.scaffold.length, 5);
  assert.ok(sop.targetWordCount.min >= 700);

  const motivation = getLetterModeById('motivation');
  assert.equal(motivation.id, 'motivation');
  assert.equal(motivation.scaffold.length, 4);

  const cover = getLetterModeById('cover-letter');
  assert.equal(cover.id, 'cover-letter');

  const coldEmail = getLetterModeById('cold-email');
  assert.equal(coldEmail.id, 'cold-email');
  assert.equal(coldEmail.scaffold.length, 5);
  assert.ok(coldEmail.targetWordCount.recommended <= 200);
});

test('calculateLetterStats accurately counts words, characters, and reading time', () => {
  const sample = 'The growing convergence of zoonotic pathogen transmission and antimicrobial resistance presents critical challenges.';
  const stats = calculateLetterStats(sample);

  assert.equal(stats.words, 13);
  assert.ok(stats.characters > 100);
  assert.equal(stats.readingTimeMinutes, 1);

  const emptyStats = calculateLetterStats('');
  assert.equal(emptyStats.words, 0);
  assert.equal(emptyStats.characters, 0);
});

test('getWordCountProgress categorizes word counts against targets with appropriate tags', () => {
  const under = getWordCountProgress(200, 'sop');
  assert.equal(under.status, 'under');
  assert.ok(under.percentage < 50);

  const optimal = getWordCountProgress(850, 'sop');
  assert.equal(optimal.status, 'optimal');

  const over = getWordCountProgress(1200, 'sop');
  assert.equal(over.status, 'over');
  assert.ok(over.label.includes('over target limit'));
});

test('assembleOfflineDraft generates factually grounded drafts for all 4 modes', () => {
  const target = {
    institution: 'University of Copenhagen',
    program: 'MSc in One Health',
    professor: 'Prof. Henrik Nielsen',
    focusArea: 'Genomic AMR Surveillance'
  };

  for (const mode of LETTER_MODES) {
    const draft = assembleOfflineDraft(fallbackData, mode.id, target);
    assert.equal(draft.modeId, mode.id);
    assert.ok(draft.subject, `Mode ${mode.id} missing subject`);
    assert.ok(Array.isArray(draft.paragraphs), `Mode ${mode.id} paragraphs not array`);
    assert.ok(draft.paragraphs.length >= 3, `Mode ${mode.id} insufficient paragraphs`);
    assert.ok(draft.signoff, `Mode ${mode.id} missing signoff`);

    const fullText = draft.paragraphs.join(' ');
    // Must contain candidate degree & university
    assert.ok(fullText.includes('Doctor of Veterinary Medicine') || fullText.includes('DVM'));
    assert.ok(fullText.includes('University of Rajshahi'));
    // Must contain user input needed placeholders
    assert.ok(fullText.includes('[USER INPUT NEEDED:'));
  }
});

test('verifyLetterAuthenticity checks factual consistency and catches fabrications', () => {
  const target = { institution: 'Karolinska Institute', program: 'PhD in Medical Science' };
  const authenticDraft = assembleOfflineDraft(fallbackData, 'sop', target);
  const fullText = authenticDraft.paragraphs.join('\n');

  const authReport = verifyLetterAuthenticity(fullText, fallbackData);
  assert.equal(authReport.authentic, true);
  assert.ok(authReport.verifiedMentions.length >= 3);
  assert.ok(authReport.placeholdersCount >= 1);
  assert.equal(authReport.warnings.length, 0);

  // Injected fabrication
  const fabricatedText = fullText + '\nDuring my undergraduate degree I maintained a GPA 4.0 and published in Nature Medicine.';
  const warnReport = verifyLetterAuthenticity(fabricatedText, fallbackData);
  assert.equal(warnReport.authentic, false);
  assert.ok(warnReport.warnings.length >= 2, 'Must flag GPA 4.0 and Nature Medicine');
});

test('exportLetterDocx produces valid OpenXML Word archive with letter content', () => {
  const target = { institution: 'University of Oxford', program: 'DPhil in Zoology' };
  const draft = assembleOfflineDraft(fallbackData, 'sop', target);

  const docxBuf = exportLetterDocx({
    sender: {
      name: fallbackData.identity.fullName,
      role: fallbackData.education[0].degree,
      institution: fallbackData.education[0].institution,
      email: fallbackData.identity.email,
      location: 'Rajshahi, Bangladesh'
    },
    recipient: {
      name: 'Admissions Committee',
      institution: 'University of Oxford'
    },
    date: 'November 23, 2026',
    subject: draft.subject,
    paragraphs: draft.paragraphs,
    signoff: draft.signoff,
    showLetterhead: true
  });

  assert.ok(Buffer.isBuffer(docxBuf));
  assert.ok(docxBuf.length > 500);
  assert.equal(docxBuf.readUInt32LE(0), 0x04034b50); // PK\x03\x04
  const str = docxBuf.toString('latin1');
  assert.ok(str.includes('word/document.xml'));
  assert.ok(str.includes('[Content_Types].xml'));
});

test('exportLetterMarkdown and exportLetterPlainText generate clean outputs', () => {
  const data = {
    sender: { name: 'Md. Nafizur Rahman', role: 'DVM', institution: 'University of Rajshahi', email: 'test@example.com' },
    recipient: { name: 'Prof. X', institution: 'Lab Y' },
    date: 'November 23, 2026',
    subject: 'Inquiry regarding Graduate Position',
    paragraphs: ['First paragraph of research alignment.', 'Second paragraph of computational methodology.'],
    signoff: 'Best regards,\nMd. Nafizur Rahman',
    showLetterhead: true
  };

  const md = exportLetterMarkdown(data);
  assert.ok(md.includes('# Md. Nafizur Rahman'));
  assert.ok(md.includes('**Subject: Inquiry regarding Graduate Position**'));
  assert.ok(md.includes('First paragraph of research alignment.'));

  const txt = exportLetterPlainText(data);
  assert.ok(txt.includes('Md. Nafizur Rahman'));
  assert.ok(txt.includes('Subject: Inquiry regarding Graduate Position'));
  assert.ok(txt.includes('Best regards,'));
});

test('renderLetterHtml escapes XSS vectors and formats printable A4 sheet', () => {
  const malicious = {
    sender: { name: '<script>alert(1)</script>Dr. Test', role: 'Researcher' },
    recipient: { name: '<b>Dean</b>' },
    date: '2026-11-23',
    subject: '<img src=x onerror=alert(2)>Subject',
    paragraphs: ['Clean paragraph with [USER INPUT NEEDED: Add detail].'],
    signoff: 'Sincerely,',
    showLetterhead: true
  };

  const html = renderLetterHtml(malicious);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<img src=x onerror=alert(2)>'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(2)&gt;'));
  assert.ok(html.includes('letter-placeholder-pill'));
  assert.ok(html.includes('@media print'));
});

test('createNewDraft and getParagraphAiPrompt work seamlessly', () => {
  const draft = createNewDraft('sop', 'Custom SOP Draft', { institution: 'ETH Zurich' });
  assert.ok(draft.id.startsWith('draft_'));
  assert.equal(draft.modeId, 'sop');
  assert.equal(draft.targetDetails.institution, 'ETH Zurich');

  const prompt = getParagraphAiPrompt('During my clinical rotations, I collected 150 samples.', 'polish');
  assert.ok(prompt.includes('Polish this paragraph'));
  assert.ok(prompt.includes('System Rule: Zero fabrication'));
  assert.ok(prompt.includes('150 samples'));
});

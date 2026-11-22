import { buildZip, xmlEscape } from './docx-exporter.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderLetterHtml(letterData = {}) {
  const {
    sender = {},
    recipient = {},
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    subject = '',
    paragraphs = [],
    signoff = 'Sincerely,',
    showLetterhead = true,
    modeId = 'sop'
  } = letterData;

  const senderName = escapeHtml(sender.name || 'Md. Nafizur Rahman');
  const senderRole = escapeHtml(sender.role || 'Doctor of Veterinary Medicine (DVM)');
  const senderInst = escapeHtml(sender.institution || 'University of Rajshahi');
  const senderEmail = escapeHtml(sender.email || 'mdnafizurrahman8024@gmail.com');
  const senderPhone = escapeHtml(sender.phone || '');
  const senderLocation = escapeHtml(sender.location || 'Rajshahi, Bangladesh');
  const senderWebsite = escapeHtml(sender.website || 'https://mdnafizurrahman8024.github.io/');

  const recipientName = escapeHtml(recipient.name || '');
  const recipientTitle = escapeHtml(recipient.title || '');
  const recipientInst = escapeHtml(recipient.institution || '');
  const recipientAddress = escapeHtml(recipient.address || '');

  const renderedParagraphs = paragraphs.map((p) => {
    const raw = String(p).trim();
    if (!raw) return '';
    // Highlight [USER INPUT NEEDED: ...] in amber badge
    const withBadges = escapeHtml(raw).replace(
      /\[USER INPUT NEEDED:([^\]]+)\]/g,
      '<span class="letter-placeholder-pill"><i class="fa-solid fa-pen-to-square"></i> [USER INPUT NEEDED:$1]</span>'
    );
    // Format bullet points if paragraph starts with • or lists
    if (withBadges.includes('\n•') || withBadges.startsWith('•')) {
      const lines = withBadges.split('\n');
      return `<div class="letter-bullet-block">${lines.map((l) => `<p class="letter-bullet-line">${l}</p>`).join('')}</div>`;
    }
    return `<p class="letter-para">${withBadges}</p>`;
  }).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject || 'Document Draft')} — ${senderName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    :root {
      --font-body: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --color-text: #1e293b;
      --color-muted: #64748b;
      --color-accent: #0d9488;
      --color-border: #e2e8f0;
      --color-card-bg: #ffffff;
      --color-page-bg: #f8fafc;
      --color-placeholder-bg: #fef3c7;
      --color-placeholder-border: #f59e0b;
      --color-placeholder-text: #92400e;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-body);
      background-color: var(--color-page-bg);
      color: var(--color-text);
      line-height: 1.65;
      font-size: 14.5px;
      padding: 32px 16px;
      display: flex;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }

    .letter-page {
      width: 100%;
      max-width: 820px;
      min-height: 1050px;
      background: var(--color-card-bg);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08);
      padding: 56px 64px;
      position: relative;
    }

    /* Professional Letterhead */
    .letterhead {
      border-bottom: 2px solid var(--color-accent);
      padding-bottom: 20px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
    }

    .letterhead-sender-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      line-height: 1.2;
    }

    .letterhead-sender-sub {
      font-size: 13.5px;
      color: var(--color-muted);
      margin-top: 4px;
      font-weight: 500;
    }

    .letterhead-contact {
      text-align: right;
      font-size: 12.5px;
      color: var(--color-muted);
      line-height: 1.6;
    }

    .letterhead-contact a {
      color: var(--color-accent);
      text-decoration: none;
    }

    /* Metadata & Recipient */
    .letter-meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      font-size: 13.5px;
      color: var(--color-muted);
      font-weight: 500;
    }

    .recipient-block {
      margin-bottom: 24px;
      font-size: 14px;
      line-height: 1.5;
    }

    .recipient-name { font-weight: 700; color: #0f172a; }

    /* Subject line */
    .letter-subject-line {
      font-size: 15.5px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 1px dashed var(--color-border);
      letter-spacing: -0.01em;
    }

    /* Paragraphs */
    .letter-para {
      margin-bottom: 16px;
      text-align: justify;
      hyphens: auto;
    }

    .letter-bullet-block {
      margin: 12px 0 16px 8px;
    }

    .letter-bullet-line {
      margin-bottom: 8px;
      line-height: 1.55;
    }

    /* Placeholder Badge */
    .letter-placeholder-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--color-placeholder-bg);
      border: 1px solid var(--color-placeholder-border);
      color: var(--color-placeholder-text);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 600;
    }

    /* Signoff block */
    .letter-signoff {
      margin-top: 36px;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-line;
      color: #0f172a;
    }

    .letter-signoff-name {
      font-weight: 700;
      color: #0f172a;
      margin-top: 12px;
    }

    /* Print Styles */
    @media print {
      @page {
        size: A4;
        margin: 18mm 16mm;
      }
      body {
        background: #ffffff;
        padding: 0;
      }
      .letter-page {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
        min-height: auto;
      }
      .letter-placeholder-pill {
        border: 1px dashed #92400e;
      }
    }

    @media (max-width: 768px) {
      body { padding: 12px 8px; }
      .letter-page { padding: 28px 20px; }
      .letterhead { flex-direction: column; align-items: flex-start; }
      .letterhead-contact { text-align: left; }
    }
  </style>
</head>
<body>
  <div class="letter-page">
    ${showLetterhead ? `
    <header class="letterhead">
      <div class="letterhead-sender">
        <h1 class="letterhead-sender-title">${senderName}</h1>
        <div class="letterhead-sender-sub">${senderRole} &bull; ${senderInst}</div>
      </div>
      <div class="letterhead-contact">
        <div>${senderEmail} ${senderPhone ? `&bull; ${senderPhone}` : ''}</div>
        <div>${senderLocation}</div>
        <div><a href="${senderWebsite}" target="_blank">${senderWebsite.replace('https://', '')}</a></div>
      </div>
    </header>` : ''}

    <div class="letter-meta-row">
      <span>${escapeHtml(date)}</span>
      ${modeId === 'cold-email' ? '<span style="font-weight:600; color:var(--color-accent);"><i class="fa-solid fa-envelope"></i> Outreach Email Draft</span>' : ''}
    </div>

    ${(recipientName || recipientInst) ? `
    <div class="recipient-block">
      ${recipientName ? `<div class="recipient-name">${recipientName}</div>` : ''}
      ${recipientTitle ? `<div>${recipientTitle}</div>` : ''}
      ${recipientInst ? `<div>${recipientInst}</div>` : ''}
      ${recipientAddress ? `<div>${recipientAddress}</div>` : ''}
    </div>` : ''}

    ${subject ? `<div class="letter-subject-line">${escapeHtml(subject)}</div>` : ''}

    <div class="letter-content-body">
      ${renderedParagraphs}
    </div>

    <div class="letter-signoff">
      ${escapeHtml(signoff)}
    </div>
  </div>
</body>
</html>`;
}

export function exportLetterDocx(letterData = {}) {
  const {
    sender = {},
    recipient = {},
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    subject = '',
    paragraphs = [],
    signoff = 'Sincerely,',
    showLetterhead = true
  } = letterData;

  const senderName = xmlEscape(sender.name || 'Md. Nafizur Rahman');
  const senderRole = xmlEscape(sender.role || 'Doctor of Veterinary Medicine (DVM)');
  const senderInst = xmlEscape(sender.institution || 'University of Rajshahi');
  const senderEmail = xmlEscape(sender.email || 'mdnafizurrahman8024@gmail.com');
  const senderLocation = xmlEscape(sender.location || 'Rajshahi, Bangladesh');

  const pXmlNodes = [];

  if (showLetterhead) {
    pXmlNodes.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="0" w:after="40"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="0F172A"/></w:rPr>
          <w:t>${senderName}</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr>
          <w:pBdr>
            <w:bottom w:val="single" w:sz="12" w:space="8" w:color="0D9488"/>
          </w:pBdr>
          <w:spacing w:before="0" w:after="280"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:sz w:val="19"/><w:color w:val="64748B"/></w:rPr>
          <w:t>${senderRole}  |  ${senderInst}  |  ${senderEmail}  |  ${senderLocation}</w:t>
        </w:r>
      </w:p>
    `);
  }

  // Date
  pXmlNodes.push(`
    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="160"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="21"/><w:color w:val="475569"/></w:rPr>
        <w:t>${xmlEscape(date)}</w:t>
      </w:r>
    </w:p>
  `);

  // Recipient
  if (recipient.name || recipient.institution) {
    pXmlNodes.push(`
      <w:p>
        <w:pPr><w:spacing w:before="60" w:after="20"/></w:pPr>
        <w:r>
          <w:rPr><w:b/><w:sz w:val="21"/></w:rPr>
          <w:t>${xmlEscape(recipient.name || 'Admissions / Hiring Committee')}</w:t>
        </w:r>
      </w:p>
      ${recipient.institution ? `
      <w:p>
        <w:pPr><w:spacing w:before="0" w:after="140"/></w:pPr>
        <w:r>
          <w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr>
          <w:t>${xmlEscape(recipient.institution)}</w:t>
        </w:r>
      </w:p>` : ''}
    `);
  }

  // Subject
  if (subject) {
    pXmlNodes.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="140" w:after="180"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="0F172A"/></w:rPr>
          <w:t>${xmlEscape(subject)}</w:t>
        </w:r>
      </w:p>
    `);
  }

  // Body paragraphs
  for (const p of paragraphs) {
    const raw = String(p).trim();
    if (!raw) continue;
    pXmlNodes.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="100" w:after="140" w:line="300" w:lineRule="auto"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:sz w:val="21"/></w:rPr>
          <w:t xml:space="preserve">${xmlEscape(raw)}</w:t>
        </w:r>
      </w:p>
    `);
  }

  // Signoff
  pXmlNodes.push(`
    <w:p>
      <w:pPr><w:spacing w:before="240" w:after="40"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="21"/></w:rPr>
        <w:t xml:space="preserve">${xmlEscape(signoff)}</w:t>
      </w:r>
    </w:p>
  `);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pXmlNodes.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  return buildZip([
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: relsXml },
    { name: 'word/_rels/document.xml.rels', data: wordRelsXml },
    { name: 'word/document.xml', data: documentXml }
  ]);
}

export function exportLetterMarkdown(letterData = {}) {
  const {
    sender = {},
    recipient = {},
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    subject = '',
    paragraphs = [],
    signoff = 'Sincerely,',
    showLetterhead = true
  } = letterData;

  const lines = [];

  if (showLetterhead) {
    lines.push(`# ${sender.name || 'Md. Nafizur Rahman'}`);
    lines.push(`**${sender.role || 'Doctor of Veterinary Medicine (DVM)'}** | ${sender.institution || 'University of Rajshahi'}`);
    lines.push(`Email: ${sender.email || 'mdnafizurrahman8024@gmail.com'} | Location: ${sender.location || 'Rajshahi, Bangladesh'}`);
    lines.push(`Portfolio: ${sender.website || 'https://mdnafizurrahman8024.github.io/'}`);
    lines.push('---');
    lines.push('');
  }

  lines.push(`**Date:** ${date}`);
  lines.push('');

  if (recipient.name || recipient.institution) {
    lines.push(`**To:** ${recipient.name || 'Admissions / Hiring Committee'}`);
    if (recipient.institution) lines.push(`**Institution:** ${recipient.institution}`);
    lines.push('');
  }

  if (subject) {
    lines.push(`**Subject: ${subject}**`);
    lines.push('');
  }

  for (const p of paragraphs) {
    const raw = String(p).trim();
    if (raw) {
      lines.push(raw);
      lines.push('');
    }
  }

  lines.push(signoff);

  return lines.join('\n');
}

export function exportLetterPlainText(letterData = {}) {
  const {
    sender = {},
    recipient = {},
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    subject = '',
    paragraphs = [],
    signoff = 'Sincerely,',
    showLetterhead = false
  } = letterData;

  const lines = [];

  if (showLetterhead) {
    lines.push(`${sender.name || 'Md. Nafizur Rahman'}`);
    lines.push(`${sender.role || 'Doctor of Veterinary Medicine (DVM)'} — ${sender.institution || 'University of Rajshahi'}`);
    lines.push(`Email: ${sender.email || 'mdnafizurrahman8024@gmail.com'} | ${sender.location || 'Rajshahi, Bangladesh'}`);
    lines.push('--------------------------------------------------');
  }

  if (date) lines.push(`Date: ${date}`);
  if (recipient.name || recipient.institution) {
    lines.push(`To: ${recipient.name || ''} ${recipient.institution ? `(${recipient.institution})` : ''}`.trim());
  }
  if (subject) {
    lines.push(`Subject: ${subject}`);
    lines.push('');
  }

  for (const p of paragraphs) {
    const raw = String(p).trim();
    if (raw) {
      lines.push(raw);
      lines.push('');
    }
  }

  lines.push(signoff);

  return lines.join('\n');
}

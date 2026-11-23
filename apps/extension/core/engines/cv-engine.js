import { getCvTemplateById } from '../templates/cv-catalog.js';
import { escapeHtml, sanitizeUrl } from '../security/index.js';
import { generateQrSvg } from '../utils/qr-generator.js';
import { VECTOR_PRINT_CSS } from '../exporters/pdf-print-exporter.js';

export function renderCvHtml(profile, options = {}) {
  const templateId = options.templateId || 'cv-acad-flagship';
  const template = getCvTemplateById(templateId);
  const layout = { ...template.layout, ...(options.layoutOverrides || {}) };

  const identity = profile.identity || {};
  const links = profile.links || {};
  const education = Array.isArray(profile.education) ? profile.education : [];
  const research = Array.isArray(profile.research) ? profile.research : [];
  const publications = Array.isArray(profile.publications) ? profile.publications : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const skills = profile.skills || {};
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const leadership = Array.isArray(profile.leadership) ? profile.leadership : [];
  const volunteering = Array.isArray(profile.volunteering) ? profile.volunteering : [];
  const awards = Array.isArray(profile.awards) ? profile.awards : [];
  const references = Array.isArray(profile.references) ? profile.references : [];

  const showQr = options.showQr !== undefined ? options.showQr : (layout.hasQr !== false);
  const qrTarget = options.qrTarget || links.personalWebsite || 'https://mdnafizurrahman8024.github.io/';
  const qrSvg = showQr ? generateQrSvg(qrTarget, { size: 76, color: layout.primaryColor || '#0d9488' }) : '';

  // Filter sections if specified by a multi-CV profile
  const includedSections = options.includedSections || template.sections || [
    'education', 'research', 'publications', 'projects', 'training', 'awards', 'leadership', 'references'
  ];
  const isSecActive = (secKey) => includedSections.includes(secKey);

  // Verified links bar
  const verifiedLinksArray = [
    links.linkedin ? `<a href="${sanitizeUrl(links.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : '',
    links.orcid ? `<a href="${sanitizeUrl(links.orcid)}" target="_blank" rel="noopener">ORCID</a>` : '',
    links.researchgate ? `<a href="${sanitizeUrl(links.researchgate)}" target="_blank" rel="noopener">ResearchGate</a>` : '',
    links.scholar ? `<a href="${sanitizeUrl(links.scholar)}" target="_blank" rel="noopener">Google Scholar</a>` : '',
    links.osf ? `<a href="${sanitizeUrl(links.osf)}" target="_blank" rel="noopener">OSF Protocol</a>` : '',
    links.github ? `<a href="${sanitizeUrl(links.github)}" target="_blank" rel="noopener">GitHub</a>` : '',
    links.personalWebsite ? `<a href="${sanitizeUrl(links.personalWebsite)}" target="_blank" rel="noopener">Portfolio</a>` : ''
  ].filter(Boolean);

  const isEuropass = template.id === 'cv-acad-europass' || layout.type === 'europass-split';
  const isClassicAcademic = layout.type === 'classic-academic-single' || template.id === 'cv-acad-flagship';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(identity.fullName || 'Curriculum Vitae')} — ${escapeHtml(template.name)}</title>

  <!-- Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <style>
    :root {
      --primary: ${layout.primaryColor || '#0d9488'};
      --divider: ${layout.dividerColor || '#0d9488'};
      --accent: ${layout.accentColor || '#0284c7'};
      --font-heading: ${layout.fontHeading || "'Inter', sans-serif"};
      --font-body: ${layout.fontBody || "'Inter', sans-serif"};
      --font-mono: "'JetBrains Mono', monospace";
      --text-main: #0f172a;
      --text-sub: #334155;
      --text-muted: #64748b;
      --bg-page: #f8fafc;
      --bg-sheet: #ffffff;
      --sheet-width: 210mm;
      --sheet-min-height: 297mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-page);
      color: var(--text-main);
      font-family: var(--font-body);
      font-size: 10.5pt;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
      display: flex;
      justify-content: center;
      padding: 24px 12px;
    }

    /* Standard A4 Paper Sheet Frame */
    .cv-sheet-container {
      width: var(--sheet-width);
      min-height: var(--sheet-min-height);
      background: var(--bg-sheet);
      padding: 14mm 16mm 16mm 16mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;
    }

    /* Header Layout */
    .cv-header-wrap {
      position: relative;
      margin-bottom: 14px;
      ${layout.headerAlignment === 'center' ? 'text-align: center;' : 'text-align: left;'}
    }

    .cv-qr-corner {
      position: absolute;
      top: 0;
      right: 0;
      text-align: center;
    }
    .cv-qr-label {
      font-size: 6.5pt;
      font-family: var(--font-mono);
      color: var(--text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cv-name-title {
      font-family: var(--font-heading);
      font-size: 19pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      line-height: 1.2;
      margin-bottom: 3px;
    }

    .cv-inst-line {
      font-size: 10pt;
      color: var(--text-sub);
      font-weight: 500;
      margin-bottom: 4px;
    }

    .cv-contact-row {
      font-size: 8.8pt;
      color: var(--text-muted);
      margin-bottom: 5px;
    }
    .cv-contact-row a {
      color: var(--text-sub);
      text-decoration: none;
    }
    .cv-contact-row a:hover {
      color: var(--primary);
    }

    .cv-links-row {
      font-size: 8.5pt;
      display: flex;
      flex-wrap: wrap;
      ${layout.headerAlignment === 'center' ? 'justify-content: center;' : 'justify-content: flex-start;'}
      gap: 10px;
    }
    .cv-links-row a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .cv-links-row a:hover {
      text-decoration: underline;
    }

    /* Section Headings */
    .cv-section-block {
      margin-top: 14px;
    }

    .cv-section-title {
      font-family: var(--font-heading);
      font-size: 11.5pt;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1.5px solid var(--divider);
      padding-bottom: 3px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Item Entries */
    .cv-entry-item {
      margin-bottom: 10px;
    }

    .cv-entry-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 2px;
    }

    .cv-entry-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: var(--text-main);
    }

    .cv-entry-date {
      font-size: 9pt;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
      text-align: right;
    }

    .cv-entry-sub {
      font-size: 9.5pt;
      font-weight: 500;
      font-style: italic;
      color: var(--text-sub);
      margin-bottom: 3px;
    }

    .cv-entry-desc {
      font-size: 9.2pt;
      color: var(--text-sub);
      line-height: 1.45;
    }

    .cv-entry-bullets {
      list-style-type: disc;
      margin-left: 18px;
      margin-top: 2px;
      font-size: 9.2pt;
      color: var(--text-sub);
    }
    .cv-entry-bullets li {
      margin-bottom: 2px;
      line-height: 1.4;
    }

    /* Publications List */
    .cv-pub-item {
      margin-bottom: 7px;
      font-size: 9.2pt;
      line-height: 1.4;
    }
    .cv-pub-badge {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      background: rgba(13, 148, 136, 0.12);
      color: var(--primary);
      padding: 1px 5px;
      border-radius: 3px;
      display: inline-block;
      margin-right: 4px;
    }
    .cv-pub-doi {
      font-family: var(--font-mono);
      font-size: 8pt;
      color: var(--text-muted);
    }

    /* Europass 2-Column Grid Specifics */
    ${isEuropass ? `
    .europass-grid-layout {
      display: grid;
      grid-template-columns: 60mm minmax(0, 1fr);
      gap: 16px;
      margin-top: 10px;
    }
    .europass-side-col {
      border-right: 1px solid #e2e8f0;
      padding-right: 14px;
    }
    .europass-main-col {
      padding-left: 4px;
    }
    .cefr-grid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-top: 6px;
    }
    .cefr-grid-table th, .cefr-grid-table td {
      border: 1px solid #cbd5e1;
      padding: 3px 4px;
      text-align: center;
    }
    .cefr-grid-table th {
      background: #f1f5f9;
      font-weight: 600;
    }
    ` : ''}

    /* References Grid */
    .cv-ref-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
      margin-top: 6px;
    }
    .cv-ref-card {
      font-size: 9pt;
      line-height: 1.4;
    }
    .cv-ref-name {
      font-weight: 700;
      color: var(--text-main);
    }
    .cv-ref-sub {
      color: var(--text-muted);
    }

    /* Responsive Mobile Sheet Scaling */
    @media (max-width: 768px) {
      body {
        padding: 8px 4px;
      }
      .cv-sheet-container {
        width: 100% !important;
        min-height: auto !important;
        padding: 14px 12px !important;
        box-shadow: none !important;
      }
      .cv-entry-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .cv-entry-date {
        text-align: left;
      }
      .cv-qr-corner {
        position: static;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      ${isEuropass ? `
      .europass-grid-layout {
        display: flex;
        flex-direction: column;
      }
      .europass-side-col {
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        padding-right: 0;
        padding-bottom: 12px;
      }
      ` : ''}
      .cv-ref-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Vector Print Integration */
    ${VECTOR_PRINT_CSS}
  </style>
</head>
<body>

  <main class="cv-sheet-container" id="cv-root">

    <!-- Top Header -->
    <header class="cv-header-wrap">
      ${showQr && qrSvg ? `
        <div class="cv-qr-corner">
          ${qrSvg}
          <div class="cv-qr-label">Live Evidence</div>
        </div>
      ` : ''}

      ${(options.showPhoto && (identity.cvPhoto || identity.avatar)) ? `
        <div class="cv-photo-corner" style="position: absolute; top: 0; right: ${showQr && qrSvg ? '95px' : '0'};">
          <img src="${sanitizeUrl(identity.cvPhoto || identity.avatar)}" alt="${escapeHtml(identity.fullName || 'Photo')}" style="width: 65px; height: 78px; object-fit: cover; border-radius: 4px; border: 1px solid var(--divider); display: block;" onerror="this.onerror=null; this.src='assets/ZUN.png';">
        </div>
      ` : ''}

      <h1 class="cv-name-title">${escapeHtml(identity.fullName || 'Md. Nafizur Rahman')}</h1>
      <div class="cv-inst-line">${escapeHtml(identity.institution || identity.roleBadge || '')}</div>

      <div class="cv-contact-row">
        ${identity.email ? `<span>Email: <a href="mailto:${escapeHtml(identity.email)}">${escapeHtml(identity.email)}</a></span>` : ''}
        ${identity.emailUniversity ? ` &bull; <span><a href="mailto:${escapeHtml(identity.emailUniversity)}">${escapeHtml(identity.emailUniversity)}</a></span>` : ''}
        ${identity.phone ? ` &bull; <span>Cell: ${escapeHtml(identity.phone)}</span>` : ''}
        ${identity.location?.rawAddress || identity.location?.city ? ` &bull; <span>${escapeHtml(identity.location.rawAddress || identity.location.city)}</span>` : ''}
      </div>

      ${verifiedLinksArray.length ? `
        <div class="cv-links-row">
          ${verifiedLinksArray.join(' &bull; ')}
        </div>
      ` : ''}
    </header>

    ${isEuropass ? `
    <!-- Europass Structured Two-Column View -->
    <div class="europass-grid-layout">
      <aside class="europass-side-col">
        <section class="cv-section-block">
          <h2 class="cv-section-title">Languages</h2>
          <table class="cefr-grid-table">
            <thead>
              <tr>
                <th>Language</th>
                <th>Listen</th>
                <th>Read</th>
                <th>Speak</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Bengali</strong></td>
                <td>C2</td>
                <td>C2</td>
                <td>C2</td>
              </tr>
              <tr>
                <td><strong>English</strong></td>
                <td>C1</td>
                <td>C1</td>
                <td>B2</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="cv-section-block">
          <h2 class="cv-section-title">Digital Skills</h2>
          <ul class="cv-entry-bullets" style="margin-left: 14px;">
            <li>Python, R, SQL</li>
            <li>GeoPandas &amp; Matplotlib</li>
            <li>FastAPI &amp; React</li>
            <li>Docker &amp; Linux</li>
          </ul>
        </section>
      </aside>

      <div class="europass-main-col">
    ` : ''}

    <!-- 1. Academic Background -->
    ${isSecActive('education') && education.length ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Academic Background</h2>
        ${education.map((edu) => `
          <div class="cv-entry-item">
            <div class="cv-entry-header">
              <span class="cv-entry-title">${escapeHtml(edu.degree)}</span>
              <span class="cv-entry-date">${escapeHtml(edu.period || '')}</span>
            </div>
            <div class="cv-entry-sub">${escapeHtml(edu.institution)}</div>
            ${edu.details ? `<div class="cv-entry-desc">${escapeHtml(edu.details)}</div>` : ''}
            ${edu.highlights && edu.highlights.length ? `
              <ul class="cv-entry-bullets">
                ${edu.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </section>
    ` : ''}

    <!-- 2. Research Work Involved -->
    ${isSecActive('research') && research.length ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Research Work Involved</h2>
        ${research.map((res) => `
          <div class="cv-entry-item">
            <div class="cv-entry-header">
              <span class="cv-entry-title">${escapeHtml(res.role || 'Investigator')} &bull; ${escapeHtml(res.title)}</span>
              <span class="cv-entry-date">${escapeHtml(res.period || '')}</span>
            </div>
            ${res.institution ? `<div class="cv-entry-sub">${escapeHtml(res.institution)}</div>` : ''}
            ${res.summary ? `<div class="cv-entry-desc">${escapeHtml(res.summary)}</div>` : ''}
            ${res.tags && res.tags.length ? `
              <div style="font-size: 8pt; color: var(--text-muted); margin-top: 2px;">
                Keywords: ${res.tags.map((t) => escapeHtml(t)).join(', ')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </section>
    ` : ''}

    <!-- 3. Publications & Conference Papers -->
    ${isSecActive('publications') && publications.length ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Publications &amp; Scientific Protocols</h2>
        ${publications.map((pub) => `
          <div class="cv-pub-item">
            <span class="cv-pub-badge">${escapeHtml(pub.status || 'Published')}</span>
            <strong>${escapeHtml(pub.title)}</strong> (${escapeHtml(pub.year || '')}).
            ${pub.authors ? `<span>${escapeHtml(pub.authors)}.</span> ` : ''}
            ${pub.journal ? `<em>${escapeHtml(pub.journal)}.</em> ` : ''}
            ${pub.doi ? `<span class="cv-pub-doi">DOI: <a href="https://doi.org/${escapeHtml(pub.doi)}" target="_blank">${escapeHtml(pub.doi)}</a></span>` : ''}
          </div>
        `).join('')}
      </section>
    ` : ''}

    <!-- 4. Scientific Platforms & Software -->
    ${isSecActive('projects') && projects.length ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Scientific &amp; Software Platforms</h2>
        ${projects.map((p) => `
          <div class="cv-entry-item">
            <div class="cv-entry-header">
              <span class="cv-entry-title">${escapeHtml(p.title)}</span>
              <span class="cv-entry-date">${escapeHtml(p.category || 'Platform')}</span>
            </div>
            ${p.badge ? `<div class="cv-entry-sub">${escapeHtml(p.badge)}</div>` : ''}
            ${p.description ? `<div class="cv-entry-desc">${escapeHtml(p.description)}</div>` : ''}
            ${p.linkDemo || p.linkCode ? `
              <div style="font-size: 8.5pt; margin-top: 2px;">
                ${p.linkDemo ? `<a href="${sanitizeUrl(p.linkDemo)}" target="_blank" style="color: var(--primary); margin-right: 8px;">Live Platform</a>` : ''}
                ${p.linkCode ? `<a href="${sanitizeUrl(p.linkCode)}" target="_blank" style="color: var(--text-muted);">Repository</a>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </section>
    ` : ''}

    <!-- 5. Training & Certifications -->
    ${isSecActive('training') && certifications.length ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Training &amp; Professional Certifications</h2>
        <ul class="cv-entry-bullets">
          ${certifications.map((c) => `
            <li>
              <strong>${escapeHtml(c.title)}</strong> &bull; ${escapeHtml(c.issuer || '')} (${escapeHtml(c.date || '')})
              ${c.credentialUrl && c.credentialUrl !== '#' ? ` &mdash; <a href="${sanitizeUrl(c.credentialUrl)}" target="_blank" style="font-size: 8pt; color: var(--primary);">Verify</a>` : ''}
            </li>
          `).join('')}
        </ul>
      </section>
    ` : ''}

    <!-- 6. Awards and Activities -->
    ${isSecActive('awards') && awards.length ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Awards &amp; Scientific Honors</h2>
        <ul class="cv-entry-bullets">
          ${awards.map((a) => `
            <li>
              <strong>${escapeHtml(a.title)}</strong> &bull; ${escapeHtml(a.issuer || '')} (${escapeHtml(a.year || '')})
              ${a.description ? `<div style="font-size: 8.8pt; color: var(--text-muted);">${escapeHtml(a.description)}</div>` : ''}
            </li>
          `).join('')}
        </ul>
      </section>
    ` : ''}

    <!-- 7. Leadership and Affiliations -->
    ${isSecActive('leadership') && (leadership.length || volunteering.length) ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Leadership &amp; Affiliations</h2>
        <ul class="cv-entry-bullets">
          ${leadership.map((l) => `
            <li>
              <strong>${escapeHtml(l.role)}</strong> &bull; ${escapeHtml(l.organization || '')} (${escapeHtml(l.period || '')})
              ${l.description ? `<span style="color: var(--text-muted);"> &mdash; ${escapeHtml(l.description)}</span>` : ''}
            </li>
          `).join('')}
          ${volunteering.map((v) => `
            <li>
              <strong>${escapeHtml(v.role)}</strong> &bull; ${escapeHtml(v.organization || '')} (${escapeHtml(v.period || '')})
              ${v.description ? `<span style="color: var(--text-muted);"> &mdash; ${escapeHtml(v.description)}</span>` : ''}
            </li>
          `).join('')}
        </ul>
      </section>
    ` : ''}

    <!-- 8. References -->
    ${isSecActive('references') && references.length ? `
      <section class="cv-section-block">
        <h2 class="cv-section-title">Academic References</h2>
        <div class="cv-ref-grid">
          ${references.map((ref) => `
            <div class="cv-ref-card">
              <div class="cv-ref-name">${escapeHtml(ref.name)}</div>
              <div class="cv-ref-sub">${escapeHtml(ref.designation || '')}</div>
              <div class="cv-ref-sub">${escapeHtml(ref.institution || '')}</div>
              ${ref.email ? `<div>Email: <a href="mailto:${escapeHtml(ref.email)}">${escapeHtml(ref.email)}</a></div>` : ''}
              ${ref.phone ? `<div>Phone: ${escapeHtml(ref.phone)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}

    ${isEuropass ? `
      </div><!-- /.europass-main-col -->
    </div><!-- /.europass-grid-layout -->
    ` : ''}

  </main>

</body>
</html>`;
}

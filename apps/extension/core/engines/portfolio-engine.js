import { getTemplateById } from '../templates/portfolio-catalog.js';
import { escapeHtml, sanitizeUrl } from '../security/index.js';
import { generateSeoTags } from './seo-generator.js';

function renderVerifiedLink(url, label, iconClass) {
  if (!url) return '';
  const safeUrl = sanitizeUrl(url);
  return `
    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="micro-badge-link" title="${escapeHtml(label)}">
      <i class="${escapeHtml(iconClass)}"></i>
      <span>${escapeHtml(label)}</span>
    </a>
  `.trim();
}

function renderSectionHeader(title, subtitle, iconClass, accentColor = 'var(--primary)') {
  return `
    <div class="card-header-row">
      <div class="card-title-group">
        <div class="card-icon-badge" style="color: ${accentColor};">
          <i class="${escapeHtml(iconClass)}"></i>
        </div>
        <div class="card-title-text-wrap">
          <h2 class="card-heading">${escapeHtml(title)}</h2>
          ${subtitle ? `<div class="card-subheading">${escapeHtml(subtitle)}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

export function renderPortfolioHtml(profile, options = {}) {
  const templateId = options.templateId || profile.displayConfig?.portfolioTemplateId || 'acad-flagship';
  const template = getTemplateById(templateId);
  const layout = { ...template.layout, ...(options.layoutOverrides || {}) };

  const identity = profile.identity || {};
  const links = profile.links || {};
  const metrics = Array.isArray(profile.metrics) ? profile.metrics : [];
  const education = Array.isArray(profile.education) ? profile.education : [];
  const updates = Array.isArray(profile.updates) ? profile.updates : [];
  const research = Array.isArray(profile.research) ? profile.research : [];
  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  const publications = Array.isArray(profile.publications) ? profile.publications : [];
  const skills = profile.skills || {};
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const leadership = Array.isArray(profile.leadership) ? profile.leadership : [];
  const volunteering = Array.isArray(profile.volunteering) ? profile.volunteering : [];
  const hobbies = Array.isArray(profile.hobbies) ? profile.hobbies : [];
  const references = Array.isArray(profile.references) ? profile.references : [];
  const gallery = Array.isArray(profile.gallery) ? profile.gallery : [];
  const documents = Array.isArray(profile.documents) ? profile.documents : [];
  const displayConfig = profile.displayConfig || {};
  const visibility = displayConfig.sectionVisibility || {};
  const seeAllLimit = displayConfig.seeAllLimit || { research: 3, projects: 3, publications: 4, certifications: 6 };

  const isDemoMode = Boolean(options.isDemoMode ?? (profile.meta?.isDemoMode || !profile.meta?.isCustomWorkspace));
  const gradientBorders = displayConfig.gradientBorders || 'both';
  const effects = displayConfig.effects || {};
  const hasHeroBorder = (gradientBorders === 'hero' || gradientBorders === 'both') && effects.heroBorder !== false;
  const hasClosingBorder = (gradientBorders === 'closing' || gradientBorders === 'both') && effects.closingBorder !== false;

  const isVisible = (secKey) => visibility[secKey] !== false;

  const seo = generateSeoTags(profile, options.canonicalUrl);
  const activeTheme = options.theme || layout.themeDefault || 'dark';

  // Social & Academic Micro-badges
  const microBadgesHtml = [
    renderVerifiedLink(links.scholar, 'Scholar', 'fa-brands fa-google-scholar'),
    renderVerifiedLink(links.orcid, 'ORCID', 'fa-brands fa-orcid'),
    renderVerifiedLink(links.researchgate, 'ResearchGate', 'fa-brands fa-researchgate'),
    renderVerifiedLink(links.osf, 'OSF Protocol', 'fa-solid fa-flask'),
    renderVerifiedLink(links.github, 'GitHub', 'fa-brands fa-github'),
    renderVerifiedLink(links.linkedin, 'LinkedIn', 'fa-brands fa-linkedin'),
    renderVerifiedLink(links.googleSites, 'Google Sites', 'fa-solid fa-globe'),
    renderVerifiedLink(links.personalWebsite, 'Website', 'fa-solid fa-link'),
    renderVerifiedLink(links.facebook, 'Facebook', 'fa-brands fa-facebook'),
    renderVerifiedLink(links.instagram, 'Instagram', 'fa-brands fa-instagram')
  ].filter(Boolean).join('\n');

  // KPI Metrics
  const metricsHtml = metrics.map((kpi) => `
    <a href="${sanitizeUrl(kpi.target || '#')}" class="kpi-metric-card">
      <div class="kpi-val">${escapeHtml(kpi.value)}</div>
      <div class="kpi-lbl">${escapeHtml(kpi.label)}</div>
      ${kpi.sublabel ? `<div class="kpi-sub">${escapeHtml(kpi.sublabel)}</div>` : ''}
    </a>
  `).join('\n');

  // Education Timeline
  const educationHtml = education.map((edu) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-header-wrap">
          <h3 class="timeline-title">${escapeHtml(edu.degree)}</h3>
          <span class="timeline-period-badge">${escapeHtml(edu.period)}</span>
        </div>
        <div class="timeline-inst">${escapeHtml(edu.institution)}</div>
        ${edu.badge ? `<span class="pill-badge pill-info">${escapeHtml(edu.badge)}</span>` : ''}
        ${edu.details ? `<p class="timeline-details">${escapeHtml(edu.details)}</p>` : ''}
        ${edu.highlights && edu.highlights.length ? `
          <ul class="timeline-highlights">
            ${edu.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `).join('\n');

  // Updates Ticker (Continuous Smooth Vertical Scroll with Hover Pause)
  const updatesItems = updates.slice(0, 10);
  const updatesItemsMarkup = updatesItems.map((u) => `
    <li class="update-feed-item ticker-item">
      <div class="update-feed-meta">
        <span class="update-badge">${escapeHtml(u.badge || 'Milestone')}</span>
        <span class="update-date">${escapeHtml(u.date)}</span>
      </div>
      <h4 class="update-feed-title">${escapeHtml(u.title)}</h4>
      <p class="update-feed-text">${escapeHtml(u.text)}</p>
      ${u.link && u.link !== '#' ? `<a href="${sanitizeUrl(u.link)}" target="_blank" rel="noopener noreferrer" class="link-arrow">View Milestone <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
    </li>
  `).join('\n');
  // Duplicate for seamless vertical scroll loop
  const updatesTickerHtml = `
    <div class="updates-ticker-viewport" id="updates-ticker-box">
      <ul class="updates-ticker-list">
        ${updatesItemsMarkup}
        ${updatesItemsMarkup}
      </ul>
    </div>
  `;

  // Research Items with Evidence & Findings
  const researchItems = research.slice(0, seeAllLimit.research || 3);
  const researchHtml = researchItems.map((res) => `
    <article class="feed-item-card">
      <div class="item-header-wrap">
        <div>
          <span class="item-category-pill">${escapeHtml(res.category || 'Investigation')}</span>
          <h3 class="item-headline">${escapeHtml(res.title)}</h3>
          <div class="item-meta-sub">${escapeHtml(res.institution || '')} &bull; <strong>${escapeHtml(res.role || '')}</strong> &bull; ${escapeHtml(res.period || '')}</div>
        </div>
      </div>
      <p class="item-summary-text">${escapeHtml(res.summary)}</p>
      ${res.tags && res.tags.length ? `
        <div class="tag-row">
          ${res.tags.map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
      ${res.images && res.images.length ? `
        <div class="evidence-findings-box">
          <div class="evidence-header"><i class="fa-solid fa-microscope"></i> Evidence &amp; Findings (${res.images.length} verified artifacts)</div>
          <div class="evidence-thumbnails-grid">
            ${res.images.slice(0, 4).map((img) => {
              const imgUrl = typeof img === 'object' && img !== null ? (img.url || '') : img;
              const imgAlt = typeof img === 'object' && img !== null ? (img.caption || img.alt || 'Evidence') : 'Evidence';
              return `
                <a href="${sanitizeUrl(imgUrl)}" target="_blank" rel="noopener noreferrer" class="evidence-thumb-link">
                  <img src="${sanitizeUrl(imgUrl)}" alt="${escapeHtml(imgAlt)}" loading="lazy" class="evidence-thumb-img" onerror="this.style.display='none'">
                </a>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
      ${res.documents && res.documents.length ? `
        <div class="card-attached-docs">
          <div class="attached-docs-label"><i class="fa-solid fa-paperclip"></i> Attached Briefs &amp; Slides:</div>
          <div class="attached-docs-list">
            ${res.documents.map((d) => `
              <a href="${sanitizeUrl(d.url || '')}" target="_blank" rel="noopener noreferrer" class="doc-pill-link">
                <i class="fa-solid fa-file-lines"></i>
                <span>${escapeHtml(d.title || 'Document')}</span>
                <span class="doc-pill-tag">${escapeHtml(d.docType || 'Drive')}</span>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${res.link ? `
        <div class="item-action-footer">
          <a href="${sanitizeUrl(res.link)}" target="_blank" rel="noopener noreferrer" class="btn-subtle">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Explore Research Details
          </a>
        </div>
      ` : ''}
    </article>
  `).join('\n');

  // Projects Items with Docs & Briefs, Demo, Code
  const projectItems = projects.slice(0, seeAllLimit.projects || 3);
  const projectsHtml = projectItems.map((proj) => `
    <article class="feed-item-card">
      <div class="item-header-wrap">
        <div>
          <span class="item-category-pill pill-accent">${escapeHtml(proj.category || 'Platform')}</span>
          <h3 class="item-headline">${escapeHtml(proj.title)}</h3>
          ${proj.badge ? `<span class="pill-badge pill-success">${escapeHtml(proj.badge)}</span>` : ''}
        </div>
      </div>
      <p class="item-summary-text">${escapeHtml(proj.description)}</p>
      ${proj.tags && proj.tags.length ? `
        <div class="tag-row">
          ${proj.tags.map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}
      ${proj.images && proj.images.length ? `
        <div class="evidence-findings-box">
          <div class="evidence-header"><i class="fa-solid fa-file-lines"></i> Docs &amp; Briefs (${proj.images.length} screenshots)</div>
          <div class="evidence-thumbnails-grid">
            ${proj.images.slice(0, 4).map((img) => {
              const imgUrl = typeof img === 'object' && img !== null ? (img.url || '') : img;
              const imgAlt = typeof img === 'object' && img !== null ? (img.caption || img.alt || 'Platform preview') : 'Platform preview';
              return `
                <a href="${sanitizeUrl(imgUrl)}" target="_blank" rel="noopener noreferrer" class="evidence-thumb-link">
                  <img src="${sanitizeUrl(imgUrl)}" alt="${escapeHtml(imgAlt)}" loading="lazy" class="evidence-thumb-img" onerror="this.style.display='none'">
                </a>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
      ${proj.documents && proj.documents.length ? `
        <div class="card-attached-docs">
          <div class="attached-docs-label"><i class="fa-solid fa-paperclip"></i> Attached Briefs &amp; Slides:</div>
          <div class="attached-docs-list">
            ${proj.documents.map((d) => `
              <a href="${sanitizeUrl(d.url || '')}" target="_blank" rel="noopener noreferrer" class="doc-pill-link">
                <i class="fa-solid fa-file-lines"></i>
                <span>${escapeHtml(d.title || 'Document')}</span>
                <span class="doc-pill-tag">${escapeHtml(d.docType || 'Drive')}</span>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="item-action-footer">
        ${proj.linkDemo ? `<a href="${sanitizeUrl(proj.linkDemo)}" target="_blank" rel="noopener noreferrer" class="btn-action-primary"><i class="fa-solid fa-globe"></i> Live System</a>` : ''}
        ${proj.linkCode ? `<a href="${sanitizeUrl(proj.linkCode)}" target="_blank" rel="noopener noreferrer" class="btn-subtle"><i class="fa-brands fa-github"></i> Source Code</a>` : ''}
      </div>
    </article>
  `).join('\n');

  // Publications
  const pubItems = publications.slice(0, seeAllLimit.publications || 4);
  const publicationsHtml = pubItems.map((pub) => `
    <article class="pub-card-item">
      <div class="pub-top-row">
        <span class="pill-badge ${pub.status === 'accepted' ? 'pill-success' : 'pill-info'}">${escapeHtml(pub.status || 'Published')}</span>
        <span class="pub-year">${escapeHtml(pub.year || '')}</span>
      </div>
      <h3 class="pub-title">${escapeHtml(pub.title)}</h3>
      <div class="pub-authors">${escapeHtml(pub.authors || '')}</div>
      <div class="pub-journal">${escapeHtml(pub.journal || '')}</div>
      ${pub.doi ? `<div class="pub-doi"><i class="fa-solid fa-fingerprint"></i> DOI: <code>${escapeHtml(pub.doi)}</code></div>` : ''}
      ${pub.link ? `
        <div class="pub-footer">
          <a href="${sanitizeUrl(pub.link)}" target="_blank" rel="noopener noreferrer" class="link-arrow">
            View Publication <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      ` : ''}
    </article>
  `).join('\n');

  // Skills Categories
  let skillsHtml = '';
  if (skills && typeof skills === 'object') {
    skillsHtml = Object.entries(skills).map(([key, cat]) => `
      <div class="skills-category-box">
        <h3 class="skills-category-title">
          <i class="${escapeHtml(cat.icon || 'fa-solid fa-check')}"></i>
          ${escapeHtml(cat.title || key)}
        </h3>
        <div class="skills-grid-inner">
          ${(cat.skills || []).map((sk) => `
            <div class="skill-tile">
              <strong class="skill-tile-name">${escapeHtml(sk.name)}</strong>
              ${sk.desc ? `<p class="skill-tile-desc">${escapeHtml(sk.desc)}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('\n');
  }

  // Certifications
  const certItems = certifications.slice(0, seeAllLimit.certifications || 6);
  const certificationsHtml = certItems.map((c) => `
    <div class="cert-card-tile">
      <div class="cert-icon-col"><i class="fa-solid fa-certificate"></i></div>
      <div class="cert-info-col">
        <h4 class="cert-title">${escapeHtml(c.title)}</h4>
        <div class="cert-issuer">${escapeHtml(c.issuer || '')} &bull; ${escapeHtml(c.date || '')}</div>
        ${c.credentialUrl && c.credentialUrl !== '#' ? `
          <a href="${sanitizeUrl(c.credentialUrl)}" target="_blank" rel="noopener noreferrer" class="link-arrow">
            Verify Credential <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        ` : ''}
      </div>
    </div>
  `).join('\n');

  // Leadership & Volunteering
  const leadershipHtml = leadership.map((l) => `
    <div class="lead-item-card">
      <div class="lead-header-row">
        <h4 class="lead-role">${escapeHtml(l.role)}</h4>
        <span class="timeline-period-badge">${escapeHtml(l.period || '')}</span>
      </div>
      <div class="lead-org">${escapeHtml(l.organization || '')}</div>
      ${l.description ? `<p class="lead-desc">${escapeHtml(l.description)}</p>` : ''}
    </div>
  `).join('\n');

  const volunteeringHtml = volunteering.map((v) => `
    <div class="lead-item-card">
      <div class="lead-header-row">
        <h4 class="lead-role">${escapeHtml(v.role)}</h4>
        <span class="timeline-period-badge">${escapeHtml(v.period || '')}</span>
      </div>
      <div class="lead-org">${escapeHtml(v.organization || '')}</div>
      ${v.description ? `<p class="lead-desc">${escapeHtml(v.description)}</p>` : ''}
    </div>
  `).join('\n');

  // References
  const referencesHtml = references.map((ref) => `
    <div class="ref-card-box">
      <div class="ref-avatar-icon"><i class="fa-solid fa-user-tie"></i></div>
      <h4 class="ref-name">${escapeHtml(ref.name)}</h4>
      <div class="ref-desig">${escapeHtml(ref.designation)}</div>
      <div class="ref-inst">${escapeHtml(ref.institution)}</div>
      ${ref.email ? `<div class="ref-contact"><i class="fa-solid fa-envelope"></i> <a href="mailto:${escapeHtml(ref.email)}">${escapeHtml(ref.email)}</a></div>` : ''}
      ${ref.phone ? `<div class="ref-contact"><i class="fa-solid fa-phone"></i> ${escapeHtml(ref.phone)}</div>` : ''}
    </div>
  `).join('\n');

  // Hobbies Strip
  const hobbiesHtml = hobbies.map((h) => `
    <div class="hobby-pill">
      <span class="hobby-icon">${escapeHtml(h.icon || '✨')}</span>
      <span class="hobby-text">${escapeHtml(h.title)}</span>
    </div>
  `).join('\n');

  // Documents & Slides Grid
  const documentsHtml = documents.map((doc) => {
    const isDoc = typeof doc === 'object' && doc !== null;
    const title = isDoc ? (doc.title || 'Document') : 'Document';
    const docType = isDoc ? (doc.docType || 'Google Drive') : 'Document';
    const date = isDoc ? (doc.date || '') : '';
    const url = isDoc ? (doc.url || '') : doc;
    const isPptx = docType.includes('Presentation') || docType.includes('Slide');
    const isWord = docType.includes('Word');
    const isPdf = docType.includes('PDF');
    const icon = isPptx ? 'fa-solid fa-file-powerpoint' : (isWord ? 'fa-solid fa-file-word' : (isPdf ? 'fa-solid fa-file-pdf' : 'fa-brands fa-google-drive'));
    const color = isPptx ? '#ea580c' : (isWord ? '#2563eb' : (isPdf ? '#dc2626' : '#059669'));

    return `
      <div class="doc-portfolio-card">
        <div class="doc-card-icon" style="color: ${color};"><i class="${icon}"></i></div>
        <div class="doc-card-info">
          <div class="doc-card-meta">
            <span class="doc-badge" style="color: ${color}; border-color: ${color}40; background: ${color}12;">${escapeHtml(docType)}</span>
            ${date ? `<span class="doc-date">${escapeHtml(date)}</span>` : ''}
          </div>
          <h4 class="doc-card-title">${escapeHtml(title)}</h4>
          ${url ? `
            <a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer" class="link-arrow">
              Open Resource <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }).join('\n');

  // Photo Gallery with Smooth Horizontal Marquee & Robust Fallback
  const galleryItems = gallery.slice(0, 16);
  const galleryCardsHtml = galleryItems.map((item, idx) => {
    const isObj = typeof item === 'object' && item !== null;
    const url = isObj ? (item.imageUrl || item.url || item.mediaUrl || item.thumbnail || '') : item;
    const caption = isObj ? (item.caption || item.title || item.alt || `Photo ${idx + 1}`) : `Photo ${idx + 1}`;
    const badge = isObj && item.badge ? item.badge : (isObj && item.category ? item.category : '');
    return `
      <div class="gallery-photo-card">
        <a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer" class="gallery-thumb-link">
          <img src="${sanitizeUrl(url)}" alt="${escapeHtml(caption)}" loading="lazy" class="gallery-thumb-img" onerror="this.onerror=null; this.src='assets/ZUN.png';">
          ${badge ? `<span class="gallery-photo-badge">${escapeHtml(badge)}</span>` : ''}
        </a>
        ${caption ? `<div class="gallery-caption" title="${escapeHtml(caption)}">${escapeHtml(caption)}</div>` : ''}
      </div>
    `;
  }).join('\n');

  const galleryHtml = `
    <div class="gallery-filter-pills">
      <span class="gallery-pill active" data-filter="all"><i class="fa-solid fa-shapes"></i> All Verified Artifacts (${galleryItems.length})</span>
      <span class="gallery-pill" data-filter="academic"><i class="fa-solid fa-graduation-cap"></i> Clinical &amp; Field</span>
      <span class="gallery-pill" data-filter="lab"><i class="fa-solid fa-microscope"></i> Laboratory Triage</span>
    </div>
    <div class="gallery-marquee-viewport">
      <div class="gallery-marquee-track">
        ${galleryCardsHtml}
        ${galleryCardsHtml}
      </div>
    </div>
  `;

  const isSplitLayout = layout.type === 'split-sticky-sidebar' || layout.type === 'custom';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${escapeHtml(activeTheme)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${escapeHtml(options.baseHref || './')}">
  ${seo.headMarkup}

  <!-- Font and Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <style>
    :root {
      --primary: ${displayConfig.themeTokens?.primaryColor || layout.primaryColor || '#0d9488'};
      --primary-light: ${layout.primaryLight || 'rgba(13, 148, 136, 0.12)'};
      --accent: ${displayConfig.themeTokens?.accentColor || layout.accentColor || '#0ea5e9'};
      --accent-light: ${layout.accentLight || 'rgba(14, 165, 233, 0.12)'};
      --font-heading: ${layout.fontHeading || "'Space Grotesk', 'Inter', sans-serif"};
      --font-body: ${layout.fontBody || "'Inter', sans-serif"};
      --font-mono: ${layout.fontMono || "'JetBrains Mono', monospace"};

      --bg-base: #f8fafc;
      --bg-card: #ffffff;
      --bg-subtle: #f1f5f9;
      --border-color: #e2e8f0;
      --text-primary: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --card-radius: 16px;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
      --sidebar-width: ${layout.sidebarWidth || '310px'};
    }

    /* Shifting Gradient Perimeter & Radiant Glow Keyframes */
    @keyframes borderPerimeterShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .card-perimeter-gradient {
      position: relative;
      border: none !important;
    }

    .card-perimeter-gradient::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 2.5px;
      background: linear-gradient(
        135deg,
        #0d9488 0%,
        #0ea5e9 20%,
        #6366f1 40%,
        #ec4899 60%,
        #f59e0b 80%,
        #10b981 100%
      );
      background-size: 300% 300%;
      animation: borderPerimeterShift 7s ease infinite;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
      z-index: 5;
      box-sizing: border-box;
    }

    .card-perimeter-gradient::after {
      content: "";
      position: absolute;
      inset: -4px;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        #0d9488 0%,
        #0ea5e9 20%,
        #6366f1 40%,
        #ec4899 60%,
        #f59e0b 80%,
        #10b981 100%
      );
      background-size: 300% 300%;
      animation: borderPerimeterShift 7s ease infinite;
      filter: blur(20px);
      opacity: 0.55;
      pointer-events: none;
      z-index: -1;
      transition: opacity 0.3s ease, filter 0.3s ease;
    }

    ${displayConfig.effects?.glow === 'subtle' ? `
    .card-perimeter-gradient::after { opacity: 0.22 !important; filter: blur(10px) !important; }
    ` : (displayConfig.effects?.glow === 'off' ? `
    .card-perimeter-gradient::after { display: none !important; }
    ` : '')}

    ${displayConfig.motion?.ticker === 'off' ? `
    .updates-ticker-list { animation: none !important; }
    ` : (displayConfig.motion?.ticker ? `
    .updates-ticker-list { animation-duration: ${escapeHtml(displayConfig.motion.ticker)} !important; }
    ` : '')}

    ${displayConfig.motion?.marquee === 'off' ? `
    .gallery-marquee-track { animation: none !important; flex-wrap: wrap !important; width: 100% !important; }
    ` : (displayConfig.motion?.marquee ? `
    .gallery-marquee-track { animation-duration: ${escapeHtml(displayConfig.motion.marquee)} !important; }
    ` : '')}

    /* Vertical Updates Ticker */
    .updates-ticker-viewport {
      max-height: 380px;
      overflow: hidden;
      position: relative;
      mask-image: linear-gradient(to bottom, transparent, black 14px, black calc(100% - 14px), transparent);
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 14px, black calc(100% - 14px), transparent);
    }
    .updates-ticker-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      list-style: none;
      margin: 0;
      padding: 0;
      animation: scrollVertical 22s linear infinite;
    }
    .updates-ticker-viewport:hover .updates-ticker-list {
      animation-play-state: paused;
    }
    @keyframes scrollVertical {
      0% { transform: translateY(0); }
      100% { transform: translateY(-50%); }
    }
    .ticker-item {
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .ticker-item:hover {
      transform: translateX(4px);
      border-color: var(--primary);
    }

    /* Horizontal Photo Gallery Marquee */
    .gallery-filter-pills {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .gallery-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      font-size: 0.76rem;
      font-weight: 600;
      border-radius: 9999px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .gallery-pill:hover, .gallery-pill.active {
      background: var(--primary-light);
      border-color: var(--primary);
      color: var(--primary);
    }
    .gallery-marquee-viewport {
      overflow: hidden;
      position: relative;
      width: 100%;
      mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
      padding: 8px 0;
    }
    .gallery-marquee-track {
      display: flex;
      gap: 14px;
      width: max-content;
      animation: scrollHorizontal 110s linear infinite;
    }
    .gallery-marquee-viewport:hover .gallery-marquee-track {
      animation-play-state: paused;
    }
    @keyframes scrollHorizontal {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .gallery-photo-card {
      width: 270px;
      flex-shrink: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    .gallery-photo-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--primary);
    }
    .gallery-photo-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.78);
      backdrop-filter: blur(4px);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 600;
      z-index: 2;
    }

    /* Google Map & Interactive Location Controls */
    .map-embed-container {
      border-radius: 14px;
      overflow: hidden;
      border: 1.5px solid rgba(13, 148, 136, 0.3);
      box-shadow: var(--shadow-sm);
      position: relative;
      background: var(--bg-subtle);
      margin-bottom: 12px;
    }
    .map-toggle-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .map-toggle-group {
      display: inline-flex;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-subtle);
    }
    .map-toggle-pill {
      padding: 5px 12px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.76rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .map-toggle-pill.active {
      background: var(--primary);
      color: #fff;
      font-weight: 600;
    }
    .coord-copy-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 6px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      font-family: var(--font-mono);
      font-size: 0.74rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease;
    }
    .coord-copy-pill:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
    .live-pulse-dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: livePulse 2s infinite;
    }
    @keyframes livePulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Floating CV PDF Action Pill */
    .floating-cv-pill {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 990;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 9999px;
      background: var(--primary);
      color: #fff;
      font-weight: 600;
      font-size: 0.84rem;
      box-shadow: 0 8px 24px rgba(13, 148, 136, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.2);
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .floating-cv-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(13, 148, 136, 0.55);
      color: #fff;
    }

    ${displayConfig.cardGridColumns === '3x' ? `
    .cert-grid, .ref-grid, .skills-grid-inner { grid-template-columns: repeat(3, 1fr) !important; }
    ` : (displayConfig.cardGridColumns === '1x' ? `
    .cert-grid, .ref-grid, .skills-grid-inner { grid-template-columns: 1fr !important; }
    ` : '')}

    ${displayConfig.gradientBorders === 'hero' ? `
    .about-hero-card {
      border: 1px solid transparent !important;
      background-image: linear-gradient(var(--bg-card), var(--bg-card)), linear-gradient(135deg, var(--primary), #f59e0b, #0ea5e9);
      background-origin: border-box;
      background-clip: padding-box, border-box;
    }
    ` : ''}
    ${displayConfig.gradientBorders === 'off' ? `
    .card-perimeter-gradient::before,
    .card-perimeter-gradient::after {
      display: none !important;
    }
    .card-perimeter-gradient {
      background: var(--bg-card) !important;
      border: 1px solid var(--border-color) !important;
    }
    ` : ''}

    [data-theme="dark"] {
      --bg-base: ${layout.bgBaseDark || '#0b131e'};
      --bg-card: ${layout.bgCardDark || '#111c2a'};
      --bg-subtle: #172436;
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #f8fafc;
      --text-secondary: #cbd5e1;
      --text-muted: #94a3b8;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
      font-size: 16px;
    }

    body {
      font-family: var(--font-body);
      background-color: var(--bg-base);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    a {
      color: var(--primary);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    a:hover {
      color: var(--accent);
    }

    /* Top Sticky Navigation Bar (Exact 1:1 mdnafizurrahman8024.github.io) */
    .navbar {
      position: sticky;
      top: 0;
      left: 0;
      width: 100%;
      height: 60px;
      z-index: 9999 !important;
      overflow: visible !important;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-color);
      transition: all 0.25s ease;
    }
    [data-theme="light"] .navbar {
      background: rgba(255, 255, 255, 0.94);
    }
    .navbar.scrolled {
      box-shadow: var(--shadow-md);
      background: var(--bg-surface-elevated, #111c2a);
    }

    .nav-inner, .nav-container {
      width: 100%;
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 1.25rem;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
      gap: 12px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-primary);
      text-decoration: none;
      flex-shrink: 0;
      min-width: max-content;
    }

    .nav-brand-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      object-position: center top;
      border: 2px solid var(--primary);
      box-shadow: 0 2px 8px rgba(13, 148, 136, 0.2);
      flex-shrink: 0;
    }
    [data-theme="dark"] .nav-brand-avatar {
      border-color: #14b8a6;
      box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
    }

    .nav-brand-info, .nav-brand-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex-shrink: 0;
      min-width: max-content;
    }

    .nav-brand-name {
      font-weight: 700;
      font-size: 14.5px;
      line-height: 1.25;
      margin: 0;
      white-space: nowrap;
      color: var(--text-primary);
    }

    .nav-brand-sub, .nav-brand-role {
      font-size: 11px;
      color: var(--primary);
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1.25;
      margin: 0;
      white-space: nowrap;
    }

    .nav-menu, .nav-links-menu {
      display: flex;
      align-items: center;
      list-style: none;
      gap: 10px;
      flex-wrap: nowrap;
      margin: 0;
      padding: 0;
    }

    .nav-pill {
      color: var(--text-secondary);
      font-size: 12.5px;
      font-weight: 500;
      padding: 0.35rem 0.6rem;
      border-radius: 999px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
      text-decoration: none;
    }
    .nav-pill:hover {
      color: var(--primary);
      background: var(--primary-light);
    }

    /* Bulletproof Active Nav Tab Highlighting (1:1 with mdnafizurrahman8024.github.io) */
    .nav-tab-active,
    #nav-menu a.nav-tab-active,
    #universal-nav-drawer a.nav-tab-active,
    .nav-pill.nav-tab-active,
    .universal-nav-link.nav-tab-active,
    .nav-dropdown-item.nav-tab-active,
    #more-dropdown-btn.nav-tab-active,
    #nav-menu a.active,
    #universal-nav-drawer a.active,
    .nav-pill.active,
    .universal-nav-link.active,
    .nav-dropdown-item.active,
    #more-dropdown-btn.active {
      background: rgba(13, 148, 136, 0.16) !important;
      color: #0f766e !important;
      font-weight: 700 !important;
      border-radius: 999px !important;
      padding: 5px 12px !important;
      box-shadow: inset 0 0 0 1.5px rgba(13, 148, 136, 0.42) !important;
      transition: all 0.25s ease !important;
    }
    [data-theme="dark"] .nav-tab-active,
    [data-theme="dark"] #nav-menu a.nav-tab-active,
    [data-theme="dark"] #universal-nav-drawer a.nav-tab-active,
    [data-theme="dark"] .nav-pill.nav-tab-active,
    [data-theme="dark"] .universal-nav-link.nav-tab-active,
    [data-theme="dark"] .nav-dropdown-item.nav-tab-active,
    [data-theme="dark"] #more-dropdown-btn.nav-tab-active,
    [data-theme="dark"] #nav-menu a.active,
    [data-theme="dark"] #universal-nav-drawer a.active,
    [data-theme="dark"] .nav-pill.active,
    [data-theme="dark"] .universal-nav-link.active,
    [data-theme="dark"] .nav-dropdown-item.active,
    [data-theme="dark"] #more-dropdown-btn.active {
      background: rgba(45, 212, 191, 0.18) !important;
      color: #2dd4bf !important;
      box-shadow: inset 0 0 0 1.5px rgba(45, 212, 191, 0.42) !important;
    }

    /* Nav Dropdown for "More ▾" */
    .nav-dropdown {
      position: relative;
    }
    .nav-dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: var(--bg-surface-elevated, #111c2a);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
      min-width: 190px;
      list-style: none;
      padding: 0.5rem;
      display: none;
      flex-direction: column;
      z-index: 1050;
      animation: dropdownPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    [data-theme="light"] .nav-dropdown-menu {
      background: #ffffff;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
    }
    .nav-dropdown:hover .nav-dropdown-menu,
    .nav-dropdown:focus-within .nav-dropdown-menu,
    .nav-dropdown.active .nav-dropdown-menu,
    .nav-dropdown.open .nav-dropdown-menu {
      display: flex !important;
    }
    @keyframes dropdownPop {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .nav-dropdown-item {
      color: var(--text-secondary);
      padding: 0.5rem 0.8rem;
      font-size: 0.82rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .nav-dropdown-item:hover {
      background: var(--primary-light);
      color: var(--primary);
    }
    .nav-dropdown-item i {
      color: var(--primary);
      width: 16px;
      text-align: center;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .theme-toggle-btn {
      background: var(--bg-secondary, rgba(255, 255, 255, 0.06));
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .theme-toggle-btn:hover {
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--primary);
    }

    .header-nav-toggle-btn,
    .mobile-menu-btn,
    .mobile-toggle-btn {
      background: var(--bg-secondary, rgba(255, 255, 255, 0.06));
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1rem;
      padding: 0;
      box-sizing: border-box;
    }
    .header-nav-toggle-btn:hover,
    .mobile-menu-btn:hover,
    .mobile-toggle-btn:hover {
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--primary);
    }
    .header-nav-toggle-btn.active,
    .mobile-menu-btn.active,
    .mobile-toggle-btn.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }

    /* Universal Navigation Drawer (#universal-nav-drawer) */
    #universal-nav-drawer,
    .universal-nav-drawer,
    .mobile-drawer {
      position: fixed !important;
      right: 16px !important;
      left: auto !important;
      top: 68px !important;
      width: 280px !important;
      max-width: calc(100vw - 32px) !important;
      max-height: calc(100vh - 84px) !important;
      overflow-y: auto !important;
      border-radius: 14px !important;
      padding: 10px !important;
      z-index: 99999 !important;
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.2) !important;
      border: 1px solid rgba(13, 148, 136, 0.25) !important;
      background: #0f172a !important;
      box-sizing: border-box !important;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: none;
    }
    [data-theme="light"] #universal-nav-drawer,
    [data-theme="light"] .universal-nav-drawer,
    [data-theme="light"] .mobile-drawer {
      background: #ffffff !important;
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12) !important;
      border: 1px solid rgba(13, 148, 136, 0.2) !important;
    }
    #universal-nav-drawer.open,
    #universal-nav-drawer.active,
    .universal-nav-drawer.open,
    .universal-nav-drawer.active,
    .mobile-drawer.open {
      display: block !important;
      animation: universalDropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .universal-nav-inner,
    .header-nav-panel-inner,
    .header-nav-drawer-inner {
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }
    .universal-nav-link,
    .header-nav-pill,
    .header-drawer-link,
    .mobile-drawer-link {
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 9px 12px !important;
      border-radius: 8px !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      background: transparent !important;
      color: var(--text-primary, #0f172a) !important;
      text-decoration: none !important;
      border: 1px solid transparent !important;
      transition: all 0.18s ease !important;
      box-sizing: border-box !important;
    }
    .universal-nav-link i,
    .header-nav-pill i,
    .header-drawer-link i,
    .mobile-drawer-link i {
      color: var(--primary) !important;
      font-size: 14px !important;
      width: 20px !important;
      text-align: center !important;
      flex-shrink: 0 !important;
    }
    .universal-nav-link:hover,
    .header-nav-pill:hover,
    .header-drawer-link:hover,
    .mobile-drawer-link:hover {
      background: var(--primary-light) !important;
      color: var(--primary) !important;
    }

    /* Responsive Intermediate & Mobile Header */
    .nav-text-compact { display: none !important; }
    .nav-text-full { display: inline !important; }

    @media (min-width: 769px) and (max-width: 1279px) {
      .navbar { height: 56px !important; }
      .nav-inner, .nav-container { padding: 0 10px !important; gap: 0.4rem !important; }
      .nav-brand { gap: 0.45rem !important; }
      .nav-brand-avatar { width: 30px !important; height: 30px !important; }
      .nav-brand-name { font-size: 13px !important; }
      .nav-brand-sub, .nav-brand-role { display: none !important; }
      .nav-menu, .nav-links-menu { gap: 3px !important; }
      .nav-pill { font-size: 11px !important; padding: 4px 6px !important; }
      .nav-text-full { display: none !important; }
      .nav-text-compact { display: inline !important; }
    }

    @media (max-width: 900px) {
      .nav-menu, .nav-links-menu { display: none !important; }
      .header-nav-toggle-btn, .mobile-menu-btn, .mobile-toggle-btn { display: inline-flex !important; }
    }

    @media (max-width: 960px) {
      .layout-container { padding: 0 12px; margin: 16px auto 40px; }
      .split-layout-wrapper { grid-template-columns: 1fr; gap: 16px; }
      .sticky-sidebar-card { position: static; }
    }

    /* Layout Wrapper */
    .layout-container {
      max-width: 1320px;
      margin: 24px auto 60px;
      padding: 0 20px;
    }

    ${isSplitLayout ? `
    .split-layout-wrapper {
      display: grid;
      grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }
    ` : `
    .split-layout-wrapper {
      display: block;
      max-width: 960px;
      margin: 0 auto;
    }
    `}

    /* Sticky Sidebar Card */
    .sticky-sidebar-card {
      position: sticky;
      top: 84px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--card-radius);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }

    .sidebar-avatar-wrap {
      position: relative;
      width: 110px;
      height: 110px;
      margin: 0 auto 16px;
    }

    .sidebar-avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--primary);
      display: block;
    }

    .sidebar-status-dot {
      position: absolute;
      bottom: 6px;
      right: 6px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #10b981;
      border: 2.5px solid var(--bg-card);
    }

    .sidebar-status-pills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      margin-bottom: 12px;
    }

    .pill-badge {
      display: inline-block;
      padding: 3px 10px;
      font-size: 0.72rem;
      font-weight: 600;
      border-radius: 9999px;
      background: var(--bg-subtle);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }
    .pill-info {
      background: var(--primary-light);
      color: var(--primary);
      border-color: transparent;
    }
    .pill-accent {
      background: var(--accent-light);
      color: var(--accent);
      border-color: transparent;
    }
    .pill-success {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border-color: transparent;
    }

    .sidebar-name {
      font-family: var(--font-heading);
      font-size: 1.3rem;
      font-weight: 700;
      text-align: center;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    .sidebar-role {
      font-size: 0.8rem;
      text-align: center;
      color: var(--text-muted);
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .sidebar-email-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      font-size: 0.76rem;
      font-family: var(--font-mono);
      color: var(--text-secondary);
      margin-bottom: 16px;
      word-break: break-all;
    }

    .micro-badges-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-bottom: 16px;
    }

    .micro-badge-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 6px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      font-size: 0.74rem;
      color: var(--text-secondary);
      font-weight: 500;
      transition: background 0.15s ease, border-color 0.15s ease;
      min-width: 0;
    }
    .micro-badge-link span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .micro-badge-link:hover {
      background: var(--primary-light);
      border-color: var(--primary);
      color: var(--primary);
    }

    .sidebar-motto {
      font-style: italic;
      font-size: 0.78rem;
      text-align: center;
      color: var(--text-muted);
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
    }

    /* Right Scrollable Content Feed */
    .scrollable-feed {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0;
    }

    /* Animated Gradient Outer Border ONLY for Hero Banner & Closing Card */
    .card-perimeter-gradient {
      position: relative;
      border-radius: var(--card-radius);
      border: none !important;
      z-index: 1;
    }
    .card-perimeter-gradient::before {
      content: "";
      position: absolute;
      inset: -2.5px;
      border-radius: inherit;
      background: linear-gradient(135deg, #0d9488 0%, #0ea5e9 25%, #6366f1 50%, #ec4899 75%, #f59e0b 100%);
      z-index: -2;
      animation: perimeterShift 10s ease infinite alternate;
    }
    .card-perimeter-gradient::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--bg-card);
      z-index: -1;
    }
    @keyframes perimeterShift {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(45deg); }
    }

    .hero-banner-card {
      overflow: hidden;
      padding: 0;
      background: var(--bg-card);
    }

    .hero-banner-img {
      width: 100%;
      height: 220px;
      object-fit: cover;
      display: block;
      border-radius: var(--card-radius);
    }

    /* Feed Card Style */
    .feed-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--card-radius);
      padding: 28px;
      box-shadow: var(--shadow-sm);
    }

    .card-header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }

    .card-title-group {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      width: 100%;
      min-width: 0;
    }

    .card-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      flex-shrink: 0;
    }

    .card-title-text-wrap {
      min-width: 0;
      flex: 1;
    }

    .card-heading {
      font-family: var(--font-heading);
      font-size: 1.28rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .card-subheading {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .about-intro-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .about-avatar-img {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid var(--primary);
      flex-shrink: 0;
    }

    .bio-paragraphs {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .bio-paragraphs p {
      margin-bottom: 12px;
    }

    .hobbies-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .hobby-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    /* KPI Summary Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .kpi-metric-card {
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px 12px;
      text-align: center;
      display: block;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .kpi-metric-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
    }

    .kpi-val {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary);
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .kpi-lbl {
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.25;
      margin-bottom: 2px;
    }

    .kpi-sub {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    /* Timeline */
    .timeline-list {
      position: relative;
      padding-left: 20px;
      border-left: 2px solid var(--border-color);
      margin-left: 10px;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 24px;
    }
    .timeline-item:last-child {
      margin-bottom: 0;
    }

    .timeline-dot {
      position: absolute;
      left: -27px;
      top: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid var(--bg-card);
    }

    .timeline-header-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 4px;
    }

    .timeline-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .timeline-period-badge {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--bg-subtle);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .timeline-inst {
      font-size: 0.84rem;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .timeline-details {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 6px;
    }

    .timeline-highlights {
      list-style: square;
      margin-left: 18px;
      margin-top: 6px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Updates Ticker */
    .updates-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .update-feed-item {
      padding: 14px 16px;
      background: var(--bg-subtle);
      border-radius: 10px;
      border-left: 3px solid var(--primary);
    }

    .update-feed-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .update-badge {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--primary-light);
      color: var(--primary);
    }

    .update-date {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .update-feed-title {
      font-size: 0.92rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .update-feed-text {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Feed Items (Research & Projects) */
    .feed-item-card {
      padding: 20px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .feed-item-card:last-child {
      margin-bottom: 0;
    }

    .item-category-pill {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .item-headline {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
      line-height: 1.35;
    }

    .item-meta-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    .item-summary-text {
      font-size: 0.86rem;
      color: var(--text-secondary);
      margin-bottom: 12px;
      line-height: 1.55;
    }

    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .tag-pill {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }

    /* Evidence & Findings / Docs & Briefs */
    .evidence-findings-box {
      margin-top: 12px;
      padding: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .evidence-header {
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .evidence-thumbnails-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .evidence-thumb-link {
      display: block;
      border-radius: 6px;
      overflow: hidden;
      aspect-ratio: 4 / 3;
      border: 1px solid var(--border-color);
      background: var(--bg-subtle);
    }

    .evidence-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }
    .evidence-thumb-link:hover .evidence-thumb-img {
      transform: scale(1.05);
    }

    .item-action-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 14px;
      flex-wrap: wrap;
    }

    .btn-action-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      background: var(--primary);
      color: #ffffff !important;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      transition: opacity 0.15s ease;
    }
    .btn-action-primary:hover {
      opacity: 0.9;
    }

    .btn-subtle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Publications */
    .pub-card-item {
      padding: 16px 18px;
      background: var(--bg-subtle);
      border-radius: 10px;
      border: 1px solid var(--border-color);
      margin-bottom: 12px;
    }
    .pub-card-item:last-child {
      margin-bottom: 0;
    }

    .pub-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    .pub-year {
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .pub-title {
      font-size: 0.96rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.35;
      margin-bottom: 6px;
    }

    .pub-authors {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .pub-journal {
      font-size: 0.8rem;
      font-style: italic;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .pub-doi {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .pub-doi code {
      background: var(--bg-card);
      padding: 1px 4px;
      border-radius: 3px;
    }

    .link-arrow {
      font-size: 0.78rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Skills Grid */
    .skills-category-box {
      margin-bottom: 20px;
    }
    .skills-category-box:last-child {
      margin-bottom: 0;
    }

    .skills-category-title {
      font-size: 0.96rem;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }

    .skills-grid-inner {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .skill-tile {
      padding: 12px 14px;
      background: var(--bg-subtle);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .skill-tile-name {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 3px;
    }

    .skill-tile-desc {
      font-size: 0.74rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    /* Certifications Grid */
    .cert-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .cert-card-tile {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: var(--bg-subtle);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .cert-icon-col {
      color: var(--primary);
      font-size: 1.1rem;
      padding-top: 2px;
    }

    .cert-info-col {
      min-width: 0;
      flex: 1;
    }

    .cert-title {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
      margin-bottom: 2px;
    }

    .cert-issuer {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    /* Leadership & Volunteering */
    .lead-item-card {
      padding: 14px 16px;
      background: var(--bg-subtle);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 10px;
    }

    .lead-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .lead-role {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .lead-org {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .lead-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* References */
    .ref-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .ref-card-box {
      padding: 18px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .ref-avatar-icon {
      font-size: 1.4rem;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .ref-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .ref-desig {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .ref-inst {
      font-size: 0.76rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .ref-contact {
      font-size: 0.74rem;
      color: var(--text-secondary);
      margin-top: 3px;
    }

    /* Documents & Presentations */
    .docs-portfolio-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
      margin-top: 10px;
    }
    .doc-portfolio-card {
      display: flex;
      gap: 14px;
      padding: 16px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .doc-portfolio-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
    }
    .doc-card-icon {
      font-size: 1.6rem;
      padding-top: 2px;
    }
    .doc-card-info {
      flex: 1;
      min-width: 0;
    }
    .doc-card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .doc-badge {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 9999px;
      border: 1px solid currentColor;
    }
    .doc-date {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .doc-card-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
      line-height: 1.35;
    }

    /* Photo Gallery */
    .gallery-portfolio-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .gallery-card-item {
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--bg-subtle);
    }
    .gallery-thumb-link {
      display: block;
      height: 160px;
      overflow: hidden;
    }
    .gallery-thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s ease;
    }
    .gallery-thumb-img:hover {
      transform: scale(1.04);
    }
    .gallery-caption {
      padding: 8px 10px;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Attached Briefs & Slides on Research / Projects */
    .card-attached-docs {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed var(--border-color);
    }
    .attached-docs-label {
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .attached-docs-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .doc-pill-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-color);
      font-size: 0.75rem;
      color: var(--text-primary);
      text-decoration: none;
      transition: border-color 0.15s ease;
    }
    .doc-pill-link:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
    .doc-pill-tag {
      font-size: 0.65rem;
      color: var(--text-muted);
      background: var(--bg-base);
      padding: 1px 4px;
      border-radius: 4px;
    }

    /* Closing Appreciation Card */
    .closing-card {
      text-align: center;
      padding: 36px 24px;
      background: var(--bg-card);
      border-radius: var(--card-radius);
    }

    .closing-card-title {
      font-family: var(--font-heading);
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .closing-card-sub {
      font-size: 0.88rem;
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto 20px;
    }

    /* Responsive Viewport Rules */
    @media (max-width: 1100px) {
      .split-layout-wrapper {
        grid-template-columns: 270px minmax(0, 1fr);
        gap: 16px;
      }
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Tablet & Phone Chrome Desktop Mode (769px - 1024px, especially 980px) */
    @media (max-width: 980px) {
      .split-layout-wrapper {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .sticky-sidebar-card {
        position: static;
        width: 100%;
      }
      .micro-badges-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .skills-grid-inner, .cert-grid, .ref-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Mobile (<= 768px, tested at 375px & 390px) */
    @media (max-width: 768px) {
      .nav-links-menu {
        display: none;
      }
      .mobile-toggle-btn {
        display: inline-flex;
      }
      .layout-container {
        padding: 0 12px;
        margin-top: 14px;
      }
      .feed-card {
        padding: 18px 14px;
      }
      .hero-banner-img {
        height: 150px;
      }
      .card-header-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .card-title-group {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        min-width: 0;
      }
      .kpi-grid {
        grid-template-columns: 1fr;
      }
      .micro-badges-grid {
        grid-template-columns: 1fr;
      }
      .skills-grid-inner, .cert-grid, .ref-grid {
        grid-template-columns: 1fr;
      }
      .evidence-thumbnails-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .about-intro-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .timeline-header-wrap {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }

    /* Mobile Drawer */
    .mobile-drawer {
      display: none;
      position: fixed;
      inset: 60px 0 0 0;
      background: var(--bg-card);
      z-index: 999;
      padding: 20px;
      overflow-y: auto;
      border-top: 1px solid var(--border-color);
    }
    .mobile-drawer.open {
      display: block;
    }
    .mobile-drawer-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
    }
    .mobile-drawer-link i {
      color: var(--primary);
      width: 20px;
    }
    .avatar-initials-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-subtle);
      color: var(--primary);
      font-size: 2.2rem;
    }

    ${isDemoMode ? `
    /* Strict View-Only Anti-Copy Protection in Demo Mode */
    body.demo-view-only, body.demo-view-only * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-user-drag: none !important;
    }
    .demo-view-only img, .demo-view-only a, .demo-view-only button {
      -webkit-user-drag: none !important;
    }
    .demo-anti-copy-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(15, 23, 42, 0.95);
      color: #f8fafc;
      padding: 10px 22px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid rgba(13, 148, 136, 0.4);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(13, 148, 136, 0.25);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
      z-index: 99999;
      text-align: center;
      white-space: nowrap;
    }
    .demo-anti-copy-toast.visible {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }
    ` : ''}
  </style>
</head>
<body class="${isDemoMode ? 'demo-view-only' : ''}">

  <!-- Top Sticky Navigation Bar (Exact 1:1 mdnafizurrahman8024.github.io) -->
  <header class="navbar" id="navbar">
    <div class="main-container nav-inner nav-container">
      <a href="#home" class="nav-brand">
        ${identity.navAvatar || identity.avatar ? `
          <img src="${sanitizeUrl(identity.navAvatar || identity.avatar)}" alt="${escapeHtml(identity.fullName)}" class="nav-brand-avatar" id="nav-avatar" loading="eager" decoding="async" onerror="this.onerror=null; this.src='assets/Image-2.png';">
        ` : ''}
        <div class="nav-brand-info nav-brand-text">
          <span class="nav-brand-name" id="nav-name">${escapeHtml(identity.fullName)}</span>
          <span class="nav-brand-sub nav-brand-role">${escapeHtml(identity.roleBadge || '')}</span>
        </div>
      </a>

      <nav>
        <ul class="nav-menu nav-links-menu" id="nav-menu">
          ${isVisible('about') ? `<li><a href="#about" class="nav-pill">About</a></li>` : ''}
          ${isVisible('education') ? `<li><a href="#education" class="nav-pill">Education</a></li>` : ''}
          ${isVisible('updates') ? `<li><a href="#updates" class="nav-pill">Updates</a></li>` : ''}
          ${isVisible('research') ? `<li><a href="#research" class="nav-pill"><span class="nav-text-full">Research &amp; Appointments</span><span class="nav-text-compact">Research</span></a></li>` : ''}
          ${isVisible('projects') ? `<li><a href="#projects" class="nav-pill"><span class="nav-text-full">Projects &amp; Platforms</span><span class="nav-text-compact">Projects</span></a></li>` : ''}
          ${isVisible('skills') ? `<li><a href="#skills" class="nav-pill">Skills</a></li>` : ''}
          ${isVisible('publications') ? `<li><a href="#publications" class="nav-pill">Publications</a></li>` : ''}
          ${isVisible('certifications') ? `<li><a href="#training" class="nav-pill"><span class="nav-text-full">Training &amp; Certifications</span><span class="nav-text-compact">Certifications</span></a></li>` : ''}
          <li class="nav-dropdown" id="nav-dropdown-more">
            <a href="javascript:void(0)" class="nav-pill" id="more-dropdown-btn">More <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 2px;"></i></a>
            <ul class="nav-dropdown-menu" id="nav-dropdown-menu">
              ${isVisible('leadership') ? `<li><a href="#leadership" class="nav-dropdown-item"><i class="fa-solid fa-users"></i> Leadership</a></li>` : ''}
              ${isVisible('gallery') ? `<li><a href="#gallery" class="nav-dropdown-item"><i class="fa-solid fa-images"></i> Gallery</a></li>` : ''}
              ${isVisible('references') ? `<li><a href="#references" class="nav-dropdown-item"><i class="fa-solid fa-user-tie"></i> References</a></li>` : ''}
              ${isVisible('contact') ? `<li><a href="#contact" class="nav-dropdown-item"><i class="fa-solid fa-location-dot"></i> Where to Find Me</a></li>` : ''}
              ${isVisible('contact') ? `<li><a href="#contact" class="nav-dropdown-item"><i class="fa-solid fa-envelope"></i> Contact Me</a></li>` : ''}
            </ul>
          </li>
        </ul>
      </nav>

      <div class="nav-actions">
        <button type="button" class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle Dark/Light Mode" title="Toggle Dark/Light Mode">
          <i class="fa-solid fa-sun" id="theme-toggle-icon"></i>
        </button>
        <button type="button" class="header-nav-toggle-btn mobile-menu-btn mobile-toggle-btn" id="header-nav-toggle" onclick="window.toggleUniversalNav(event)" aria-label="Toggle Navigation Menu" title="Navigation Menu (☰)">
          <i class="fa-solid fa-bars" id="header-nav-icon"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- Universal Bulletproof Navigation Drawer (Direct Child of <body>, 1:1 mdnafizurrahman8024.github.io) -->
  <div id="universal-nav-drawer" class="universal-nav-drawer header-nav-panel header-nav-drawer mobile-drawer" aria-hidden="true" style="display: none;">
    <div class="universal-nav-inner header-nav-panel-inner header-nav-drawer-inner">
      ${isVisible('about') ? `<a href="#about" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="about"><i class="fa-solid fa-user"></i> <span>About</span></a>` : ''}
      ${isVisible('education') ? `<a href="#education" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="education"><i class="fa-solid fa-graduation-cap"></i> <span>Education</span></a>` : ''}
      ${isVisible('updates') ? `<a href="#updates" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="updates"><i class="fa-solid fa-bolt"></i> <span>Updates</span></a>` : ''}
      ${isVisible('research') ? `<a href="#research" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="research"><i class="fa-solid fa-flask-vial"></i> <span>Research &amp; Appointments</span></a>` : ''}
      ${isVisible('projects') ? `<a href="#projects" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="projects"><i class="fa-solid fa-laptop-code"></i> <span>Projects &amp; Platforms</span></a>` : ''}
      ${isVisible('skills') ? `<a href="#skills" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="skills"><i class="fa-solid fa-screwdriver-wrench"></i> <span>Skills</span></a>` : ''}
      ${isVisible('publications') ? `<a href="#publications" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="publications"><i class="fa-solid fa-newspaper"></i> <span>Publications</span></a>` : ''}
      ${isVisible('certifications') ? `<a href="#training" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="training"><i class="fa-solid fa-certificate"></i> <span>Training &amp; Certifications</span></a>` : ''}
      ${isVisible('leadership') ? `<a href="#leadership" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="leadership"><i class="fa-solid fa-users"></i> <span>Leadership</span></a>` : ''}
      ${isVisible('gallery') ? `<a href="#gallery" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="gallery"><i class="fa-solid fa-images"></i> <span>Gallery</span></a>` : ''}
      ${isVisible('references') ? `<a href="#references" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="references"><i class="fa-solid fa-user-tie"></i> <span>References</span></a>` : ''}
      ${isVisible('contact') ? `<a href="#contact" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="location"><i class="fa-solid fa-location-dot"></i> <span>Where to Find Me</span></a>` : ''}
      ${isVisible('contact') ? `<a href="#contact" class="universal-nav-link header-nav-pill header-drawer-link mobile-drawer-link" data-target="contact"><i class="fa-solid fa-envelope"></i> <span>Contact</span></a>` : ''}
    </div>
  </div>

  <main class="layout-container">
    <div class="split-layout-wrapper">

      ${isSplitLayout ? `
      <!-- Left Sticky Sidebar -->
      <aside class="sticky-sidebar-card">
        <div class="sidebar-avatar-wrap">
          <img src="${sanitizeUrl(identity.avatar || '')}" alt="${escapeHtml(identity.fullName)}" class="sidebar-avatar-img" onerror="this.onerror=null; this.src='assets/ZUN.png';">
          <span class="sidebar-status-dot" title="Active"></span>
        </div>

        <div class="sidebar-status-pills">
          ${(identity.statusPills || []).map((p) => `<span class="pill-badge pill-info">${escapeHtml(p)}</span>`).join('')}
        </div>

        <h1 class="sidebar-name">${escapeHtml(identity.fullName)}</h1>
        <div class="sidebar-role">${escapeHtml(identity.roleBadge || '')}</div>

        ${identity.email ? `
          <a href="mailto:${escapeHtml(identity.email)}" class="sidebar-email-box">
            <i class="fa-solid fa-envelope"></i> ${escapeHtml(identity.email)}
          </a>
        ` : ''}

        <div class="micro-badges-grid">
          ${microBadgesHtml}
        </div>

        ${identity.quote ? `
          <div class="sidebar-motto">&ldquo;${escapeHtml(identity.quote)}&rdquo;</div>
        ` : ''}
      </aside>
      ` : ''}

      <!-- Right Scrollable Content Feed -->
      <div class="scrollable-feed">

        <!-- 1. Top Cover Banner (Animated Perimeter Gradient) -->
        ${layout.heroBanner && (identity.banner || isVisible('banner')) ? `
          <div class="hero-banner-card ${hasHeroBorder ? 'card-perimeter-gradient' : ''}" id="home">
            <img src="${sanitizeUrl(identity.banner || 'assets/Banner.png')}" alt="Cover Banner" class="hero-banner-img" onerror="this.onerror=null; this.src='assets/Banner.png';">
          </div>
        ` : ''}

        <!-- 2. About Card -->
        ${isVisible('about') ? `
        <section class="feed-card" id="about">
          <div class="about-intro-header">
            ${identity.introAvatar ? `
              <img src="${sanitizeUrl(identity.introAvatar)}" alt="${escapeHtml(identity.fullName)}" class="about-avatar-img" onerror="this.onerror=null; this.src='assets/Image-1.png';">
            ` : ''}
            <div>
              <h2 class="card-heading">${escapeHtml(identity.salutation || 'Hi, This is ' + (identity.shortName || identity.fullName))}</h2>
              <div class="card-subheading">${escapeHtml(identity.institution || identity.tagline || '')}</div>
            </div>
          </div>

          <div class="bio-paragraphs">
            ${(identity.bioParagraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
          </div>

          ${hobbies.length ? `
            <div class="hobbies-strip">
              ${hobbiesHtml}
            </div>
          ` : ''}

          ${metrics.length ? `
            <div class="kpi-grid">
              ${metricsHtml}
            </div>
          ` : ''}
        </section>
        ` : ''}

        <!-- 3. Education Timeline -->
        ${isVisible('education') && education.length ? `
        <section class="feed-card" id="education">
          ${renderSectionHeader('Academic Credentials & Education', 'University degree, clinical training, and foundational qualifications', 'fa-solid fa-graduation-cap')}
          <div class="timeline-list">
            ${educationHtml}
          </div>
        </section>
        ` : ''}

        <!-- 4. Recent Updates (Auto-moving Vertical Ticker) -->
        ${isVisible('updates') && updates.length ? `
        <section class="feed-card" id="updates">
          ${renderSectionHeader('Recent Updates & Milestones', 'Active manuscripts, registered protocols & computational deployments', 'fa-solid fa-bolt', 'var(--accent)')}
          ${updatesTickerHtml}
        </section>
        ` : ''}

        <!-- 5. Scientific Research & Appointments -->
        ${isVisible('research') && research.length ? `
        <section class="feed-card" id="research">
          ${renderSectionHeader('Research & Scientific Appointments', 'Laboratory triage, field surveillance, and verified evidence findings', 'fa-solid fa-flask-vial')}
          ${researchHtml}
        </section>
        ` : ''}

        <!-- 6. Projects & Platforms -->
        ${isVisible('projects') && projects.length ? `
        <section class="feed-card" id="projects">
          ${renderSectionHeader('Projects & Scientific Platforms', 'AI software, healthtech applications, briefs & source code', 'fa-solid fa-laptop-code', 'var(--accent)')}
          ${projectsHtml}
        </section>
        ` : ''}

        <!-- 7. Capabilities & Skills -->
        ${isVisible('skills') && skillsHtml ? `
        <section class="feed-card" id="skills">
          ${renderSectionHeader('Capabilities & Technical Skills', 'Laboratory diagnostics, field epidemiology, biometrics & programming', 'fa-solid fa-screwdriver-wrench')}
          ${skillsHtml}
        </section>
        ` : ''}

        <!-- 8. Publications -->
        ${isVisible('publications') && publications.length ? `
        <section class="feed-card" id="publications">
          ${renderSectionHeader('Publications & Preprints', 'Peer-reviewed articles, registered OSF protocols & conference proceedings', 'fa-solid fa-newspaper')}
          ${publicationsHtml}
        </section>
        ` : ''}

        <!-- 9. Training & Certifications -->
        ${isVisible('certifications') && certifications.length ? `
        <section class="feed-card" id="training">
          ${renderSectionHeader('Training & Professional Certifications', 'WHO ethics, diagnostics, epidemiological modeling & biostatistics', 'fa-solid fa-certificate', 'var(--accent)')}
          <div class="cert-grid">
            ${certificationsHtml}
          </div>
        </section>
        ` : ''}

        <!-- 10. Leadership & Volunteering -->
        ${(isVisible('leadership') && leadership.length) || (isVisible('volunteering') && volunteering.length) ? `
        <section class="feed-card" id="leadership">
          ${renderSectionHeader('Leadership & Impact', 'Institutional leadership and emergency wildlife rescue operations', 'fa-solid fa-users')}
          ${leadershipHtml}
          ${volunteeringHtml}
        </section>
        ` : ''}

        <!-- 11. References -->
        ${isVisible('references') && references.length ? `
        <section class="feed-card" id="references">
          ${renderSectionHeader('Academic References', 'Departmental mentors, principal investigators, and collaborators', 'fa-solid fa-user-tie')}
          <div class="ref-grid">
            ${referencesHtml}
          </div>
        </section>
        ` : ''}

        <!-- 11b. Titled Documents, Briefs & Slides -->
        ${isVisible('documents') && documents.length ? `
        <section class="feed-card" id="documents">
          ${renderSectionHeader('Titled Documents, Briefs & Slides', 'Curated presentations, pitch decks, whitepapers & formal reports', 'fa-solid fa-folder-open', 'var(--accent)')}
          <div class="docs-portfolio-grid">
            ${documentsHtml}
          </div>
        </section>
        ` : ''}

        <!-- 11c. Photo Gallery & Field Documentation (Auto-moving Horizontal Marquee) -->
        ${isVisible('gallery') && gallery.length ? `
        <section class="feed-card" id="gallery">
          ${renderSectionHeader('Photo Gallery & Field Documentation', 'Verified field visits, wildlife rescues, and laboratory bench documentation', 'fa-regular fa-images')}
          ${galleryHtml}
        </section>
        ` : ''}

        <!-- 12. Contact Card & Interactive Google Map -->
        ${isVisible('contact') ? `
        <section class="feed-card" id="contact">
          ${renderSectionHeader('Where to Find Me & Get in Touch', 'Location, institutional office, and verified communication channels', 'fa-solid fa-location-dot')}
          
          <div class="map-toggle-bar">
            <div class="map-toggle-group">
              <button type="button" class="map-toggle-pill active" id="map-btn-satellite" onclick="window.switchMapMode('satellite')">
                <i class="fa-solid fa-satellite"></i> Satellite View
              </button>
              <button type="button" class="map-toggle-pill" id="map-btn-standard" onclick="window.switchMapMode('standard')">
                <i class="fa-solid fa-map"></i> Standard Map
              </button>
            </div>
            <button type="button" class="coord-copy-pill" id="coord-copy-pill" onclick="window.copyCoordinates()" title="Click to copy GPS coordinates">
              <span class="live-pulse-dot"></span>
              <span>24.374043° N, 88.644182° E</span>
              <i class="fa-solid fa-copy"></i>
            </button>
          </div>

          <div class="map-embed-container">
            <iframe id="google-map-iframe" src="https://maps.google.com/maps?q=24.374042779653543,88.64418181747487&amp;t=h&amp;z=17&amp;ie=UTF8&amp;iwloc=A&amp;output=embed" width="100%" height="290" style="border:0; display:block;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Map Location"></iframe>
          </div>

          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 16px;">
            ${identity.location?.rawAddress ? `<strong>Address:</strong> ${escapeHtml(identity.location.rawAddress)}<br>` : ''}
            ${identity.email ? `<strong>Email:</strong> <a href="mailto:${escapeHtml(identity.email)}">${escapeHtml(identity.email)}</a><br>` : ''}
            ${identity.emailUniversity ? `<strong>University:</strong> <a href="mailto:${escapeHtml(identity.emailUniversity)}">${escapeHtml(identity.emailUniversity)}</a><br>` : ''}
            ${identity.phone ? `<strong>Phone:</strong> ${escapeHtml(identity.phone)}` : ''}
          </p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${identity.email ? `<a href="mailto:${escapeHtml(identity.email)}" class="btn-action-primary"><i class="fa-solid fa-envelope"></i> Direct Email</a>` : ''}
            ${identity.whatsapp ? `<a href="${sanitizeUrl(identity.whatsapp)}" target="_blank" rel="noopener noreferrer" class="btn-subtle"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : ''}
            <a href="https://maps.google.com/?q=24.374042779653543,88.64418181747487" target="_blank" rel="noopener noreferrer" class="btn-subtle"><i class="fa-solid fa-diamond-turn-right"></i> Directions</a>
          </div>
          ${(displayConfig.contactConfig?.mode === 'web3forms' || displayConfig.contactConfig?.showForm) ? `
          <form action="https://api.web3forms.com/submit" method="POST" class="portfolio-contact-form" style="margin-top: 16px; display: grid; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <input type="hidden" name="access_key" value="${escapeHtml(displayConfig.contactConfig?.accessKey || 'YOUR_ACCESS_KEY')}">
            <input type="hidden" name="subject" value="New Collaboration Inquiry from ZunDeck Portfolio">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              <input type="text" name="name" placeholder="Your Name" required style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-subtle); color: var(--text-primary); font-size: 0.88rem;">
              <input type="email" name="email" placeholder="Your Email Address" required style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-subtle); color: var(--text-primary); font-size: 0.88rem;">
            </div>
            <textarea name="message" rows="3" placeholder="Collaboration or research message..." required style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-subtle); color: var(--text-primary); font-size: 0.88rem; resize: vertical;"></textarea>
            <button type="submit" class="btn-action-primary" style="cursor: pointer; justify-content: center;"><i class="fa-solid fa-paper-plane"></i> Send to Gmail</button>
          </form>
          ` : ''}
        </section>
        ` : ''}

        <!-- 13. Closing Appreciation Card (Animated Perimeter Gradient) -->
        ${layout.closingCard ? `
        <div class="closing-card ${hasClosingBorder ? 'card-perimeter-gradient' : ''}">
          <h3 class="closing-card-title">Thank You for Visiting</h3>
          <p class="closing-card-sub">Open to collaborative research in One Health, computational biology, and innovative healthtech.</p>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
            ZunDeck &bull; Crafted with Clean Unslop Architecture &bull; ${new Date().getFullYear()}
          </div>
        </div>
        ` : ''}

      </div>
    </div>
  </main>

  <!-- Floating CV PDF Action Pill -->
  <a href="${sanitizeUrl(documents.find(d => (typeof d === 'object' && d?.docType === 'pdf'))?.url || 'https://mdnafizurrahman8024.github.io/CV_Nafiz.pdf')}" target="_blank" rel="noopener noreferrer" class="floating-cv-pill" title="Download Verified Curriculum Vitae">
    <i class="fa-solid fa-file-pdf"></i>
    <span>Download CV (PDF)</span>
  </a>

  <script>
    (function() {
      // 1. Exact 1:1 Universal Navigation Drawer & Scroll Engine (mdnafizurrahman8024.github.io)
      function openUniversalNav() {
        var drawer = document.getElementById('universal-nav-drawer') || document.getElementById('mobile-drawer');
        var toggleBtn = document.getElementById('header-nav-toggle') || document.getElementById('mobile-toggle-btn');
        var header = document.getElementById('navbar') || document.getElementById('top-navbar');
        if (!drawer) return;
        if (header) {
          var rect = header.getBoundingClientRect();
          drawer.style.top = (rect.bottom > 0 ? (rect.bottom + 6) : 66) + 'px';
        }
        drawer.classList.add('open', 'active');
        drawer.style.display = 'block';
        drawer.setAttribute('aria-hidden', 'false');
        if (toggleBtn) {
          toggleBtn.classList.add('active');
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      }

      function closeUniversalNav() {
        var drawer = document.getElementById('universal-nav-drawer') || document.getElementById('mobile-drawer');
        var toggleBtn = document.getElementById('header-nav-toggle') || document.getElementById('mobile-toggle-btn');
        if (!drawer) return;
        drawer.classList.remove('open', 'active');
        drawer.style.display = 'none';
        drawer.setAttribute('aria-hidden', 'true');
        if (toggleBtn) {
          toggleBtn.classList.remove('active');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      }

      window.toggleUniversalNav = function(e) {
        if (e) {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
        }
        var drawer = document.getElementById('universal-nav-drawer') || document.getElementById('mobile-drawer');
        if (!drawer) return;
        var isOpen = drawer.classList.contains('open') || drawer.style.display === 'block';
        if (isOpen) closeUniversalNav(); else openUniversalNav();
      };
      window.openUniversalNav = openUniversalNav;
      window.closeUniversalNav = closeUniversalNav;

      // Close drawer & dropdown on outside click
      document.addEventListener('click', function(e) {
        var drawer = document.getElementById('universal-nav-drawer') || document.getElementById('mobile-drawer');
        var toggleBtn = document.getElementById('header-nav-toggle') || document.getElementById('mobile-toggle-btn');
        if (drawer && (drawer.classList.contains('open') || drawer.style.display === 'block')) {
          if (!drawer.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
            closeUniversalNav();
          }
        }
        var moreDropdown = document.getElementById('nav-dropdown-more');
        if (moreDropdown && !moreDropdown.contains(e.target)) {
          moreDropdown.classList.remove('active', 'open');
        }
      });

      // More dropdown toggle on click
      var moreBtn = document.getElementById('more-dropdown-btn');
      var moreDropdown = document.getElementById('nav-dropdown-more');
      if (moreBtn && moreDropdown) {
        moreBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          moreDropdown.classList.toggle('open');
          moreDropdown.classList.toggle('active');
        });
      }

      // Smooth scroll for all internal anchor links (smoothly scrolls INSIDE iframe, zero reload)
      document.addEventListener('click', function(e) {
        var anchor = e.target.closest('a');
        if (!anchor) return;
        var href = anchor.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          e.stopPropagation();
          closeUniversalNav();
          if (moreDropdown) moreDropdown.classList.remove('active', 'open');

          if (href === '#' || href === '#top' || href === '#home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          var targetId = href.replace(/^#/, '');
          var targetEl = document.getElementById(targetId);
          if (!targetEl && (targetId === 'location' || targetId === 'contact')) {
            targetEl = document.getElementById('contact') || document.getElementById('location');
          }
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, true);

      // Active Section Highlighting
      var activeSectionIds = ['about', 'education', 'updates', 'research', 'projects', 'skills', 'publications', 'training', 'leadership', 'gallery', 'references', 'contact'];
      var moreSectionIds = ['leadership', 'gallery', 'references', 'location', 'contact'];
      if ('IntersectionObserver' in window) {
        var observedSections = document.querySelectorAll('section[id], div[id="home"]');
        var sectionObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              var sId = entry.target.id;
              var isMoreActive = moreSectionIds.indexOf(sId) !== -1;
              if (moreBtn) {
                moreBtn.classList.toggle('active', isMoreActive);
                moreBtn.classList.toggle('nav-tab-active', isMoreActive);
              }
              var allLinks = document.querySelectorAll('#nav-menu a[href^="#"], #universal-nav-drawer a[href^="#"]');
              allLinks.forEach(function(l) {
                if (l.id === 'more-dropdown-btn') return;
                var h = l.getAttribute('href');
                var match = h === ('#' + sId);
                l.classList.toggle('active', match);
                l.classList.toggle('nav-tab-active', match);
              });
            }
          });
        }, { threshold: 0.2 });
        observedSections.forEach(function(s) { sectionObserver.observe(s); });
      }

      // 2. Google Map Satellite vs Standard View Switcher
      window.switchMapMode = function(mode) {
        var mapIframe = document.getElementById('google-map-iframe');
        var btnSat = document.getElementById('map-btn-satellite');
        var btnStd = document.getElementById('map-btn-standard');
        if (!mapIframe) return;
        var lat = '24.374042779653543';
        var lng = '88.64418181747487';
        var tParam = mode === 'satellite' ? 'h' : 'm';
        mapIframe.src = 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&t=' + tParam + '&z=17&ie=UTF8&iwloc=A&output=embed';
        if (btnSat) btnSat.classList.toggle('active', mode === 'satellite');
        if (btnStd) btnStd.classList.toggle('active', mode === 'standard');
      };

      // 3. Coordinate Copy Button
      window.copyCoordinates = function() {
        var coords = '24.374043° N, 88.644182° E';
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(coords);
          }
          var pill = document.getElementById('coord-copy-pill');
          if (pill) {
            var oldHtml = pill.innerHTML;
            pill.innerHTML = '<span class="live-pulse-dot"></span><span>Copied to Clipboard!</span><i class="fa-solid fa-check" style="color:#10b981;"></i>';
            setTimeout(function() { pill.innerHTML = oldHtml; }, 2000);
          }
        } catch(err) {}
      };

      // 4. Gallery Category Filter Pills
      var galleryPills = document.querySelectorAll('.gallery-pill');
      if (galleryPills.length) {
        galleryPills.forEach(function(pill) {
          pill.addEventListener('click', function() {
            galleryPills.forEach(function(p) { p.classList.remove('active'); });
            pill.classList.add('active');
          });
        });
      }

      // 5. Theme Toggle Logic
      var toggleBtn = document.getElementById('theme-toggle') || document.getElementById('theme-toggle-btn');
      var html = document.documentElement;
      if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
          var current = html.getAttribute('data-theme') || 'dark';
          var next = current === 'dark' ? 'light' : 'dark';
          html.setAttribute('data-theme', next);
          try { localStorage.setItem('zundeck_theme', next); } catch(e) {}
        });
      }

      // 7. Interactive View-Only Live Demo Mode & Anti-Copy Protection
      ${isDemoMode ? `
      function showDemoToast(msg) {
        var toast = document.getElementById('demo-anti-copy-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'demo-anti-copy-toast';
          toast.className = 'demo-anti-copy-toast';
          document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('visible');
        clearTimeout(window.__demoToastTimer);
        window.__demoToastTimer = setTimeout(function() {
          toast.classList.remove('visible');
        }, 2800);
      }

      // Block right-click context menu
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showDemoToast("Demo Preview Only — Click 'Use & Edit This Design' to build your own portfolio & CV");
        return false;
      });

      // Block dragging of images, text, and elements
      document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
      });

      // Block copy / save / print keyboard shortcuts
      document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && ['c', 's', 'u', 'p', 'C', 'S', 'U', 'P'].indexOf(e.key) !== -1) {
          e.preventDefault();
          showDemoToast("Demo Preview Only — Click 'Use & Edit This Design' to build your own portfolio & CV");
          return false;
        }
      });

      // Intercept direct CV download links
      document.addEventListener('click', function(e) {
        var cvBtn = e.target.closest('a[download], a[href*=".pdf"], .floating-cv-pill, .btn-download-cv');
        if (cvBtn) {
          e.preventDefault();
          e.stopPropagation();
          showDemoToast("Demo Preview Only — Click 'Use & Edit This Design' to build your own portfolio & CV");
          try {
            window.parent.postMessage({ type: 'DEMO_ACTION_BLOCKED', action: 'download_cv' }, '*');
          } catch(_) {}
          return false;
        }
      }, true);
      ` : ''}
    })();
  </script>
</body>
</html>`;
}

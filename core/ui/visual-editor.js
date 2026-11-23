import { PORTFOLIO_CATALOG, getTemplateById } from '../templates/portfolio-catalog.js';
import { CV_CATALOG, getCvTemplateById } from '../templates/cv-catalog.js';
import { escapeHtml, sanitizeUrl } from '../security/index.js';
import { createAutoSaveController } from '../storage/auto-save-engine.js';
import { saveWorkspace } from '../storage/vault-storage.js';
import { BADGE_PRESETS, renderBadgePickerHtml, renderBadgePill } from './badge-picker.js';
import { LINK_PLATFORMS, renderLinksEditorHtml, normalizeLinks } from './links-manager.js';
import { renderLocationContactEditorHtml, updateProfileLocation, updateProfileContactConfig } from './location-contact-editor.js';
import { fetchPublicationByDoi, fetchWorksByOrcid } from '../parsers/doi-orcid-fetcher.js';
import { renderMediaManagerHtml, MediaManagerController } from './media-manager.js';
import { renderDocsManagerHtml, DocsManagerController } from './docs-manager.js';

export class VisualEditorController {
  constructor(options = {}) {
    this.profile = options.profile || {};
    this.container = options.container || null;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.onStatusChange = typeof options.onStatusChange === 'function' ? options.onStatusChange : () => {};
    this.activeTab = options.activeTab || 'identity';

    // 2-second debounced auto-save controller
    this.autoSave = createAutoSaveController({
      debounceMs: 2000,
      saveFn: async (profileToSave) => {
        saveWorkspace(profileToSave);
      },
      onStatusChange: (status) => {
        this.onStatusChange(status);
      }
    });
  }

  setProfile(profile) {
    this.profile = profile;
    this.render();
  }

  notifyChange() {
    this.profile.meta = this.profile.meta || {};
    this.profile.meta.lastModified = new Date().toISOString();
    this.autoSave.queueChange(this.profile);
    this.onChange(this.profile);
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = this.generateEditorHtml();
    this.bindEvents();
  }

  generateEditorHtml() {
    const identity = this.profile.identity || {};
    const displayConfig = this.profile.displayConfig || {};
    const themeTokens = displayConfig.themeTokens || {};
    const seeAllLimit = displayConfig.seeAllLimit || { research: 3, projects: 3, publications: 4, certifications: 6 };
    const gridCols = displayConfig.cardGridColumns || '2x';
    const gradientBorders = displayConfig.gradientBorders || 'hero';

    return `
      <div class="visual-editor-root">
        <!-- Editor Navigation Header -->
        <div class="ve-tabs-nav" role="tablist">
          <button type="button" class="ve-tab-btn ${this.activeTab === 'identity' ? 'active' : ''}" data-ve-tab="identity">
            <i class="fa-solid fa-user"></i> <span>Identity</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'links' ? 'active' : ''}" data-ve-tab="links">
            <i class="fa-solid fa-share-nodes"></i> <span>Links Hub</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'publications' ? 'active' : ''}" data-ve-tab="publications">
            <i class="fa-solid fa-book-journal-whills"></i> <span>Publications &amp; DOI</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'research' ? 'active' : ''}" data-ve-tab="research">
            <i class="fa-solid fa-flask-vial"></i> <span>Research</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'projects' ? 'active' : ''}" data-ve-tab="projects">
            <i class="fa-solid fa-laptop-code"></i> <span>Projects</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'education' ? 'active' : ''}" data-ve-tab="education">
            <i class="fa-solid fa-graduation-cap"></i> <span>Education</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'certifications' ? 'active' : ''}" data-ve-tab="certifications">
            <i class="fa-solid fa-award"></i> <span>Certificates</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'media' ? 'active' : ''}" data-ve-tab="media">
            <i class="fa-solid fa-photo-film"></i> <span>Media &amp; Gallery</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'documents' ? 'active' : ''}" data-ve-tab="documents">
            <i class="fa-solid fa-folder-open"></i> <span>Documents &amp; Slides</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'contact' ? 'active' : ''}" data-ve-tab="contact">
            <i class="fa-solid fa-map-location-dot"></i> <span>Map &amp; Contact</span>
          </button>
          <button type="button" class="ve-tab-btn ${this.activeTab === 'customizer' ? 'active' : ''}" data-ve-tab="customizer">
            <i class="fa-solid fa-sliders"></i> <span>Customizer</span>
          </button>
        </div>

        <!-- Editor Tab Panes -->
        <div class="ve-content-pane">
          ${this.renderActiveTabContent()}
        </div>
      </div>
    `;
  }

  renderActiveTabContent() {
    switch (this.activeTab) {
      case 'identity':
        return this.renderIdentityPane();
      case 'links':
        return renderLinksEditorHtml(this.profile.links || {}, this.profile.displayConfig?.linksVisibility || {});
      case 'publications':
        return this.renderPublicationsPane();
      case 'research':
        return this.renderResearchPane();
      case 'projects':
        return this.renderProjectsPane();
      case 'education':
        return this.renderEducationPane();
      case 'certifications':
        return this.renderCertificationsPane();
      case 'media':
        return this.renderMediaPane();
      case 'documents':
        return this.renderDocumentsPane();
      case 'contact':
        return renderLocationContactEditorHtml(this.profile);
      case 'customizer':
        return this.renderCustomizerPane();
      default:
        return this.renderIdentityPane();
    }
  }

  renderIdentityPane() {
    const id = this.profile.identity || {};
    return `
      <div class="ve-section-pane">
        <div class="pane-header">
          <h3>Professional Identity &amp; Bio</h3>
          <p>Curate your primary academic role, biography paragraphs, and verified presence.</p>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="ve-fullname">Full Name</label>
            <input type="text" id="ve-fullname" class="form-input" value="${escapeHtml(id.fullName || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ve-shortname">Short / Display Name</label>
            <input type="text" id="ve-shortname" class="form-input" value="${escapeHtml(id.shortName || '')}">
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="ve-rolebadge">Role Badge / Degree</label>
            <input type="text" id="ve-rolebadge" class="form-input" value="${escapeHtml(id.roleBadge || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ve-availability">Availability Status</label>
            <input type="text" id="ve-availability" class="form-input" value="${escapeHtml(id.availabilityStatus || '')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="ve-tagline">Professional Tagline / Headline</label>
          <input type="text" id="ve-tagline" class="form-input" value="${escapeHtml(id.tagline || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="ve-quote">Philosophy Quote</label>
          <input type="text" id="ve-quote" class="form-input" value="${escapeHtml(id.quote || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="ve-bio">Biography Paragraphs (Separate paragraphs with blank lines)</label>
          <textarea id="ve-bio" class="form-textarea" rows="4">${escapeHtml((id.bioParagraphs || []).join('\n\n'))}</textarea>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="ve-avatar">Avatar URL or File Name</label>
            <input type="text" id="ve-avatar" class="form-input" value="${escapeHtml(id.avatar || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ve-banner">Banner Image URL or File Name</label>
            <input type="text" id="ve-banner" class="form-input" value="${escapeHtml(id.banner || '')}">
          </div>
        </div>
      </div>
    `;
  }

  renderPublicationsPane() {
    const pubs = Array.isArray(this.profile.publications) ? this.profile.publications : [];
    const listHtml = pubs.map((pub, idx) => `
      <div class="ve-item-card" data-drag-item="pub" data-index="${idx}" draggable="true">
        <div class="ve-item-header">
          <div class="drag-handle" data-drag-handle="true"><i class="fa-solid fa-grip-vertical"></i></div>
          <div class="item-title-wrap">
            <span class="item-title">${escapeHtml(pub.title || 'Untitled Manuscript')}</span>
            <div class="item-meta">
              ${pub.badge ? renderBadgePill(pub.badge) : ''}
              <span class="meta-year">${pub.year || ''}</span>
              ${pub.journal ? `<span class="meta-journal">${escapeHtml(pub.journal)}</span>` : ''}
              ${pub.doi ? `<span class="meta-doi">DOI: ${escapeHtml(pub.doi)}</span>` : ''}
            </div>
          </div>
          <div class="item-actions">
            <button type="button" class="btn-icon-subtle" data-action="move-up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
            <button type="button" class="btn-icon-subtle" data-action="move-down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
            <button type="button" class="btn-icon-danger" data-action="delete-pub" data-index="${idx}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `).join('\n');

    return `
      <div class="ve-section-pane">
        <div class="pane-header-with-actions">
          <div>
            <h3>Scientific Publications &amp; Auto-Filler</h3>
            <p>1-Click instant fetch via Crossref DOI or ORCID Public Works.</p>
          </div>
          <button type="button" class="btn-sm btn-primary" id="btn-add-manual-pub">
            <i class="fa-solid fa-plus"></i> Manual Paper
          </button>
        </div>

        <!-- 1-Click DOI / ORCID Fetcher Widget -->
        <div class="auto-filler-box">
          <div class="filler-row">
            <div class="filler-input-wrap">
              <label class="form-label" for="input-doi-fetch">1-Click DOI Fetcher (Crossref)</label>
              <div class="input-with-button">
                <input type="text" id="input-doi-fetch" class="form-input" placeholder="e.g. 10.1016/j.onehlt.2024.10042">
                <button type="button" class="btn-primary" id="btn-fetch-doi"><i class="fa-solid fa-bolt"></i> Fetch DOI</button>
              </div>
            </div>
            <div class="filler-input-wrap">
              <label class="form-label" for="input-orcid-fetch">ORCID Import (Public Works)</label>
              <div class="input-with-button">
                <input type="text" id="input-orcid-fetch" class="form-input" placeholder="e.g. 0009-0008-3918-187X">
                <button type="button" class="btn-primary" id="btn-fetch-orcid"><i class="fa-solid fa-cloud-arrow-down"></i> Import Works</button>
              </div>
            </div>
          </div>
          <div id="doi-fetch-status" class="fetch-status-msg" style="display: none;"></div>
        </div>

        <div class="ve-items-list" id="publications-list-container">
          ${listHtml || '<p class="empty-hint">No publications added yet. Paste a DOI or ORCID above to import instantly.</p>'}
        </div>
      </div>
    `;
  }

  renderResearchPane() {
    const list = Array.isArray(this.profile.research) ? this.profile.research : [];
    const listHtml = list.map((res, idx) => `
      <div class="ve-item-card" data-drag-item="research" data-index="${idx}" draggable="true">
        <div class="ve-item-header">
          <div class="drag-handle" data-drag-handle="true"><i class="fa-solid fa-grip-vertical"></i></div>
          <div class="item-title-wrap">
            <span class="item-title">${escapeHtml(res.title || 'Untitled Research')}</span>
            <div class="item-meta">
              ${res.badge ? renderBadgePill(res.badge) : ''}
              ${res.category ? `<span class="pill-badge pill-info">${escapeHtml(res.category)}</span>` : ''}
              <span class="meta-year">${escapeHtml(res.period || '')}</span>
            </div>
          </div>
          <div class="item-actions">
            <button type="button" class="btn-icon-subtle" data-action="move-up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
            <button type="button" class="btn-icon-subtle" data-action="move-down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
            <button type="button" class="btn-icon-danger" data-action="delete-research" data-index="${idx}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `).join('\n');

    return `
      <div class="ve-section-pane">
        <div class="pane-header-with-actions">
          <div>
            <h3>Scientific Research Studies</h3>
            <p>Peer-reviewed protocols, clinical trials, epidemiology surveillance, and meta-analyses.</p>
          </div>
          <button type="button" class="btn-sm btn-primary" id="btn-add-research"><i class="fa-solid fa-plus"></i> Add Research</button>
        </div>
        <div class="ve-items-list" id="research-list-container">
          ${listHtml || '<p class="empty-hint">No research studies added yet.</p>'}
        </div>
      </div>
    `;
  }

  renderProjectsPane() {
    const list = Array.isArray(this.profile.projects) ? this.profile.projects : [];
    const listHtml = list.map((proj, idx) => `
      <div class="ve-item-card" data-drag-item="projects" data-index="${idx}" draggable="true">
        <div class="ve-item-header">
          <div class="drag-handle" data-drag-handle="true"><i class="fa-solid fa-grip-vertical"></i></div>
          <div class="item-title-wrap">
            <span class="item-title">${escapeHtml(proj.title || 'Untitled Project')}</span>
            <div class="item-meta">
              ${proj.badge ? renderBadgePill(proj.badge) : ''}
              ${proj.category ? `<span class="pill-badge pill-info">${escapeHtml(proj.category)}</span>` : ''}
            </div>
          </div>
          <div class="item-actions">
            <button type="button" class="btn-icon-subtle" data-action="move-up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
            <button type="button" class="btn-icon-subtle" data-action="move-down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
            <button type="button" class="btn-icon-danger" data-action="delete-project" data-index="${idx}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `).join('\n');

    return `
      <div class="ve-section-pane">
        <div class="pane-header-with-actions">
          <div>
            <h3>Scientific Platforms &amp; Software Projects</h3>
            <p>Web tools, open-source computational pipelines, and mobile health apps.</p>
          </div>
          <button type="button" class="btn-sm btn-primary" id="btn-add-project"><i class="fa-solid fa-plus"></i> Add Project</button>
        </div>
        <div class="ve-items-list" id="projects-list-container">
          ${listHtml || '<p class="empty-hint">No projects added yet.</p>'}
        </div>
      </div>
    `;
  }

  renderEducationPane() {
    const list = Array.isArray(this.profile.education) ? this.profile.education : [];
    const listHtml = list.map((edu, idx) => `
      <div class="ve-item-card" data-drag-item="education" data-index="${idx}" draggable="true">
        <div class="ve-item-header">
          <div class="drag-handle" data-drag-handle="true"><i class="fa-solid fa-grip-vertical"></i></div>
          <div class="item-title-wrap">
            <span class="item-title">${escapeHtml(edu.degree || 'Degree')}</span>
            <div class="item-meta">
              <span class="meta-inst">${escapeHtml(edu.institution || '')}</span>
              <span class="meta-year">${escapeHtml(edu.period || '')}</span>
              ${edu.badge ? renderBadgePill(edu.badge) : ''}
            </div>
          </div>
          <div class="item-actions">
            <button type="button" class="btn-icon-subtle" data-action="move-up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
            <button type="button" class="btn-icon-subtle" data-action="move-down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
            <button type="button" class="btn-icon-danger" data-action="delete-education" data-index="${idx}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `).join('\n');

    return `
      <div class="ve-section-pane">
        <div class="pane-header-with-actions">
          <div>
            <h3>Education Timeline</h3>
            <p>Academic degrees, universities, semesters, and clinical milestones.</p>
          </div>
          <button type="button" class="btn-sm btn-primary" id="btn-add-education"><i class="fa-solid fa-plus"></i> Add Degree</button>
        </div>
        <div class="ve-items-list" id="education-list-container">
          ${listHtml || '<p class="empty-hint">No education records added yet.</p>'}
        </div>
      </div>
    `;
  }

  renderCertificationsPane() {
    const list = Array.isArray(this.profile.certifications) ? this.profile.certifications : [];
    const listHtml = list.map((cert, idx) => `
      <div class="ve-item-card" data-drag-item="certifications" data-index="${idx}" draggable="true">
        <div class="ve-item-header">
          <div class="drag-handle" data-drag-handle="true"><i class="fa-solid fa-grip-vertical"></i></div>
          <div class="item-title-wrap">
            <span class="item-title">${escapeHtml(cert.title || 'Certification')}</span>
            <div class="item-meta">
              <span class="meta-inst">${escapeHtml(cert.issuer || cert.organization || '')}</span>
              <span class="meta-year">${escapeHtml(cert.date || '')}</span>
              ${cert.badge ? renderBadgePill(cert.badge) : ''}
            </div>
          </div>
          <div class="item-actions">
            <button type="button" class="btn-icon-subtle" data-action="move-up" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
            <button type="button" class="btn-icon-subtle" data-action="move-down" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
            <button type="button" class="btn-icon-danger" data-action="delete-certification" data-index="${idx}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `).join('\n');

    return `
      <div class="ve-section-pane">
        <div class="pane-header-with-actions">
          <div>
            <h3>Certifications, WHO Credentials &amp; Training</h3>
            <p>Verified certificates with credential IDs and external verification links.</p>
          </div>
          <button type="button" class="btn-sm btn-primary" id="btn-add-certification"><i class="fa-solid fa-plus"></i> Add Certificate</button>
        </div>
        <div class="ve-items-list" id="certifications-list-container">
          ${listHtml || '<p class="empty-hint">No certifications added yet.</p>'}
        </div>
      </div>
    `;
  }

  renderMediaPane() {
    const id = this.profile.identity || {};
    return `
      <div class="ve-section-pane">
        <div class="pane-header">
          <h3>Media, Avatars &amp; Photo Gallery</h3>
          <p>Single &amp; multi-file drag-and-drop uploader with consent-based 24-bit optimization and byte-perfect Undo Original.</p>
        </div>
        <div class="form-grid-2" style="margin-bottom: 20px;">
          <div class="form-group">
            <label class="form-label" for="ve-avatar-media">Profile Avatar (URL or File)</label>
            <input type="text" id="ve-avatar-media" class="form-input" value="${escapeHtml(id.avatar || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="ve-banner-media">Hero Banner (URL or File)</label>
            <input type="text" id="ve-banner-media" class="form-input" value="${escapeHtml(id.banner || '')}">
          </div>
        </div>
        <div id="ve-gallery-manager-mount">
          ${renderMediaManagerHtml(this.profile.gallery || [], {
            title: 'Portfolio Photo Gallery',
            description: 'Drag & drop photos from Windows Explorer. Reorder with handles or arrows.',
            context: 'gallery'
          })}
        </div>
      </div>
    `;
  }

  renderDocumentsPane() {
    return `
      <div class="ve-section-pane">
        <div class="pane-header">
          <h3>Titled Documents, Briefs &amp; Presentations</h3>
          <p>Attach Google Drive slides, presentations, Word docs, and direct PDFs with inline previews.</p>
        </div>
        <div id="ve-docs-manager-mount">
          ${renderDocsManagerHtml(this.profile.documents || [], {
            title: 'Master Portfolio Documents & Presentations',
            description: 'Direct PDFs or Google Drive links with smart embed conversions.',
            sectionTag: 'General'
          })}
        </div>
      </div>
    `;
  }

  renderCustomizerPane() {
    const cfg = this.profile.displayConfig || {};
    const themeTokens = cfg.themeTokens || {};
    const seeAllLimit = cfg.seeAllLimit || { research: 3, projects: 3, publications: 4, certifications: 6 };
    const gridCols = cfg.cardGridColumns || '2x';
    const gradientBorders = cfg.gradientBorders || 'hero';
    const activePortTpl = cfg.portfolioTemplateId || 'acad-flagship';

    // 30 Portfolio templates list
    const portTemplatesHtml = PORTFOLIO_CATALOG.map((t) => {
      const isSelected = t.id === activePortTpl;
      return `
        <div class="template-pick-card ${isSelected ? 'selected' : ''}" data-pick-portfolio="${t.id}">
          <div class="pick-card-header">
            <span class="pick-name">${escapeHtml(t.name)}</span>
            ${t.id === 'acad-flagship' ? '<span class="pill-badge pill-gold">#1 Recommended</span>' : ''}
          </div>
          <span class="pick-category">${escapeHtml(t.category)}</span>
        </div>
      `;
    }).join('\n');

    return `
      <div class="ve-section-pane">
        <div class="pane-header">
          <h3>Portfolio &amp; CV Customization Drawer</h3>
          <p>Fine-tune colors, grid columns, animated gradient borders, and initial item limits.</p>
        </div>

        <div class="customizer-grid">
          <!-- Card Grid Columns -->
          <div class="form-group">
            <label class="form-label">Card Grid Columns (Desktop)</label>
            <div class="segmented-control" id="control-grid-cols">
              <button type="button" class="seg-btn ${gridCols === '1x' ? 'active' : ''}" data-val="1x">1x Wide</button>
              <button type="button" class="seg-btn ${gridCols === '2x' ? 'active' : ''}" data-val="2x">2x Standard</button>
              <button type="button" class="seg-btn ${gridCols === '3x' ? 'active' : ''}" data-val="3x">3x Compact</button>
            </div>
          </div>

          <!-- Animated Gradient Borders Toggle -->
          <div class="form-group">
            <label class="form-label">Animated Gradient Border Accent</label>
            <div class="segmented-control" id="control-gradient-borders">
              <button type="button" class="seg-btn ${gradientBorders === 'hero' ? 'active' : ''}" data-val="hero">Hero Banner</button>
              <button type="button" class="seg-btn ${gradientBorders === 'closing' ? 'active' : ''}" data-val="closing">Closing Card</button>
              <button type="button" class="seg-btn ${gradientBorders === 'off' ? 'active' : ''}" data-val="off">Off</button>
            </div>
          </div>

          <!-- Theme Colors -->
          <div class="form-group">
            <label class="form-label">Primary Accent Color</label>
            <div class="color-picker-row">
              <input type="color" id="ve-primary-color" class="color-input" value="${themeTokens.primaryColor || '#0d9488'}">
              <input type="text" id="ve-primary-color-text" class="form-input" value="${themeTokens.primaryColor || '#0d9488'}">
            </div>
          </div>

          <!-- Default Theme Mode -->
          <div class="form-group">
            <label class="form-label">Default Color Mode</label>
            <div class="segmented-control" id="control-theme-mode">
              <button type="button" class="seg-btn ${themeTokens.theme === 'dark' ? 'active' : ''}" data-val="dark">Dark Theme</button>
              <button type="button" class="seg-btn ${themeTokens.theme === 'light' ? 'active' : ''}" data-val="light">Light Theme</button>
            </div>
          </div>

          <!-- Visual Effects & Motion Controls Drawer -->
          <div class="effects-motion-drawer" style="grid-column: 1 / -1; background: var(--bg-surface-elevated, #f8fafc); border: 1px solid var(--border-subtle, #e2e8f0); border-radius: 10px; padding: 14px; margin-top: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 7px; margin: 0;">
                <i class="fa-solid fa-wand-magic-sparkles" style="color: var(--primary);"></i>
                Visual Effects &amp; Motion Controls
              </h4>
              <span class="pill-badge pill-info" style="font-size: 0.68rem;">Mother Showcase Sync</span>
            </div>
            <p style="font-size: 0.76rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
              Control animated shifting perimeter gradient borders, glowing blur halo, vertical Updates ticker timing, and horizontal Photo Gallery marquee flow.
            </p>

            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label" for="ve-effect-glow">Border &amp; Radiant Glow</label>
                <select id="ve-effect-glow" class="form-select">
                  <option value="vibrant" ${(cfg.effects?.glow !== 'subtle' && cfg.effects?.glow !== 'off') ? 'selected' : ''}>Vibrant Radiant Glow (Flagship)</option>
                  <option value="subtle" ${cfg.effects?.glow === 'subtle' ? 'selected' : ''}>Subtle Minimal Glow</option>
                  <option value="off" ${cfg.effects?.glow === 'off' ? 'selected' : ''}>Disabled (Clean Flat)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="ve-motion-ticker">Updates Ticker Motion</label>
                <select id="ve-motion-ticker" class="form-select">
                  <option value="22s" ${(cfg.motion?.ticker !== '30s' && cfg.motion?.ticker !== '14s' && cfg.motion?.ticker !== 'off') ? 'selected' : ''}>Continuous Smooth (22s)</option>
                  <option value="30s" ${cfg.motion?.ticker === '30s' ? 'selected' : ''}>Relaxed Slow (30s)</option>
                  <option value="14s" ${cfg.motion?.ticker === '14s' ? 'selected' : ''}>Snappy Fast (14s)</option>
                  <option value="off" ${cfg.motion?.ticker === 'off' ? 'selected' : ''}>Static (No Auto-Scroll)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="ve-motion-marquee">Gallery Marquee Speed</label>
                <select id="ve-motion-marquee" class="form-select">
                  <option value="110s" ${(cfg.motion?.marquee !== '160s' && cfg.motion?.marquee !== '60s' && cfg.motion?.marquee !== 'off') ? 'selected' : ''}>Panoramic Flow (110s)</option>
                  <option value="160s" ${cfg.motion?.marquee === '160s' ? 'selected' : ''}>Gentle Slow (160s)</option>
                  <option value="60s" ${cfg.motion?.marquee === '60s' ? 'selected' : ''}>Active Fast (60s)</option>
                  <option value="off" ${cfg.motion?.marquee === 'off' ? 'selected' : ''}>Static (No Auto-Scroll)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Per-section See All Item Limits -->
        <div class="see-all-limits-box">
          <h4>Initial "See All" Item Limits</h4>
          <p class="sub-hint">Set how many items show before the "See All" expander button appears.</p>
          <div class="form-grid-4">
            <div class="form-group">
              <label class="form-label" for="limit-research">Research Studies</label>
              <select id="limit-research" class="form-select">
                <option value="2" ${seeAllLimit.research === 2 ? 'selected' : ''}>2 items</option>
                <option value="3" ${seeAllLimit.research === 3 ? 'selected' : ''}>3 items (Default)</option>
                <option value="4" ${seeAllLimit.research === 4 ? 'selected' : ''}>4 items</option>
                <option value="6" ${seeAllLimit.research === 6 ? 'selected' : ''}>6 items</option>
                <option value="999" ${seeAllLimit.research >= 999 ? 'selected' : ''}>All (No Limit)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="limit-projects">Software Projects</label>
              <select id="limit-projects" class="form-select">
                <option value="2" ${seeAllLimit.projects === 2 ? 'selected' : ''}>2 items</option>
                <option value="3" ${seeAllLimit.projects === 3 ? 'selected' : ''}>3 items (Default)</option>
                <option value="4" ${seeAllLimit.projects === 4 ? 'selected' : ''}>4 items</option>
                <option value="6" ${seeAllLimit.projects === 6 ? 'selected' : ''}>6 items</option>
                <option value="999" ${seeAllLimit.projects >= 999 ? 'selected' : ''}>All (No Limit)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="limit-publications">Publications</label>
              <select id="limit-publications" class="form-select">
                <option value="3" ${seeAllLimit.publications === 3 ? 'selected' : ''}>3 items</option>
                <option value="4" ${seeAllLimit.publications === 4 ? 'selected' : ''}>4 items (Default)</option>
                <option value="6" ${seeAllLimit.publications === 6 ? 'selected' : ''}>6 items</option>
                <option value="8" ${seeAllLimit.publications === 8 ? 'selected' : ''}>8 items</option>
                <option value="999" ${seeAllLimit.publications >= 999 ? 'selected' : ''}>All (No Limit)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="limit-certifications">Certificates</label>
              <select id="limit-certifications" class="form-select">
                <option value="4" ${seeAllLimit.certifications === 4 ? 'selected' : ''}>4 items</option>
                <option value="6" ${seeAllLimit.certifications === 6 ? 'selected' : ''}>6 items (Default)</option>
                <option value="8" ${seeAllLimit.certifications === 8 ? 'selected' : ''}>8 items</option>
                <option value="999" ${seeAllLimit.certifications >= 999 ? 'selected' : ''}>All (No Limit)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Template Picker Grid -->
        <div class="template-picker-section">
          <h4>Switch Active Portfolio Archetype (30 Templates)</h4>
          <div class="template-picks-grid">
            ${portTemplatesHtml}
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    if (!this.container) return;

    // Tab switcher
    this.container.querySelectorAll('[data-ve-tab]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-ve-tab');
        this.activeTab = tab;
        this.render();
      });
    });

    // Identity Inputs
    const bindInput = (id, setter) => {
      const el = this.container.querySelector(id);
      if (el) {
        el.addEventListener('input', (e) => {
          setter(e.target.value);
          this.notifyChange();
        });
      }
    };

    if (this.activeTab === 'identity') {
      const id = this.profile.identity = this.profile.identity || {};
      bindInput('#ve-fullname', (v) => { id.fullName = v; });
      bindInput('#ve-shortname', (v) => { id.shortName = v; });
      bindInput('#ve-rolebadge', (v) => { id.roleBadge = v; });
      bindInput('#ve-availability', (v) => { id.availabilityStatus = v; });
      bindInput('#ve-tagline', (v) => { id.tagline = v; });
      bindInput('#ve-quote', (v) => { id.quote = v; });
      bindInput('#ve-bio', (v) => {
        id.bioParagraphs = v.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      });
      bindInput('#ve-avatar', (v) => { id.avatar = v; });
      bindInput('#ve-banner', (v) => { id.banner = v; });
    }

    // Links Tab
    if (this.activeTab === 'links') {
      this.container.querySelectorAll('.link-url-input').forEach((input) => {
        input.addEventListener('input', (e) => {
          const key = e.target.getAttribute('data-link-field');
          this.profile.links = this.profile.links || {};
          this.profile.links[key] = e.target.value.trim();
          this.notifyChange();
        });
      });

      this.container.querySelectorAll('.toggle-pill input').forEach((chk) => {
        chk.addEventListener('change', (e) => {
          const target = e.target.getAttribute('data-vis-target');
          const key = e.target.getAttribute('data-vis-key');
          this.profile.displayConfig = this.profile.displayConfig || {};
          this.profile.displayConfig.linksVisibility = this.profile.displayConfig.linksVisibility || {};
          this.profile.displayConfig.linksVisibility[`${target}_${key}`] = e.target.checked;
          this.notifyChange();
        });
      });

      const btnAddCustom = this.container.querySelector('#btn-add-custom-link');
      if (btnAddCustom) {
        btnAddCustom.addEventListener('click', () => {
          this.profile.links = this.profile.links || {};
          this.profile.links.custom = this.profile.links.custom || [];
          this.profile.links.custom.push({ label: 'New Link', url: 'https://', icon: 'fa-solid fa-link' });
          this.notifyChange();
          this.render();
        });
      }
    }

    // Publications Tab: DOI / ORCID Fetchers
    if (this.activeTab === 'publications') {
      const btnFetchDoi = this.container.querySelector('#btn-fetch-doi');
      const inputDoi = this.container.querySelector('#input-doi-fetch');
      const statusMsg = this.container.querySelector('#doi-fetch-status');

      if (btnFetchDoi && inputDoi) {
        btnFetchDoi.addEventListener('click', async () => {
          const rawDoi = inputDoi.value.trim();
          if (!rawDoi) return;

          btnFetchDoi.disabled = true;
          btnFetchDoi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
          statusMsg.style.display = 'block';
          statusMsg.className = 'fetch-status-msg info';
          statusMsg.textContent = `Connecting to Crossref API for ${rawDoi}...`;

          try {
            const pub = await fetchPublicationByDoi(rawDoi, { fallbackMock: true });
            this.profile.publications = this.profile.publications || [];
            this.profile.publications.unshift(pub);
            this.notifyChange();
            statusMsg.className = 'fetch-status-msg success';
            statusMsg.textContent = `✓ Successfully imported "${pub.title}" (${pub.year})`;
            inputDoi.value = '';
            setTimeout(() => { this.render(); }, 1200);
          } catch (err) {
            statusMsg.className = 'fetch-status-msg error';
            statusMsg.textContent = `✕ Failed to fetch DOI: ${err.message}`;
          } finally {
            btnFetchDoi.disabled = false;
            btnFetchDoi.innerHTML = '<i class="fa-solid fa-bolt"></i> Fetch DOI';
          }
        });
      }

      const btnFetchOrcid = this.container.querySelector('#btn-fetch-orcid');
      const inputOrcid = this.container.querySelector('#input-orcid-fetch');

      if (btnFetchOrcid && inputOrcid) {
        btnFetchOrcid.addEventListener('click', async () => {
          const rawOrcid = inputOrcid.value.trim();
          if (!rawOrcid) return;

          btnFetchOrcid.disabled = true;
          btnFetchOrcid.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importing...';
          statusMsg.style.display = 'block';
          statusMsg.className = 'fetch-status-msg info';
          statusMsg.textContent = `Connecting to OpenAlex for ORCID ${rawOrcid}...`;

          try {
            const works = await fetchWorksByOrcid(rawOrcid, { fallbackMock: true });
            this.profile.publications = this.profile.publications || [];
            let added = 0;
            works.forEach((w) => {
              if (!this.profile.publications.some((existing) => existing.doi && existing.doi === w.doi)) {
                this.profile.publications.push(w);
                added++;
              }
            });
            this.notifyChange();
            statusMsg.className = 'fetch-status-msg success';
            statusMsg.textContent = `✓ Imported ${added} publications from ORCID!`;
            inputOrcid.value = '';
            setTimeout(() => { this.render(); }, 1200);
          } catch (err) {
            statusMsg.className = 'fetch-status-msg error';
            statusMsg.textContent = `✕ Failed to import ORCID: ${err.message}`;
          } finally {
            btnFetchOrcid.disabled = false;
            btnFetchOrcid.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Import Works';
          }
        });
      }

      const btnAddManual = this.container.querySelector('#btn-add-manual-pub');
      if (btnAddManual) {
        btnAddManual.addEventListener('click', () => {
          this.profile.publications = this.profile.publications || [];
          this.profile.publications.unshift({
            id: `pub-${Date.now()}`,
            title: 'New Publication Manuscript',
            authors: this.profile.identity?.fullName || '',
            year: new Date().getFullYear(),
            journal: '',
            doi: '',
            url: '',
            badge: 'Peer-Reviewed',
            status: 'published'
          });
          this.notifyChange();
          this.render();
        });
      }

      // Deletes
      this.container.querySelectorAll('[data-action="delete-pub"]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
          if (idx >= 0 && this.profile.publications) {
            this.profile.publications.splice(idx, 1);
            this.notifyChange();
            this.render();
          }
        });
      });
    }

    // Customizer Events
    if (this.activeTab === 'customizer') {
      const bindSegment = (containerId, setter) => {
        const seg = this.container.querySelector(containerId);
        if (seg) {
          seg.querySelectorAll('.seg-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
              const val = e.currentTarget.getAttribute('data-val');
              setter(val);
              this.notifyChange();
              this.render();
            });
          });
        }
      };

      bindSegment('#control-grid-cols', (val) => {
        this.profile.displayConfig = this.profile.displayConfig || {};
        this.profile.displayConfig.cardGridColumns = val;
      });

      bindSegment('#control-gradient-borders', (val) => {
        this.profile.displayConfig = this.profile.displayConfig || {};
        this.profile.displayConfig.gradientBorders = val;
      });

      bindSegment('#control-theme-mode', (val) => {
        this.profile.displayConfig = this.profile.displayConfig || {};
        this.profile.displayConfig.themeTokens = this.profile.displayConfig.themeTokens || {};
        this.profile.displayConfig.themeTokens.theme = val;
      });

      const primaryColorInput = this.container.querySelector('#ve-primary-color');
      const primaryColorText = this.container.querySelector('#ve-primary-color-text');
      if (primaryColorInput && primaryColorText) {
        primaryColorInput.addEventListener('input', (e) => {
          primaryColorText.value = e.target.value;
          this.profile.displayConfig = this.profile.displayConfig || {};
          this.profile.displayConfig.themeTokens = this.profile.displayConfig.themeTokens || {};
          this.profile.displayConfig.themeTokens.primaryColor = e.target.value;
          this.notifyChange();
        });
        primaryColorText.addEventListener('input', (e) => {
          primaryColorInput.value = e.target.value;
          this.profile.displayConfig = this.profile.displayConfig || {};
          this.profile.displayConfig.themeTokens = this.profile.displayConfig.themeTokens || {};
          this.profile.displayConfig.themeTokens.primaryColor = e.target.value;
          this.notifyChange();
        });
      }

      // Visual Effects & Motion Controls
      const selGlow = this.container.querySelector('#ve-effect-glow');
      if (selGlow) {
        selGlow.addEventListener('change', (e) => {
          this.profile.displayConfig = this.profile.displayConfig || {};
          this.profile.displayConfig.effects = this.profile.displayConfig.effects || {};
          this.profile.displayConfig.effects.glow = e.target.value;
          this.notifyChange();
        });
      }

      const selTicker = this.container.querySelector('#ve-motion-ticker');
      if (selTicker) {
        selTicker.addEventListener('change', (e) => {
          this.profile.displayConfig = this.profile.displayConfig || {};
          this.profile.displayConfig.motion = this.profile.displayConfig.motion || {};
          this.profile.displayConfig.motion.ticker = e.target.value;
          this.notifyChange();
        });
      }

      const selMarquee = this.container.querySelector('#ve-motion-marquee');
      if (selMarquee) {
        selMarquee.addEventListener('change', (e) => {
          this.profile.displayConfig = this.profile.displayConfig || {};
          this.profile.displayConfig.motion = this.profile.displayConfig.motion || {};
          this.profile.displayConfig.motion.marquee = e.target.value;
          this.notifyChange();
        });
      }

      // See All limits
      const bindLimit = (selectId, key) => {
        const sel = this.container.querySelector(selectId);
        if (sel) {
          sel.addEventListener('change', (e) => {
            this.profile.displayConfig = this.profile.displayConfig || {};
            this.profile.displayConfig.seeAllLimit = this.profile.displayConfig.seeAllLimit || {};
            this.profile.displayConfig.seeAllLimit[key] = parseInt(e.target.value, 10);
            this.notifyChange();
          });
        }
      };
      bindLimit('#limit-research', 'research');
      bindLimit('#limit-projects', 'projects');
      bindLimit('#limit-publications', 'publications');
      bindLimit('#limit-certifications', 'certifications');

      // Portfolio Template Switcher
      this.container.querySelectorAll('[data-pick-portfolio]').forEach((card) => {
        card.addEventListener('click', (e) => {
          const tplId = e.currentTarget.getAttribute('data-pick-portfolio');
          this.profile.displayConfig = this.profile.displayConfig || {};
          this.profile.displayConfig.portfolioTemplateId = tplId;
          this.notifyChange();
          this.render();
        });
      });
    }

    // Contact & Map Tab
    if (this.activeTab === 'contact') {
      // Preset clicks
      this.container.querySelectorAll('.loc-preset-pill').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget;
          updateProfileLocation(this.profile, {
            city: target.getAttribute('data-preset-city'),
            country: target.getAttribute('data-preset-country'),
            lat: parseFloat(target.getAttribute('data-preset-lat')),
            lng: parseFloat(target.getAttribute('data-preset-lng')),
            rawAddress: target.getAttribute('data-preset-address')
          });
          this.notifyChange();
          this.render();
        });
      });

      // Contact mode radios
      this.container.querySelectorAll('input[name="contact-mode"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
          const mode = e.target.value;
          updateProfileContactConfig(this.profile, {
            mode: mode,
            showForm: mode === 'web3forms' || mode === 'formsubmit'
          });
          this.notifyChange();
          this.render();
        });
      });

      // City / Country / Lat / Lng inputs
      bindInput('#loc-city', (v) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.location = this.profile.identity.location || {};
        this.profile.identity.location.city = v;
      });
      bindInput('#loc-country', (v) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.location = this.profile.identity.location || {};
        this.profile.identity.location.country = v;
      });
      bindInput('#loc-lat', (v) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.location = this.profile.identity.location || {};
        this.profile.identity.location.lat = parseFloat(v) || 0;
      });
      bindInput('#loc-lng', (v) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.location = this.profile.identity.location || {};
        this.profile.identity.location.lng = parseFloat(v) || 0;
      });
      bindInput('#loc-address', (v) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.location = this.profile.identity.location || {};
        this.profile.identity.location.rawAddress = v;
      });
      bindInput('#contact-email', (v) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.email = v;
      });
      bindInput('#web3forms-key', (v) => {
        this.profile.displayConfig = this.profile.displayConfig || {};
        this.profile.displayConfig.contactConfig = this.profile.displayConfig.contactConfig || {};
        this.profile.displayConfig.contactConfig.accessKey = v;
      });
    }

    // Media & Gallery Tab
    if (this.activeTab === 'media') {
      const mount = this.container.querySelector('#ve-gallery-manager-mount');
      if (mount) {
        new MediaManagerController({
          container: mount,
          mediaList: this.profile.gallery || [],
          title: 'Portfolio Photo Gallery',
          context: 'gallery',
          onChange: (updatedList) => {
            this.profile.gallery = updatedList;
            this.notifyChange();
          }
        }).bindEvents();
      }
      const avatarInput = this.container.querySelector('#ve-avatar-media');
      const bannerInput = this.container.querySelector('#ve-banner-media');
      avatarInput?.addEventListener('input', (e) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.avatar = e.target.value.trim();
        this.notifyChange();
      });
      bannerInput?.addEventListener('input', (e) => {
        this.profile.identity = this.profile.identity || {};
        this.profile.identity.banner = e.target.value.trim();
        this.notifyChange();
      });
    }

    // Documents & Slides Tab
    if (this.activeTab === 'documents') {
      const mount = this.container.querySelector('#ve-docs-manager-mount');
      if (mount) {
        new DocsManagerController({
          container: mount,
          docsList: this.profile.documents || [],
          title: 'Master Portfolio Documents & Presentations',
          sectionTag: 'General',
          onChange: (updatedList) => {
            this.profile.documents = updatedList;
            this.notifyChange();
          }
        }).bindEvents();
      }
    }
  }
}

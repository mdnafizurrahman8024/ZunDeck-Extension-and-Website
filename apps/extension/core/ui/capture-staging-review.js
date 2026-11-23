import { escapeHtml } from '../security/index.js';
import { deduplicateItems } from '../parsers/noise-filter.js';
import { saveWorkspace } from '../storage/vault-storage.js';

export function normalizeStagedBatch(batch = {}) {
  const candidate = batch.candidateProfile || {};
  const items = Array.isArray(batch.items) ? batch.items : [];

  const staged = {
    identity: {
      fullName: candidate.identity?.fullName || '',
      roleBadge: candidate.identity?.roleBadge || '',
      tagline: candidate.identity?.tagline || '',
      email: candidate.identity?.email || '',
      phone: candidate.identity?.phone || '',
      bioParagraphs: candidate.identity?.bioParagraphs || []
    },
    education: Array.isArray(candidate.education) ? [...candidate.education] : [],
    experience: Array.isArray(candidate.research) ? [...candidate.research] : (Array.isArray(candidate.projects) ? [...candidate.projects] : []),
    publications: Array.isArray(candidate.publications) ? [...candidate.publications] : [],
    certifications: Array.isArray(candidate.certifications) ? [...candidate.certifications] : [],
    skills: candidate.skills?.technical?.skills ? candidate.skills.technical.skills.map((s) => s.name || s) : []
  };

  // Fold unclassified scraped items into matching buckets
  items.forEach((item) => {
    const sec = item.section || 'general';
    const text = item.text || '';
    if (sec === 'experience' || sec === 'research') {
      staged.experience.push({ title: text.slice(0, 40), summary: text, id: item.id });
    } else if (sec === 'education') {
      staged.education.push({ degree: text.slice(0, 40), institution: 'Institution', details: text, id: item.id });
    } else if (sec === 'publications') {
      staged.publications.push({ title: text, year: new Date().getFullYear(), id: item.id });
    } else if (sec === 'certifications') {
      staged.certifications.push({ title: text, issuer: 'Authority', id: item.id });
    } else if (sec === 'skills') {
      staged.skills.push(text.slice(0, 30));
    } else if (sec === 'about') {
      staged.identity.bioParagraphs.push(text);
    }
  });

  return staged;
}

export function mergeStagedIntoProfile(activeProfile, stagedData, strategy = 'append') {
  const merged = JSON.parse(JSON.stringify(activeProfile || {}));

  // Identity fields
  const idStaged = stagedData.identity || {};
  merged.identity = merged.identity || {};

  if (strategy === 'fill-empty') {
    if (!merged.identity.fullName && idStaged.fullName) merged.identity.fullName = idStaged.fullName;
    if (!merged.identity.roleBadge && idStaged.roleBadge) merged.identity.roleBadge = idStaged.roleBadge;
    if (!merged.identity.tagline && idStaged.tagline) merged.identity.tagline = idStaged.tagline;
    if (!merged.identity.email && idStaged.email) merged.identity.email = idStaged.email;
    if (!merged.identity.phone && idStaged.phone) merged.identity.phone = idStaged.phone;
    if ((!merged.identity.bioParagraphs || !merged.identity.bioParagraphs.length) && idStaged.bioParagraphs?.length) {
      merged.identity.bioParagraphs = idStaged.bioParagraphs;
    }
  } else {
    // Append / update non-empty fields
    if (idStaged.fullName) merged.identity.fullName = idStaged.fullName;
    if (idStaged.roleBadge) merged.identity.roleBadge = idStaged.roleBadge;
    if (idStaged.tagline) merged.identity.tagline = idStaged.tagline;
    if (idStaged.email) merged.identity.email = idStaged.email;
    if (idStaged.phone) merged.identity.phone = idStaged.phone;
    if (idStaged.bioParagraphs?.length) {
      merged.identity.bioParagraphs = deduplicateItems(merged.identity.bioParagraphs || [], idStaged.bioParagraphs);
    }
  }

  // Collections (Education, Research, Publications, Certifications)
  if (stagedData.education?.length) {
    if (strategy === 'fill-empty' && (!merged.education || !merged.education.length)) {
      merged.education = stagedData.education;
    } else if (strategy === 'append') {
      merged.education = deduplicateItems(merged.education || [], stagedData.education);
    }
  }

  if (stagedData.experience?.length) {
    if (strategy === 'fill-empty' && (!merged.research || !merged.research.length)) {
      merged.research = stagedData.experience;
    } else if (strategy === 'append') {
      merged.research = deduplicateItems(merged.research || [], stagedData.experience);
    }
  }

  if (stagedData.publications?.length) {
    if (strategy === 'fill-empty' && (!merged.publications || !merged.publications.length)) {
      merged.publications = stagedData.publications;
    } else if (strategy === 'append') {
      merged.publications = deduplicateItems(merged.publications || [], stagedData.publications);
    }
  }

  if (stagedData.certifications?.length) {
    if (strategy === 'fill-empty' && (!merged.certifications || !merged.certifications.length)) {
      merged.certifications = stagedData.certifications;
    } else if (strategy === 'append') {
      merged.certifications = deduplicateItems(merged.certifications || [], stagedData.certifications);
    }
  }

  if (stagedData.skills?.length) {
    merged.skills = merged.skills || {};
    merged.skills.technical = merged.skills.technical || { title: 'Technical Skills', skills: [] };
    const currentSkillNames = (merged.skills.technical.skills || []).map((s) => (typeof s === 'string' ? s : s.name));
    stagedData.skills.forEach((skName) => {
      if (!currentSkillNames.some((c) => c.toLowerCase() === skName.toLowerCase())) {
        merged.skills.technical.skills.push({ name: skName });
      }
    });
  }

  return merged;
}

export function renderStagingReviewHtml(stagedData = {}, strategy = 'append') {
  const id = stagedData.identity || {};
  const edu = stagedData.education || [];
  const exp = stagedData.experience || [];
  const pubs = stagedData.publications || [];
  const certs = stagedData.certifications || [];
  const skills = stagedData.skills || [];

  return `
    <div class="staging-review-overlay" id="staging-review-drawer">
      <div class="staging-review-window">
        <header class="staging-header">
          <div class="staging-title-col">
            <span class="staging-badge"><i class="fa-solid fa-list-check"></i> Mandatory Review</span>
            <h3 class="staging-title">Staged Captured Content Review</h3>
            <p class="staging-sub">Verify, edit, or remove scraped items before merging into your portfolio.</p>
          </div>
          <button type="button" class="btn-micro" id="btn-close-staging" title="Cancel &amp; Discard">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div class="staging-body">
          <!-- Strategy selector -->
          <div class="staging-strategy-box">
            <span class="strategy-label">Import Strategy:</span>
            <label class="strategy-radio-label">
              <input type="radio" name="staging-strategy" value="append" ${strategy === 'append' ? 'checked' : ''}>
              <span><strong>Append to Existing</strong> (Add new items without duplicates)</span>
            </label>
            <label class="strategy-radio-label">
              <input type="radio" name="staging-strategy" value="fill-empty" ${strategy === 'fill-empty' ? 'checked' : ''}>
              <span><strong>Fill Empty Fields Only</strong> (Preserve current portfolio data)</span>
            </label>
          </div>

          <!-- Section 1: Identity -->
          <div class="staging-section-card">
            <h4 class="staging-sec-title"><i class="fa-solid fa-user"></i> Identity &amp; Contact</h4>
            <div class="staging-fields-grid">
              <input type="text" class="form-input" data-staged-field="identity.fullName" placeholder="Full Name" value="${escapeHtml(id.fullName || '')}">
              <input type="text" class="form-input" data-staged-field="identity.roleBadge" placeholder="Role Badge / Title" value="${escapeHtml(id.roleBadge || '')}">
              <input type="email" class="form-input" data-staged-field="identity.email" placeholder="Email Address" value="${escapeHtml(id.email || '')}">
              <input type="text" class="form-input" data-staged-field="identity.phone" placeholder="Phone Number" value="${escapeHtml(id.phone || '')}">
            </div>
          </div>

          <!-- Section 2: Experience / Research -->
          <div class="staging-section-card">
            <h4 class="staging-sec-title"><i class="fa-solid fa-briefcase"></i> Experience &amp; Research (${exp.length})</h4>
            <div class="staging-items-list" id="staging-exp-list">
              ${exp.map((item, idx) => `
                <div class="staging-item-row" data-staged-sec="experience" data-idx="${idx}">
                  <input type="checkbox" checked class="staging-item-checkbox" data-chk="exp-${idx}">
                  <div class="staging-item-inputs">
                    <input type="text" class="form-input" placeholder="Role / Position" value="${escapeHtml(item.role || item.title || '')}">
                    <input type="text" class="form-input" placeholder="Company / Institution" value="${escapeHtml(item.company || item.institution || '')}">
                    <textarea class="form-textarea" rows="2" placeholder="Summary / Description">${escapeHtml(item.summary || item.details || '')}</textarea>
                  </div>
                  <button type="button" class="btn-micro btn-danger" data-action="delete-item" title="Discard Item"><i class="fa-solid fa-trash"></i></button>
                </div>
              `).join('')}
              ${!exp.length ? '<p class="empty-hint">No experience items captured in this batch.</p>' : ''}
            </div>
          </div>

          <!-- Section 3: Education -->
          <div class="staging-section-card">
            <h4 class="staging-sec-title"><i class="fa-solid fa-graduation-cap"></i> Education (${edu.length})</h4>
            <div class="staging-items-list" id="staging-edu-list">
              ${edu.map((item, idx) => `
                <div class="staging-item-row" data-staged-sec="education" data-idx="${idx}">
                  <input type="checkbox" checked class="staging-item-checkbox" data-chk="edu-${idx}">
                  <div class="staging-item-inputs">
                    <input type="text" class="form-input" placeholder="Degree / Qualification" value="${escapeHtml(item.degree || '')}">
                    <input type="text" class="form-input" placeholder="Institution" value="${escapeHtml(item.institution || '')}">
                    <input type="text" class="form-input" placeholder="Period" value="${escapeHtml(item.period || '')}">
                  </div>
                  <button type="button" class="btn-micro btn-danger" data-action="delete-item" title="Discard Item"><i class="fa-solid fa-trash"></i></button>
                </div>
              `).join('')}
              ${!edu.length ? '<p class="empty-hint">No education items captured in this batch.</p>' : ''}
            </div>
          </div>

          <!-- Section 4: Publications -->
          <div class="staging-section-card">
            <h4 class="staging-sec-title"><i class="fa-solid fa-book"></i> Publications (${pubs.length})</h4>
            <div class="staging-items-list" id="staging-pubs-list">
              ${pubs.map((item, idx) => `
                <div class="staging-item-row" data-staged-sec="publications" data-idx="${idx}">
                  <input type="checkbox" checked class="staging-item-checkbox" data-chk="pub-${idx}">
                  <div class="staging-item-inputs">
                    <input type="text" class="form-input" placeholder="Publication Title" value="${escapeHtml(item.title || '')}">
                    <input type="text" class="form-input" placeholder="Authors" value="${escapeHtml(item.authors || '')}">
                    <input type="text" class="form-input" placeholder="DOI" value="${escapeHtml(item.doi || '')}">
                  </div>
                  <button type="button" class="btn-micro btn-danger" data-action="delete-item" title="Discard Item"><i class="fa-solid fa-trash"></i></button>
                </div>
              `).join('')}
              ${!pubs.length ? '<p class="empty-hint">No publications captured in this batch.</p>' : ''}
            </div>
          </div>

          <!-- Section 5: Skills -->
          <div class="staging-section-card">
            <h4 class="staging-sec-title"><i class="fa-solid fa-wrench"></i> Skills (${skills.length})</h4>
            <div class="staging-skills-wrap">
              ${skills.map((sk, idx) => `
                <span class="staged-skill-tag" data-skill-idx="${idx}">
                  ${escapeHtml(sk)}
                  <button type="button" class="btn-remove-skill" data-remove-skill="${idx}">&times;</button>
                </span>
              `).join('')}
              ${!skills.length ? '<p class="empty-hint">No skills extracted.</p>' : ''}
            </div>
          </div>
        </div>

        <footer class="staging-footer">
          <div class="staging-safety-badge">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>An Undo checkpoint will be saved before merging.</span>
          </div>
          <div class="staging-actions">
            <button type="button" class="btn-subtle" id="btn-cancel-merge">Cancel</button>
            <button type="button" class="btn-primary" id="btn-confirm-merge">
              <i class="fa-solid fa-check"></i> Confirm &amp; Merge into ZunDeck
            </button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

export class StagingReviewController {
  constructor(options = {}) {
    this.activeProfile = options.activeProfile || {};
    this.stagedBatch = options.stagedBatch || {};
    this.stagedData = normalizeStagedBatch(this.stagedBatch);
    this.strategy = options.strategy || 'append';
    this.onConfirm = typeof options.onConfirm === 'function' ? options.onConfirm : () => {};
    this.onCancel = typeof options.onCancel === 'function' ? options.onCancel : () => {};
  }

  show() {
    const html = renderStagingReviewHtml(this.stagedData, this.strategy);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    this.modalEl = wrapper.firstElementChild;
    document.body.appendChild(this.modalEl);

    this.bindEvents();
  }

  bindEvents() {
    if (!this.modalEl) return;

    // Close / Cancel
    const btnClose = this.modalEl.querySelector('#btn-close-staging');
    const btnCancel = this.modalEl.querySelector('#btn-cancel-merge');
    const closeHandler = () => {
      this.modalEl.remove();
      this.onCancel();
    };

    btnClose?.addEventListener('click', closeHandler);
    btnCancel?.addEventListener('click', closeHandler);

    // Strategy radios
    this.modalEl.querySelectorAll('input[name="staging-strategy"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.strategy = e.target.value;
      });
    });

    // Delete item buttons
    this.modalEl.querySelectorAll('[data-action="delete-item"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.staging-item-row');
        row?.remove();
      });
    });

    // Remove skill buttons
    this.modalEl.querySelectorAll('[data-remove-skill]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tag = e.target.closest('.staged-skill-tag');
        tag?.remove();
      });
    });

    // Confirm Merge Button
    const btnConfirm = this.modalEl.querySelector('#btn-confirm-merge');
    btnConfirm?.addEventListener('click', async () => {
      // 1. Create an Undo Checkpoint
      try {
        await saveWorkspace(this.activeProfile);
      } catch {
        // Snapshot
      }

      // 2. Collect verified staged content from inputs
      const verified = this.collectVerifiedData();

      // 3. Merge
      const merged = mergeStagedIntoProfile(this.activeProfile, verified, this.strategy);
      this.modalEl.remove();
      this.onConfirm(merged);
    });
  }

  collectVerifiedData() {
    const data = JSON.parse(JSON.stringify(this.stagedData));

    // Update identity
    this.modalEl.querySelectorAll('[data-staged-field]').forEach((inp) => {
      const field = inp.getAttribute('data-staged-field');
      const val = inp.value.trim();
      if (field === 'identity.fullName') data.identity.fullName = val;
      if (field === 'identity.roleBadge') data.identity.roleBadge = val;
      if (field === 'identity.email') data.identity.email = val;
      if (field === 'identity.phone') data.identity.phone = val;
    });

    // Filter unchecked rows
    const filterChecked = (containerSelector, list) => {
      const rows = this.modalEl.querySelectorAll(`${containerSelector} .staging-item-row`);
      const checkedItems = [];
      rows.forEach((row, i) => {
        const chk = row.querySelector('.staging-item-checkbox');
        if (chk?.checked && list[i]) {
          checkedItems.push(list[i]);
        }
      });
      return checkedItems;
    };

    data.education = filterChecked('#staging-edu-list', data.education);
    data.experience = filterChecked('#staging-exp-list', data.experience);
    data.publications = filterChecked('#staging-pubs-list', data.publications);

    // Filter skills
    const remainingSkillTags = this.modalEl.querySelectorAll('.staged-skill-tag');
    data.skills = Array.from(remainingSkillTags).map((t) => t.textContent.replace('×', '').trim());

    return data;
  }
}

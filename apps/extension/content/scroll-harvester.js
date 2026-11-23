// ZunDeck Progressive Scroll-Capture Harvester Content Script
// Injected ONLY on explicit user initiation via activeTab permission

(function () {
  if (window.__zundeckHarvesterActive) {
    console.log('[ZunDeck Harvester] Already injected and active on this tab.');
    return;
  }
  window.__zundeckHarvesterActive = true;

  const NOISE_SELECTORS = [
    '.ad-banner', '.adsbygoogle', 'iframe[src*="ad"]', 'iframe[src*="doubleclick"]',
    '.cookie-banner', '.consent-modal', '.artdeco-modal', '[data-ad-slot]',
    '[aria-label*="Advert"]', 'header.global-nav', 'footer.global-footer',
    '.people-also-viewed', '.pv-browsemap-section'
  ];

  const NOISE_TEXT_PATTERNS = [
    /^(sponsored|promoted|advertisement|adchoices)\b/i,
    /^(people also viewed|more profiles for you|suggested for you|pages people also view|similar researchers|explore more)\b/i,
    /^(connect|follow|message|endorse|recommend|apply now|save job|dismiss|share|repost|like|comment|send)\b/i,
    /^(show all \d+ (experiences|skills|licenses|publications|educations|honors))/i,
    /^(\.\.\.see more|see less|view full profile|show more results)\b/i,
    /^(accept all cookies|cookie settings|manage cookies|privacy policy|terms of service)\b/i
  ];

  let isPaused = false;
  let scrollTimeout = null;
  let observer = null;
  const capturedSet = new Set();
  const harvestedData = {
    url: window.location.href,
    title: document.title,
    siteType: detectSite(window.location.href),
    timestamp: new Date().toISOString(),
    items: [],
    counts: {
      headline: 0,
      about: 0,
      experience: 0,
      education: 0,
      publications: 0,
      certifications: 0,
      skills: 0,
      total: 0
    }
  };

  function detectSite(url) {
    const l = url.toLowerCase();
    if (l.includes('linkedin.com')) return 'linkedin';
    if (l.includes('scholar.google.com')) return 'scholar';
    if (l.includes('orcid.org')) return 'orcid';
    if (l.includes('researchgate.net')) return 'researchgate';
    if (l.includes('github.com')) return 'github';
    return 'general';
  }

  function hashText(str) {
    const s = String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return String(Math.abs(h));
  }

  function isNoise(text) {
    const t = text.trim();
    if (!t || t.length < 2) return true;
    for (const pat of NOISE_TEXT_PATTERNS) {
      if (pat.test(t)) return true;
    }
    return false;
  }

  function harvestVisibleDom() {
    if (isPaused) return;

    // Filter noisy DOM nodes
    NOISE_SELECTORS.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.setAttribute('data-zundeck-ignore', 'true');
      });
    });

    const candidates = document.querySelectorAll('section, article, .pvs-entity, .gsc_a_tr, .work-item, .repo-card, p, li');
    let added = 0;

    candidates.forEach((el) => {
      if (el.closest('[data-zundeck-ignore]')) return;
      const text = el.innerText ? el.innerText.trim() : '';
      if (!text || text.length < 15) return;
      if (isNoise(text)) return;

      const hash = hashText(text);
      if (!capturedSet.has(hash)) {
        capturedSet.add(hash);

        // Classify section roughly by keywords
        const lower = text.toLowerCase();
        let section = 'general';
        if (lower.includes('experience') || lower.includes('present') || lower.includes('full-time')) {
          section = 'experience';
          harvestedData.counts.experience++;
        } else if (lower.includes('university') || lower.includes('degree') || lower.includes('bachelor') || lower.includes('master') || lower.includes('phd')) {
          section = 'education';
          harvestedData.counts.education++;
        } else if (lower.includes('journal') || lower.includes('doi:') || lower.includes('conference') || lower.includes('proceedings') || lower.includes('cited by')) {
          section = 'publications';
          harvestedData.counts.publications++;
        } else if (lower.includes('license') || lower.includes('certificate') || lower.includes('credential')) {
          section = 'certifications';
          harvestedData.counts.certifications++;
        } else if (lower.includes('skill') || lower.includes('proficient') || lower.includes('technologies')) {
          section = 'skills';
          harvestedData.counts.skills++;
        } else if (lower.includes('about') || lower.includes('bio') || lower.includes('passionate')) {
          section = 'about';
          harvestedData.counts.about++;
        }

        harvestedData.items.push({
          id: `harv-${Date.now()}-${hash}`,
          section,
          text,
          capturedAt: new Date().toISOString()
        });

        harvestedData.counts.total++;
        added++;
      }
    });

    if (added > 0) {
      notifySidePanel();
    }
  }

  function notifySidePanel() {
    try {
      chrome.runtime.sendMessage({
        action: 'HARVESTER_UPDATE',
        counts: harvestedData.counts,
        itemsCount: harvestedData.items.length,
        siteType: harvestedData.siteType
      });
    } catch (e) {
      // Side panel might be closed
    }
  }

  function setupScrollListener() {
    window.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(harvestVisibleDom, 250);
    }, { passive: true });

    observer = new MutationObserver(() => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(harvestVisibleDom, 350);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial capture of first viewport
    harvestVisibleDom();
  }

  // Chrome runtime message routing
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === 'PAUSE_SCROLL') {
      isPaused = true;
      sendResponse({ status: 'PAUSED' });
      return false;
    }

    if (req.action === 'RESUME_SCROLL') {
      isPaused = false;
      harvestVisibleDom();
      sendResponse({ status: 'ACTIVE' });
      return false;
    }

    if (req.action === 'GET_HARVESTED_DATA') {
      harvestVisibleDom();
      sendResponse({ data: harvestedData });
      return false;
    }

    if (req.action === 'CLIP_MOUSE_SELECTION') {
      const sel = window.getSelection ? window.getSelection().toString().trim() : '';
      sendResponse({ selection: sel, siteType: harvestedData.siteType });
      return false;
    }
  });

  setupScrollListener();
  console.log(`[ZunDeck Harvester] Progressive scroll harvester started for ${harvestedData.siteType}`);
})();

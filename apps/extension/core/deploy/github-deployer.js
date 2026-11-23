import { renderPortfolioHtml } from '../engines/portfolio-engine.js';
import { renderCvHtml } from '../engines/cv-engine.js';
import { normalizeProfile } from '../schema/profile-schema.js';
import { scanString, scanForSecrets } from '../security/secret-scanner.js';
import { buildZip } from '../exporters/docx-exporter.js';

const GITHUB_API_BASE = 'https://api.github.com';

export function getGitHubHeaders(token) {
  const cleanToken = (token || '').trim();
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ZunDeck-Portfolio-Deployer/1.0',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (cleanToken) {
    headers.Authorization = `Bearer ${cleanToken}`;
  }
  return headers;
}

export function generateStaticPortfolioBundle(rawProfile = {}, options = {}) {
  const profile = normalizeProfile(rawProfile);
  const portfolioTplId = options.portfolioTemplateId || profile.displayConfig?.portfolioTemplateId || 'acad-flagship';
  const cvTplId = options.cvTemplateId || profile.displayConfig?.cvTemplateId || 'cv-acad-flagship';

  const owner = (options.owner || profile.identity?.shortName || 'user').toLowerCase();
  const repo = options.repo || `${owner}.github.io`;
  const isUserSite = repo.toLowerCase() === `${owner}.github.io`.toLowerCase();

  const canonicalOrigin = options.customDomain
    ? `https://${options.customDomain}`
    : `https://${owner}.github.io${isUserSite ? '' : `/${repo}`}`;

  // 1. Render index.html (Portfolio)
  const portfolioHtml = renderPortfolioHtml(profile, {
    templateId: portfolioTplId,
    canonicalUrl: canonicalOrigin
  });

  // 2. Render cv.html (CV / Resume)
  const cvHtml = renderCvHtml(profile, {
    templateId: cvTplId,
    showQr: true,
    qrUrl: canonicalOrigin
  });

  // 3. Clean and sanitize data/portfolio-data.json
  const sanitizedProfile = JSON.parse(JSON.stringify(profile));
  if (sanitizedProfile.identity?.secretKeys) {
    delete sanitizedProfile.identity.secretKeys;
  }
  const portfolioDataJson = JSON.stringify(sanitizedProfile, null, 2);

  // 4. Standalone CSS helper
  const standaloneCss = `/* ZunDeck Standalone Static Companion CSS */
:root {
  --zd-font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --zd-transition: 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.zundeck-nav-fixed {
  position: sticky;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.zundeck-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  text-decoration: none;
}

@media print {
  .zundeck-nav-fixed,
  .no-print {
    display: none !important;
  }
}
`;

  // 5. Standalone JS helper
  const standaloneJs = `/**
 * ZunDeck Standalone Static Client Helper
 * Provides theme toggle, smooth scrolling, and mobile menu interaction
 */
(function() {
  'use strict';
  document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href').slice(1);
        if (!targetId) return;
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Back to top button if present
    var btnTop = document.getElementById('btn-back-to-top');
    if (btnTop) {
      window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
          btnTop.style.display = 'block';
        } else {
          btnTop.style.display = 'none';
        }
      });
      btnTop.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
`;

  // 6. robots.txt
  const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${canonicalOrigin}/sitemap.xml
`;

  // 7. sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${canonicalOrigin}/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${canonicalOrigin}/cv.html</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;

  // 8. .nojekyll (ensures GitHub Pages does not skip directories starting with underscore)
  const noJekyll = '';

  // 9. README.md for target repo
  const readmeMd = `# ${profile.identity?.fullName || 'Academic & Professional Portfolio'}

> Published seamlessly via [ZunDeck](https://github.com/mdnafizurrahman8024/ZunDeck-Extension-and-Website) — The Open-Source AI Academic Portfolio, ATS CV & SOP Studio.

- **Live Portfolio:** [${canonicalOrigin}](${canonicalOrigin})
- **Live Curriculum Vitae:** [${canonicalOrigin}/cv.html](${canonicalOrigin}/cv.html)
- **Last Updated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`;

  const files = [
    { path: 'index.html', content: portfolioHtml, type: 'text/html' },
    { path: 'cv.html', content: cvHtml, type: 'text/html' },
    { path: 'data/portfolio-data.json', content: portfolioDataJson, type: 'application/json' },
    { path: 'css/style.css', content: standaloneCss, type: 'text/css' },
    { path: 'js/app.js', content: standaloneJs, type: 'application/javascript' },
    { path: 'robots.txt', content: robotsTxt, type: 'text/plain' },
    { path: 'sitemap.xml', content: sitemapXml, type: 'application/xml' },
    { path: '.nojekyll', content: noJekyll, type: 'text/plain' },
    { path: 'README.md', content: readmeMd, type: 'text/markdown' }
  ];

  return files.map((f) => ({
    ...f,
    size: typeof Buffer !== 'undefined'
      ? Buffer.byteLength(f.content, 'utf8')
      : new TextEncoder().encode(f.content).length
  }));
}

export function validateBundleSecurity(bundle = []) {
  const violations = [];

  for (const file of bundle) {
    if (typeof file.content !== 'string') continue;

    // 1. Text scanner check
    const textViolations = scanString(file.content, 'bundle_content', file.path);
    if (textViolations.length) {
      violations.push(...textViolations);
    }

    // 2. Structured JSON check for data/portfolio-data.json
    if (file.path.endsWith('.json')) {
      try {
        const parsed = JSON.parse(file.content);
        const jsonViolations = scanForSecrets(parsed, 'bundle_json', file.path);
        if (jsonViolations.length) {
          violations.push(...jsonViolations);
        }
      } catch {}
    }
  }

  return {
    passed: violations.length === 0,
    blocked: violations.length > 0,
    violations,
    remediation: violations.length > 0
      ? `Blocked: Found ${violations.length} private credential(s) or token(s) inside output bundle. Remove private keys before publishing.`
      : 'All security checks passed. Zero secrets detected.'
  };
}

export function calculateDeployDiff(bundle = [], existingFiles = []) {
  const existingMap = new Map(existingFiles.map((f) => [f.path || f, f]));
  const bundleMap = new Map(bundle.map((f) => [f.path, f]));

  const added = [];
  const modified = [];
  const unchanged = [];
  const deleted = [];

  for (const [path, file] of bundleMap.entries()) {
    if (!existingMap.has(path)) {
      added.push(path);
    } else {
      const existing = existingMap.get(path);
      const isSameSize = typeof existing === 'object' && existing.size === file.size;
      if (isSameSize) {
        unchanged.push(path);
      } else {
        modified.push(path);
      }
    }
  }

  for (const [path] of existingMap.entries()) {
    if (!bundleMap.has(path) && !path.startsWith('.git')) {
      deleted.push(path);
    }
  }

  const totalBytes = bundle.reduce((acc, f) => acc + (f.size || 0), 0);

  return {
    added,
    modified,
    deleted,
    unchanged,
    totalBytes,
    fileCount: bundle.length
  };
}

export function buildPortfolioZipBuffer(bundle = []) {
  const zipFiles = bundle.map((f) => ({
    name: f.path,
    data: typeof Buffer !== 'undefined'
      ? Buffer.from(f.content, 'utf8')
      : new TextEncoder().encode(f.content)
  }));
  return buildZip(zipFiles);
}

// GitHub REST API Functions

export async function getAuthenticatedUser(token) {
  if (!token) throw new Error('GitHub Personal Access Token is required.');
  const res = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: getGitHubHeaders(token)
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid or expired GitHub Personal Access Token.');
    throw new Error(`GitHub API Error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return {
    login: data.login,
    name: data.name || data.login,
    avatarUrl: data.avatar_url,
    profileUrl: data.html_url,
    publicRepos: data.public_repos
  };
}

export async function listUserRepos(token) {
  if (!token) throw new Error('GitHub Personal Access Token is required.');
  const res = await fetch(`${GITHUB_API_BASE}/user/repos?per_page=100&sort=updated`, {
    headers: getGitHubHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Failed to list repositories: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.map((r) => ({
    name: r.name,
    fullName: r.full_name,
    isPrivate: r.private,
    htmlUrl: r.html_url,
    defaultBranch: r.default_branch || 'main',
    hasPages: Boolean(r.has_pages)
  }));
}

export async function checkRepoExists(token, owner, repo) {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      headers: getGitHubHeaders(token)
    });
    if (res.status === 200) {
      const data = await res.json();
      return { exists: true, defaultBranch: data.default_branch || 'main' };
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

export async function createRepo(token, repoName, options = {}) {
  if (!token) throw new Error('GitHub Personal Access Token is required.');
  const res = await fetch(`${GITHUB_API_BASE}/user/repos`, {
    method: 'POST',
    headers: getGitHubHeaders(token),
    body: JSON.stringify({
      name: repoName,
      description: options.description || 'Academic & Professional Portfolio built with ZunDeck',
      homepage: options.homepage || '',
      private: Boolean(options.isPrivate),
      auto_init: true
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Failed to create repository: ${errData.message || res.statusText}`);
  }
  const data = await res.json();
  return {
    name: data.name,
    fullName: data.full_name,
    htmlUrl: data.html_url,
    defaultBranch: data.default_branch || 'main'
  };
}

export async function enableGitHubPages(token, owner, repo, branch = 'main') {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`;
  const headers = getGitHubHeaders(token);

  // Check if Pages already enabled
  const checkRes = await fetch(url, { headers });
  if (checkRes.ok) {
    const data = await checkRes.json();
    return { enabled: true, htmlUrl: data.html_url, status: data.status };
  }

  // Create Pages config
  const createRes = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source: { branch, path: '/' }
    })
  });

  if (createRes.status === 201 || createRes.status === 409) {
    const getRes = await fetch(url, { headers });
    if (getRes.ok) {
      const data = await getRes.json();
      return { enabled: true, htmlUrl: data.html_url, status: data.status };
    }
  }

  // Fallback predicted URL
  const isUserSite = repo.toLowerCase() === `${owner}.github.io`.toLowerCase();
  const fallbackUrl = `https://${owner}.github.io${isUserSite ? '' : `/${repo}`}/`;
  return { enabled: true, htmlUrl: fallbackUrl, status: 'building' };
}

export async function getPagesStatus(token, owner, repo) {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/pages`, {
      headers: getGitHubHeaders(token)
    });
    if (res.ok) {
      const data = await res.json();
      return { enabled: true, htmlUrl: data.html_url, status: data.status };
    }
  } catch {}
  return { enabled: false, htmlUrl: '', status: 'not_configured' };
}

export async function listRecentCommits(token, owner, repo, limit = 10) {
  const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${limit}`, {
    headers: getGitHubHeaders(token)
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((c) => ({
    sha: c.sha,
    shortSha: c.sha.slice(0, 7),
    message: c.commit?.message || '',
    date: c.commit?.committer?.date || c.commit?.author?.date || '',
    author: c.commit?.author?.name || c.author?.login || 'User',
    htmlUrl: c.html_url
  }));
}

export async function rollbackToCommit(token, owner, repo, targetCommitSha, branch = 'main') {
  if (!token || !targetCommitSha) throw new Error('Token and targetCommitSha are required for rollback.');
  const refUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`;
  const res = await fetch(refUrl, {
    method: 'PATCH',
    headers: getGitHubHeaders(token),
    body: JSON.stringify({
      sha: targetCommitSha,
      force: true
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Rollback failed: ${err.message || res.statusText}`);
  }
  return { success: true, restoredSha: targetCommitSha };
}

export async function deployBundleToGitHub(token, owner, repo, bundle = [], commitMessage = 'Deploy portfolio via ZunDeck', branch = 'main') {
  // 1. Mandatory Pre-Push Security Gate
  const sec = validateBundleSecurity(bundle);
  if (!sec.passed) {
    throw new Error(`DEPLOYMENT BLOCKED BY PRE-PUSH SECURITY SHIELD: ${sec.remediation}`);
  }

  const headers = getGitHubHeaders(token);

  // 2. Get latest commit on target branch
  let latestCommitSha = null;
  let baseTreeSha = null;

  const refRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
  if (refRes.ok) {
    const refData = await refRes.json();
    latestCommitSha = refData.object?.sha;
  }

  if (latestCommitSha) {
    const commitRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      baseTreeSha = commitData.tree?.sha;
    }
  }

  // 3. Post tree containing all files
  const treePayload = {
    tree: bundle.map((f) => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      content: f.content
    }))
  };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treePayload)
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git tree: ${err.message || treeRes.statusText}`);
  }
  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 4. Create Commit
  const commitPayload = {
    message: commitMessage,
    tree: newTreeSha,
    parents: latestCommitSha ? [latestCommitSha] : []
  };

  const createCommitRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(commitPayload)
  });

  if (!createCommitRes.ok) {
    const err = await createCommitRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git commit: ${err.message || createCommitRes.statusText}`);
  }
  const newCommitData = await createCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 5. Update branch reference (or create if not existing)
  if (latestCommitSha) {
    const updateRefRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitSha, force: false })
    });
    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      throw new Error(`Failed to update branch ref: ${err.message || updateRefRes.statusText}`);
    }
  } else {
    const createRefRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: newCommitSha })
    });
    if (!createRefRes.ok) {
      const err = await createRefRes.json().catch(() => ({}));
      throw new Error(`Failed to create branch ref: ${err.message || createRefRes.statusText}`);
    }
  }

  // 6. Ensure Pages is enabled
  const pagesInfo = await enableGitHubPages(token, owner, repo, branch).catch(() => ({
    enabled: true,
    htmlUrl: `https://${owner}.github.io/${repo.toLowerCase() === `${owner}.github.io`.toLowerCase() ? '' : repo}`,
    status: 'building'
  }));

  return {
    success: true,
    commitSha: newCommitSha,
    shortSha: newCommitSha.slice(0, 7),
    repoUrl: `https://github.com/${owner}/${repo}`,
    pagesUrl: pagesInfo.htmlUrl,
    pagesStatus: pagesInfo.status,
    deployedFilesCount: bundle.length,
    timestamp: new Date().toISOString()
  };
}

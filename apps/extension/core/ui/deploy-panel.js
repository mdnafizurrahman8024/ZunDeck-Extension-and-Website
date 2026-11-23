import {
  generateStaticPortfolioBundle,
  validateBundleSecurity,
  calculateDeployDiff,
  buildPortfolioZipBuffer,
  getAuthenticatedUser,
  listUserRepos,
  createRepo,
  deployBundleToGitHub,
  listRecentCommits,
  rollbackToCommit,
  checkRepoExists
} from '../deploy/github-deployer.js';
import { loadPrivateVault, updatePrivateVault } from '../storage/vault-storage.js';
import { escapeHtml } from '../security/sanitizer.js';

export function renderDeployPanelHtml(state = {}) {
  const {
    user = null,
    repos = [],
    selectedRepo = '',
    customRepoName = '',
    repoMode = 'user_site', // 'user_site' | 'custom_site' | 'existing_repo'
    bundle = [],
    securityAudit = { passed: true, violations: [] },
    diff = null,
    isDeploying = false,
    deployProgress = '',
    deployResult = null,
    recentCommits = [],
    error = null
  } = state;

  const isConnected = Boolean(user && user.login);
  const totalKb = bundle.reduce((acc, f) => acc + (f.size || 0), 0) / 1024;

  return `
    <div class="deploy-studio-panel">
      <!-- Header -->
      <div class="dep-header">
        <div class="dep-title-wrap">
          <div class="dep-icon-box">
            <i class="fa-brands fa-github"></i>
          </div>
          <div>
            <h3 class="dep-title">1-Click Free GitHub Pages Auto-Deploy</h3>
            <p class="dep-desc">Publish your complete Academic Portfolio + Live CV + Evidence online for $0.</p>
          </div>
        </div>
        <div class="dep-header-actions">
          <button type="button" class="btn-subtle" id="btn-export-offline-zip" title="Download standalone website as .zip">
            <i class="fa-solid fa-file-zipper"></i>
            <span>Offline ZIP Export</span>
          </button>
        </div>
      </div>

      ${error ? `
        <div class="dep-alert dep-alert-error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div class="dep-alert-content">
            <strong>Deployment Issue:</strong>
            <p>${escapeHtml(error)}</p>
          </div>
        </div>
      ` : ''}

      ${deployResult ? `
        <div class="dep-alert dep-alert-success">
          <i class="fa-solid fa-circle-check"></i>
          <div class="dep-alert-content">
            <strong>Website Deployed Successfully!</strong>
            <p>Commit <a href="${escapeHtml(deployResult.repoUrl + '/commit/' + deployResult.commitSha)}" target="_blank" rel="noopener noreferrer">${escapeHtml(deployResult.shortSha)}</a> pushed to GitHub.</p>
            <div class="dep-success-links">
              <a href="${escapeHtml(deployResult.pagesUrl)}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Visit Live Portfolio</span>
              </a>
              <a href="${escapeHtml(deployResult.repoUrl)}" target="_blank" rel="noopener noreferrer" class="btn-subtle btn-sm">
                <i class="fa-brands fa-github"></i>
                <span>View Repository</span>
              </a>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="dep-body-grid">
        <!-- Step 1: Authentication & Repository Wizard -->
        <div class="dep-card">
          <div class="dep-card-header">
            <div class="dep-step-badge">1</div>
            <h4 class="dep-card-title">GitHub Account & Target Repository</h4>
          </div>

          ${!isConnected ? `
            <div class="dep-auth-box">
              <p class="dep-hint">Enter your GitHub Personal Access Token (Classic with <code>repo</code> scope, or Fine-Grained with <code>Contents</code> and <code>Pages</code> permissions). Stored strictly inside your private vault.</p>
              <div class="dep-input-group">
                <input type="password" id="dep-github-pat-input" class="dep-input" placeholder="ghp_... or github_pat_..." autocomplete="off">
                <button type="button" class="btn-primary" id="btn-connect-github">
                  <i class="fa-solid fa-key"></i>
                  <span>Verify & Connect</span>
                </button>
              </div>
              <div class="dep-helper-links">
                <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" class="dep-micro-link">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>Create Fine-Grained Token on GitHub</span>
                </a>
              </div>
            </div>
          ` : `
            <div class="dep-connected-user">
              <img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.name)}" class="dep-user-avatar">
              <div class="dep-user-info">
                <div class="dep-user-name">${escapeHtml(user.name || user.login)}</div>
                <div class="dep-user-login">@${escapeHtml(user.login)} • ${user.publicRepos} public repositories</div>
              </div>
              <button type="button" class="btn-subtle btn-sm" id="btn-disconnect-github" title="Disconnect and clear token from vault">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>Disconnect</span>
              </button>
            </div>

            <!-- Repository Selection Wizard -->
            <div class="dep-repo-wizard">
              <div class="dep-radio-group">
                <label class="dep-radio-option ${repoMode === 'user_site' ? 'selected' : ''}">
                  <input type="radio" name="dep-repo-mode" value="user_site" ${repoMode === 'user_site' ? 'checked' : ''}>
                  <div class="dep-radio-content">
                    <span class="dep-radio-title">Personal Domain Root (Recommended)</span>
                    <span class="dep-radio-sub"><code>${escapeHtml(user.login)}.github.io</code> — Your primary personal website URL at $0.</span>
                  </div>
                </label>

                <label class="dep-radio-option ${repoMode === 'custom_site' ? 'selected' : ''}">
                  <input type="radio" name="dep-repo-mode" value="custom_site" ${repoMode === 'custom_site' ? 'checked' : ''}>
                  <div class="dep-radio-content">
                    <span class="dep-radio-title">New Custom Project Repository</span>
                    <span class="dep-radio-sub">Deploy under <code>https://${escapeHtml(user.login)}.github.io/[repo-name]</code></span>
                  </div>
                </label>

                <label class="dep-radio-option ${repoMode === 'existing_repo' ? 'selected' : ''}">
                  <input type="radio" name="dep-repo-mode" value="existing_repo" ${repoMode === 'existing_repo' ? 'checked' : ''}>
                  <div class="dep-radio-content">
                    <span class="dep-radio-title">Push to Existing Repository</span>
                    <span class="dep-radio-sub">Update an existing repository currently in your account.</span>
                  </div>
                </label>
              </div>

              ${repoMode === 'custom_site' ? `
                <div class="dep-sub-field">
                  <label for="dep-custom-repo-input" class="dep-label">New Repository Name:</label>
                  <input type="text" id="dep-custom-repo-input" class="dep-input" placeholder="e.g. academic-portfolio" value="${escapeHtml(customRepoName || 'portfolio')}">
                </div>
              ` : ''}

              ${repoMode === 'existing_repo' ? `
                <div class="dep-sub-field">
                  <label for="dep-existing-repo-select" class="dep-label">Select Repository:</label>
                  <select id="dep-existing-repo-select" class="dep-select">
                    ${repos.map((r) => `
                      <option value="${escapeHtml(r.name)}" ${r.name === selectedRepo ? 'selected' : ''}>
                        ${escapeHtml(r.name)} ${r.hasPages ? '(Pages Enabled)' : ''}
                      </option>
                    `).join('')}
                  </select>
                </div>
              ` : ''}
            </div>
          `}
        </div>

        <!-- Step 2: Bundle Preview & Pre-Push Security Shield -->
        <div class="dep-card">
          <div class="dep-card-header">
            <div class="dep-step-badge">2</div>
            <h4 class="dep-card-title">Bundle Manifest & Security Shield</h4>
          </div>

          <!-- Security Status Shield -->
          <div class="dep-security-shield ${securityAudit.passed ? 'shield-pass' : 'shield-fail'}">
            <div class="shield-icon">
              <i class="fa-solid ${securityAudit.passed ? 'fa-shield-halved' : 'fa-triangle-exclamation'}"></i>
            </div>
            <div class="shield-content">
              <div class="shield-title">${securityAudit.passed ? 'Pre-Push Security Shield: Verified Safe' : 'Pre-Push Security Shield: Leak Blocked'}</div>
              <div class="shield-desc">${securityAudit.passed ? '0 API keys, secrets, or private vault tokens found. Ready for public GitHub deployment.' : securityAudit.remediation}</div>
            </div>
          </div>

          <!-- File Manifest Table -->
          <div class="dep-manifest-table-wrap">
            <table class="dep-manifest-table">
              <thead>
                <tr>
                  <th>Generated File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${bundle.map((f) => `
                  <tr>
                    <td><code>${escapeHtml(f.path)}</code></td>
                    <td><span class="dep-file-badge">${escapeHtml(f.type.split('/')[1] || f.type)}</span></td>
                    <td>${(f.size / 1024).toFixed(1)} KB</td>
                    <td><span class="dep-action-tag tag-ready">Ready</span></td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2"><strong>Total Bundle Payload:</strong></td>
                  <td colspan="2"><strong>${totalKb.toFixed(1)} KB (${bundle.length} files)</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Diff Summary -->
          ${diff ? `
            <div class="dep-diff-box">
              <div class="dep-diff-header">
                <i class="fa-solid fa-code-compare"></i>
                <span>Deployment Diff Summary</span>
              </div>
              <div class="dep-diff-stats">
                <span class="diff-tag diff-added">+ ${diff.added.length} added</span>
                <span class="diff-tag diff-modified">~ ${diff.modified.length} modified</span>
                <span class="diff-tag diff-unchanged">= ${diff.unchanged.length} unchanged</span>
                ${diff.deleted.length ? `<span class="diff-tag diff-deleted">- ${diff.deleted.length} deleted</span>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Deploy Action Button -->
          <div class="dep-action-row">
            <button type="button" class="btn-primary btn-lg" id="btn-deploy-to-github" ${!isConnected || isDeploying || !securityAudit.passed ? 'disabled' : ''}>
              <i class="fa-solid ${isDeploying ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}"></i>
              <span>${isDeploying ? (deployProgress || 'Publishing to GitHub Pages...') : 'Approve & Push to GitHub Pages'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Rollback & Recent Commits History -->
      ${recentCommits.length ? `
        <div class="dep-card dep-rollback-card">
          <div class="dep-card-header">
            <div class="dep-step-badge">3</div>
            <h4 class="dep-card-title">1-Click Rollback & Commit History</h4>
          </div>
          <p class="dep-hint">Revert your live GitHub Pages portfolio to any previously verified commit with a single click.</p>
          <div class="dep-commits-list">
            ${recentCommits.map((c, idx) => `
              <div class="dep-commit-row">
                <div class="dep-commit-sha">
                  <a href="${escapeHtml(c.htmlUrl)}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(c.shortSha)}</code></a>
                </div>
                <div class="dep-commit-details">
                  <div class="dep-commit-msg">${escapeHtml(c.message)}</div>
                  <div class="dep-commit-meta">${escapeHtml(c.author)} • ${new Date(c.date).toLocaleDateString()} ${new Date(c.date).toLocaleTimeString()}</div>
                </div>
                <div class="dep-commit-actions">
                  ${idx === 0 ? `
                    <span class="badge-current-head">Current Live</span>
                  ` : `
                    <button type="button" class="btn-subtle btn-xs btn-rollback-commit" data-sha="${escapeHtml(c.sha)}" title="Revert to this commit">
                      <i class="fa-solid fa-clock-rotate-left"></i>
                      <span>Revert</span>
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export class DeployPanelController {
  constructor({ container, getActiveProfile, onStatusUpdate = () => {} }) {
    this.container = container;
    this.getActiveProfile = getActiveProfile;
    this.onStatusUpdate = onStatusUpdate;

    this.state = {
      user: null,
      repos: [],
      selectedRepo: '',
      customRepoName: 'portfolio',
      repoMode: 'user_site',
      bundle: [],
      securityAudit: { passed: true, violations: [] },
      diff: null,
      isDeploying: false,
      deployProgress: '',
      deployResult: null,
      recentCommits: [],
      error: null
    };
  }

  async init() {
    await this.refreshBundle();
    await this.checkExistingConnection();
    this.render();
  }

  async refreshBundle() {
    try {
      const profile = this.getActiveProfile ? this.getActiveProfile() : {};
      const owner = this.state.user?.login || profile.identity?.shortName || 'user';
      let repo = `${owner}.github.io`;

      if (this.state.repoMode === 'custom_site') {
        repo = this.state.customRepoName || 'portfolio';
      } else if (this.state.repoMode === 'existing_repo') {
        repo = this.state.selectedRepo || repo;
      }

      const bundle = generateStaticPortfolioBundle(profile, {
        owner,
        repo
      });

      const securityAudit = validateBundleSecurity(bundle);
      const diff = calculateDeployDiff(bundle, []);

      this.state.bundle = bundle;
      this.state.securityAudit = securityAudit;
      this.state.diff = diff;
    } catch (err) {
      this.state.error = err.message;
    }
  }

  async checkExistingConnection() {
    try {
      const vault = await loadPrivateVault();
      const token = vault.keys?.githubPat;
      if (token) {
        const user = await getAuthenticatedUser(token);
        this.state.user = user;
        const repos = await listUserRepos(token).catch(() => []);
        this.state.repos = repos;

        // Check if user site exists
        const userSiteRepo = `${user.login}.github.io`;
        const exists = repos.some((r) => r.name.toLowerCase() === userSiteRepo.toLowerCase());
        this.state.selectedRepo = exists ? userSiteRepo : (repos[0]?.name || '');

        // Fetch recent commits for current target
        await this.loadRecentCommits(token, user.login, this.getTargetRepoName());
      }
    } catch (err) {
      // Token expired or invalid
      this.state.user = null;
    }
  }

  getTargetRepoName() {
    if (!this.state.user) return 'portfolio';
    if (this.state.repoMode === 'user_site') {
      return `${this.state.user.login}.github.io`;
    }
    if (this.state.repoMode === 'custom_site') {
      return this.state.customRepoName || 'portfolio';
    }
    return this.state.selectedRepo || `${this.state.user.login}.github.io`;
  }

  async loadRecentCommits(token, owner, repo) {
    if (!token || !owner || !repo) return;
    try {
      const commits = await listRecentCommits(token, owner, repo, 5);
      this.state.recentCommits = commits;
    } catch {
      this.state.recentCommits = [];
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = renderDeployPanelHtml(this.state);
    this.bindEvents();
  }

  bindEvents() {
    // 1. Connect GitHub
    const btnConnect = this.container.querySelector('#btn-connect-github');
    const patInput = this.container.querySelector('#dep-github-pat-input');
    if (btnConnect && patInput) {
      btnConnect.addEventListener('click', async () => {
        const token = patInput.value.trim();
        if (!token) return;
        btnConnect.disabled = true;
        btnConnect.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

        try {
          const user = await getAuthenticatedUser(token);
          await updatePrivateVault({ keys: { githubPat: token } });
          this.state.user = user;
          this.state.error = null;
          const repos = await listUserRepos(token).catch(() => []);
          this.state.repos = repos;
          await this.refreshBundle();
          await this.loadRecentCommits(token, user.login, this.getTargetRepoName());
        } catch (err) {
          this.state.error = err.message;
        } finally {
          this.render();
        }
      });
    }

    // 2. Disconnect GitHub
    const btnDisconnect = this.container.querySelector('#btn-disconnect-github');
    if (btnDisconnect) {
      btnDisconnect.addEventListener('click', async () => {
        await updatePrivateVault({ keys: { githubPat: '' } });
        this.state.user = null;
        this.state.repos = [];
        this.state.recentCommits = [];
        this.state.deployResult = null;
        await this.refreshBundle();
        this.render();
      });
    }

    // 3. Repo Mode Radio Selection
    this.container.querySelectorAll('input[name="dep-repo-mode"]').forEach((radio) => {
      radio.addEventListener('change', async (e) => {
        this.state.repoMode = e.target.value;
        await this.refreshBundle();
        const vault = await loadPrivateVault();
        if (this.state.user && vault.keys?.githubPat) {
          await this.loadRecentCommits(vault.keys.githubPat, this.state.user.login, this.getTargetRepoName());
        }
        this.render();
      });
    });

    // 4. Custom repo input
    const customInput = this.container.querySelector('#dep-custom-repo-input');
    if (customInput) {
      customInput.addEventListener('input', (e) => {
        this.state.customRepoName = e.target.value.trim();
      });
      customInput.addEventListener('change', async () => {
        await this.refreshBundle();
        this.render();
      });
    }

    // 5. Existing repo select
    const repoSelect = this.container.querySelector('#dep-existing-repo-select');
    if (repoSelect) {
      repoSelect.addEventListener('change', async (e) => {
        this.state.selectedRepo = e.target.value;
        await this.refreshBundle();
        const vault = await loadPrivateVault();
        if (this.state.user && vault.keys?.githubPat) {
          await this.loadRecentCommits(vault.keys.githubPat, this.state.user.login, this.state.selectedRepo);
        }
        this.render();
      });
    }

    // 6. Deploy to GitHub Pages
    const btnDeploy = this.container.querySelector('#btn-deploy-to-github');
    if (btnDeploy) {
      btnDeploy.addEventListener('click', async () => {
        await this.executeDeploy();
      });
    }

    // 7. Offline ZIP Export
    const btnZip = this.container.querySelector('#btn-export-offline-zip');
    if (btnZip) {
      btnZip.addEventListener('click', () => {
        this.downloadOfflineZip();
      });
    }

    // 8. Rollback commits
    this.container.querySelectorAll('.btn-rollback-commit').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const sha = btn.dataset.sha;
        if (!confirm(`Revert live site to commit ${sha.slice(0, 7)}?`)) return;
        await this.executeRollback(sha);
      });
    });
  }

  async executeDeploy() {
    this.state.isDeploying = true;
    this.state.error = null;
    this.state.deployResult = null;
    this.state.deployProgress = 'Checking repository...';
    this.render();

    try {
      const vault = await loadPrivateVault();
      const token = vault.keys?.githubPat;
      if (!token) throw new Error('GitHub Personal Access Token is missing.');

      const owner = this.state.user.login;
      const repo = this.getTargetRepoName();

      // Check repo existence; create if needed
      this.state.deployProgress = `Verifying repository ${owner}/${repo}...`;
      this.render();

      const existsRes = await checkRepoExists(token, owner, repo);
      if (!existsRes.exists) {
        this.state.deployProgress = `Creating new repository ${owner}/${repo}...`;
        this.render();
        await createRepo(token, repo, { isPrivate: false });
      }

      // Security check
      this.state.deployProgress = 'Running Pre-Push Security Shield audit...';
      this.render();
      await this.refreshBundle();

      if (!this.state.securityAudit.passed) {
        throw new Error(`DEPLOY BLOCKED: ${this.state.securityAudit.remediation}`);
      }

      // Deploy bundle
      this.state.deployProgress = 'Pushing files and enabling GitHub Pages...';
      this.render();

      const result = await deployBundleToGitHub(
        token,
        owner,
        repo,
        this.state.bundle,
        `Deploy portfolio via ZunDeck (${new Date().toLocaleDateString()})`
      );

      this.state.deployResult = result;
      await this.loadRecentCommits(token, owner, repo);
      this.onStatusUpdate({ type: 'deploy_success', result });
    } catch (err) {
      this.state.error = err.message;
      this.onStatusUpdate({ type: 'deploy_error', error: err.message });
    } finally {
      this.state.isDeploying = false;
      this.state.deployProgress = '';
      this.render();
    }
  }

  async executeRollback(sha) {
    try {
      const vault = await loadPrivateVault();
      const token = vault.keys?.githubPat;
      const owner = this.state.user.login;
      const repo = this.getTargetRepoName();

      this.state.deployProgress = `Reverting to commit ${sha.slice(0, 7)}...`;
      this.state.isDeploying = true;
      this.render();

      await rollbackToCommit(token, owner, repo, sha);
      await this.loadRecentCommits(token, owner, repo);
      this.state.deployResult = {
        success: true,
        commitSha: sha,
        shortSha: sha.slice(0, 7),
        repoUrl: `https://github.com/${owner}/${repo}`,
        pagesUrl: `https://${owner}.github.io${repo === `${owner}.github.io` ? '' : `/${repo}`}`,
        pagesStatus: 'reverted'
      };
    } catch (err) {
      this.state.error = `Rollback failed: ${err.message}`;
    } finally {
      this.state.isDeploying = false;
      this.state.deployProgress = '';
      this.render();
    }
  }

  downloadOfflineZip() {
    try {
      const zipBuf = buildPortfolioZipBuffer(this.state.bundle);
      const blob = new Blob([zipBuf], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zundeck-portfolio-bundle-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Could not generate ZIP archive: ${err.message}`);
    }
  }
}

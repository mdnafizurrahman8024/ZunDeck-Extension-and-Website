import { escapeHtml } from '../security/sanitizer.js';
import {
  processVibeAgentMessage,
  VIBE_TOOLS
} from '../ai/vibe-agent.js';
import {
  getAiCredentials,
  saveAiCredentials,
  testAiConnection,
  isAiConfigured,
  GEMINI_MODELS
} from '../ai/byok-client.js';
import {
  getCheckpoints,
  restoreCheckpoint,
  undoCheckpoint,
  redoCheckpoint,
  clearCheckpoints
} from '../storage/checkpoint-timeline.js';

export function renderVibeStudioHtml(state = {}) {
  const isExtension = Boolean(state.isExtension);
  const isOnline = Boolean(state.isConfigured);
  const messages = Array.isArray(state.messages) ? state.messages : [];
  const latestDiff = state.latestDiff || null;

  return `
    <div class="vibe-studio-root">
      <!-- Vibe Top Bar -->
      <header class="vibe-top-bar">
        <div class="vibe-title-group">
          <span class="vibe-badge"><i class="fa-solid fa-terminal"></i> Vibe Coding Agent</span>
          <span class="vibe-status-pill ${isOnline ? 'online' : 'offline'}" id="vibe-status-indicator" title="${isOnline ? 'Connected to BYOK Gemini/OpenAI' : 'Offline Mode (Deterministic Rules)'}">
            <span class="vibe-dot"></span>
            <span>${isOnline ? 'AI Connected' : 'Offline Heuristics'}</span>
          </span>
        </div>

        <div class="vibe-header-tools">
          <button type="button" class="btn-tool" id="btn-open-timeline" title="Browse Checkpoint Undo / Redo Timeline (30 Snapshots)">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Timeline</span>
          </button>
          <button type="button" class="btn-tool" id="btn-open-ai-settings" title="BYOK Gemini &amp; OpenAI API Settings">
            <i class="fa-solid fa-gear"></i>
            <span>BYOK Key</span>
          </button>
        </div>
      </header>

      <!-- Visual Before/After Diff Summary Card -->
      ${latestDiff ? `
        <div class="vibe-diff-card" id="vibe-latest-diff-card">
          <div class="vibe-diff-icon">
            <i class="fa-solid fa-code-compare"></i>
          </div>
          <div class="vibe-diff-content">
            <span class="vibe-diff-title">Latest Applied Vibe Changes</span>
            <p class="vibe-diff-summary">${escapeHtml(latestDiff.summary)}</p>
          </div>
          <button type="button" class="btn-micro btn-outline" id="btn-undo-latest-vibe" title="Revert this change immediately">
            <i class="fa-solid fa-rotate-left"></i> Undo
          </button>
        </div>
      ` : ''}

      <!-- Chat History Stage -->
      <div class="vibe-chat-history" id="vibe-chat-messages">
        ${messages.length === 0 ? `
          <div class="vibe-welcome-box">
            <div class="vibe-avatar-circle">
              <i class="fa-solid fa-brain"></i>
            </div>
            <h4 class="vibe-welcome-title">Welcome to Safe Vibe Coding</h4>
            <p class="vibe-welcome-sub">Describe any visual theme, academic polish, or layout edit in English or Bengali. Every edit creates an automatic undo checkpoint.</p>
            <div class="vibe-quick-suggestions">
              <button type="button" class="quick-vibe-chip" data-vibe-cmd="Change theme to dark with emerald accent (#10b981) and 2 columns">
                Emerald Dark Theme (2 Cols)
              </button>
              <button type="button" class="quick-vibe-chip" data-vibe-cmd="Switch portfolio template to Clean Minimalist">
                Clean Minimalist Template
              </button>
              <button type="button" class="quick-vibe-chip" data-vibe-cmd="থিম ডার্ক মোডে পরিবর্তন করো এবং বাটন নীল করো">
                থিম ডার্ক ও নীল (বাংলা)
              </button>
              <button type="button" class="quick-vibe-chip" data-vibe-cmd="Add technical skills: Nextflow, BLAST+, Biopython, GeoPandas">
                Add NGS &amp; Bioinformatics Skills
              </button>
            </div>
          </div>
        ` : ''}

        ${messages.map((msg) => `
          <div class="vibe-message-row ${msg.role === 'user' ? 'user-msg' : 'agent-msg'}">
            <div class="vibe-msg-bubble">
              <div class="vibe-msg-header">
                <span class="vibe-msg-author">${msg.role === 'user' ? 'You' : 'ZunDeck Agent'}</span>
                <span class="vibe-msg-time">${msg.time || ''}</span>
              </div>
              <p class="vibe-msg-text">${escapeHtml(msg.text)}</p>
              ${msg.diffSummary ? `
                <div class="vibe-msg-diff-pill">
                  <i class="fa-solid fa-check"></i> ${escapeHtml(msg.diffSummary)}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Vibe Chat Input Stage -->
      <footer class="vibe-input-stage">
        <form id="form-vibe-chat" class="vibe-input-form">
          <input type="text" id="input-vibe-prompt" class="vibe-text-input" placeholder="Ask in English or Bengali (e.g. 'Make theme emerald dark and add Python')..." autocomplete="off">
          <button type="submit" class="btn-primary" id="btn-send-vibe">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </footer>

      <!-- Checkpoint Timeline Modal Drawer -->
      <div class="vibe-drawer-overlay" id="vibe-timeline-drawer" style="display: none;">
        <div class="vibe-drawer-window">
          <div class="vibe-drawer-header">
            <div>
              <span class="vibe-badge"><i class="fa-solid fa-clock-rotate-left"></i> Safe Versioning</span>
              <h3 class="vibe-drawer-title">Checkpoint Undo Timeline</h3>
              <p class="vibe-drawer-sub">Last 30 snapshots with 1-click restore, undo, and diff inspection.</p>
            </div>
            <button type="button" class="btn-micro" id="btn-close-timeline">&times;</button>
          </div>
          <div class="vibe-timeline-list" id="vibe-timeline-items">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>

      <!-- BYOK Settings Modal -->
      <div class="vibe-drawer-overlay" id="vibe-settings-modal" style="display: none;">
        <div class="vibe-modal-box">
          <div class="vibe-drawer-header">
            <div>
              <h3 class="vibe-drawer-title">BYOK AI Settings (100% Private Vault)</h3>
              <p class="vibe-drawer-sub">Keys are stored strictly in local browser storage and never logged.</p>
            </div>
            <button type="button" class="btn-micro" id="btn-close-ai-settings">&times;</button>
          </div>
          <div class="vibe-settings-body">
            <div class="form-group">
              <label class="form-label" for="select-ai-provider">AI Provider</label>
              <select id="select-ai-provider" class="form-select">
                <option value="gemini">Google Gemini API (Default — Multimodal Text, Vision &amp; PDFs)</option>
                <option value="openai_compatible">OpenAI Compatible (Ollama, LM Studio, OpenAI)</option>
              </select>
            </div>

            <div class="form-group" id="group-gemini-key">
              <label class="form-label" for="input-gemini-key">Google Gemini API Key</label>
              <input type="password" id="input-gemini-key" class="form-input" placeholder="AIzaSy...">
              <span class="form-hint">Free key from <strong>aistudio.google.com</strong> (zero credit card needed).</span>
            </div>

            <div class="form-group" id="group-gemini-model">
              <label class="form-label" for="select-gemini-model">Gemini Model</label>
              <select id="select-gemini-model" class="form-select">
                ${GEMINI_MODELS.map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" id="group-openai-endpoint" style="display: none;">
              <label class="form-label" for="input-openai-endpoint">Custom Base URL</label>
              <input type="text" id="input-openai-endpoint" class="form-input" placeholder="http://localhost:11434/v1">
            </div>

            <div class="form-group" id="group-openai-key" style="display: none;">
              <label class="form-label" for="input-openai-key">API Key</label>
              <input type="password" id="input-openai-key" class="form-input" placeholder="sk-...">
            </div>

            <div id="ai-test-status" class="ai-test-feedback" style="display: none;"></div>

            <div class="vibe-settings-actions">
              <button type="button" class="btn-tool" id="btn-test-ai-connection">
                <i class="fa-solid fa-plug"></i> Test Connection
              </button>
              <button type="button" class="btn-primary" id="btn-save-ai-settings">
                <i class="fa-solid fa-check"></i> Save Key to Vault
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export class VibeStudioController {
  constructor(options = {}) {
    this.container = options.container || null;
    this.activeProfile = options.profile || {};
    this.isExtension = Boolean(options.isExtension);
    this.messages = [];
    this.latestDiff = null;
    this.isConfigured = false;
    this.isProcessing = false;

    this.onProfileUpdated = typeof options.onProfileUpdated === 'function' ? options.onProfileUpdated : () => {};
  }

  async init() {
    this.isConfigured = await isAiConfigured();
    this.render();
  }

  setProfile(profile) {
    this.activeProfile = profile;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = renderVibeStudioHtml({
      isExtension: this.isExtension,
      isConfigured: this.isConfigured,
      messages: this.messages,
      latestDiff: this.latestDiff
    });

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Send Form
    const form = this.container.querySelector('#form-vibe-chat');
    const input = this.container.querySelector('#input-vibe-prompt');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input?.value?.trim();
      if (!text || this.isProcessing) return;

      input.value = '';
      await this.handleUserMessage(text);
    });

    // Quick suggestion chips
    this.container.querySelectorAll('.quick-vibe-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-vibe-cmd');
        if (cmd && input) {
          input.value = cmd;
          input.focus();
        }
      });
    });

    // Undo latest diff button
    const btnUndo = this.container.querySelector('#btn-undo-latest-vibe');
    btnUndo?.addEventListener('click', async () => {
      const res = await undoCheckpoint();
      if (res && res.profile) {
        this.activeProfile = res.profile;
        this.latestDiff = null;
        this.onProfileUpdated(this.activeProfile);
        this.render();
      }
    });

    // Open/Close Timeline
    const btnTimeline = this.container.querySelector('#btn-open-timeline');
    const timelineDrawer = this.container.querySelector('#vibe-timeline-drawer');
    const btnCloseTimeline = this.container.querySelector('#btn-close-timeline');

    btnTimeline?.addEventListener('click', async () => {
      await this.populateTimeline();
      if (timelineDrawer) timelineDrawer.style.display = 'flex';
    });

    btnCloseTimeline?.addEventListener('click', () => {
      if (timelineDrawer) timelineDrawer.style.display = 'none';
    });

    // Open/Close Settings
    const btnSettings = this.container.querySelector('#btn-open-ai-settings');
    const settingsModal = this.container.querySelector('#vibe-settings-modal');
    const btnCloseSettings = this.container.querySelector('#btn-close-ai-settings');

    btnSettings?.addEventListener('click', async () => {
      await this.populateSettingsForm();
      if (settingsModal) settingsModal.style.display = 'flex';
    });

    btnCloseSettings?.addEventListener('click', () => {
      if (settingsModal) settingsModal.style.display = 'none';
    });

    // Provider select switch
    const selectProvider = this.container.querySelector('#select-ai-provider');
    selectProvider?.addEventListener('change', (e) => {
      const isOAI = e.target.value === 'openai_compatible';
      const gGem = this.container.querySelector('#group-gemini-key');
      const gMod = this.container.querySelector('#group-gemini-model');
      const gEnd = this.container.querySelector('#group-openai-endpoint');
      const gKey = this.container.querySelector('#group-openai-key');
      if (gGem) gGem.style.display = isOAI ? 'none' : 'block';
      if (gMod) gMod.style.display = isOAI ? 'none' : 'block';
      if (gEnd) gEnd.style.display = isOAI ? 'block' : 'none';
      if (gKey) gKey.style.display = isOAI ? 'block' : 'none';
    });

    // Test connection button
    const btnTest = this.container.querySelector('#btn-test-ai-connection');
    btnTest?.addEventListener('click', async () => {
      await this.runConnectionTest();
    });

    // Save settings button
    const btnSave = this.container.querySelector('#btn-save-ai-settings');
    btnSave?.addEventListener('click', async () => {
      await this.saveSettingsFromForm();
      if (settingsModal) settingsModal.style.display = 'none';
    });
  }

  async handleUserMessage(userText) {
    this.isProcessing = true;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({
      role: 'user',
      text: userText,
      time: nowTime
    });
    this.render();

    try {
      const result = await processVibeAgentMessage(userText, this.activeProfile);
      this.activeProfile = result.updatedProfile;
      this.latestDiff = {
        summary: result.diffSummary,
        checkpointId: result.checkpointId
      };

      this.messages.push({
        role: 'agent',
        text: result.explanation,
        diffSummary: result.diffSummary,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      this.onProfileUpdated(this.activeProfile);
    } catch (err) {
      this.messages.push({
        role: 'agent',
        text: `Error processing command: ${err.message}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      this.isProcessing = false;
      this.render();
      // Scroll to bottom
      const msgStage = this.container.querySelector('#vibe-chat-messages');
      if (msgStage) msgStage.scrollTop = msgStage.scrollHeight;
    }
  }

  async populateTimeline() {
    const timelineContainer = this.container.querySelector('#vibe-timeline-items');
    if (!timelineContainer) return;

    const checkpoints = await getCheckpoints();
    if (!checkpoints.length) {
      timelineContainer.innerHTML = '<div class="gp-empty-state">No checkpoints saved yet. Any edit will automatically create one.</div>';
      return;
    }

    timelineContainer.innerHTML = checkpoints.map((cp) => `
      <div class="timeline-item-card" data-cp-id="${cp.id}">
        <div class="timeline-meta-row">
          <span class="timeline-author-tag ${cp.author}">${cp.author}</span>
          <span class="timeline-time">${new Date(cp.timestamp).toLocaleString()}</span>
        </div>
        <h4 class="timeline-title">${escapeHtml(cp.label)}</h4>
        <p class="timeline-diff">${escapeHtml(cp.diffSummary)}</p>
        <div class="timeline-actions">
          <button type="button" class="btn-micro btn-primary btn-restore-cp" data-restore-id="${cp.id}">
            <i class="fa-solid fa-clock-rotate-left"></i> Restore Snapshot
          </button>
        </div>
      </div>
    `).join('');

    timelineContainer.querySelectorAll('.btn-restore-cp').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-restore-id');
        const restored = await restoreCheckpoint(id);
        if (restored) {
          this.activeProfile = restored;
          this.onProfileUpdated(this.activeProfile);
          const drawer = this.container.querySelector('#vibe-timeline-drawer');
          if (drawer) drawer.style.display = 'none';
          this.render();
        }
      });
    });
  }

  async populateSettingsForm() {
    const creds = await getAiCredentials();
    const selectProv = this.container.querySelector('#select-ai-provider');
    const inpGemKey = this.container.querySelector('#input-gemini-key');
    const selGemMod = this.container.querySelector('#select-gemini-model');
    const inpOaiEnd = this.container.querySelector('#input-openai-endpoint');
    const inpOaiKey = this.container.querySelector('#input-openai-key');

    if (selectProv) selectProv.value = creds.provider;
    if (inpGemKey) inpGemKey.value = creds.apiKey && creds.provider === 'gemini' ? creds.apiKey : '';
    if (selGemMod) selGemMod.value = creds.model;
    if (inpOaiEnd) inpOaiEnd.value = creds.customEndpoint;
    if (inpOaiKey) inpOaiKey.value = creds.apiKey && creds.provider === 'openai_compatible' ? creds.apiKey : '';

    selectProv?.dispatchEvent(new Event('change'));
  }

  async runConnectionTest() {
    const selectProv = this.container.querySelector('#select-ai-provider');
    const inpGemKey = this.container.querySelector('#input-gemini-key');
    const selGemMod = this.container.querySelector('#select-gemini-model');
    const inpOaiEnd = this.container.querySelector('#input-openai-endpoint');
    const inpOaiKey = this.container.querySelector('#input-openai-key');
    const feedback = this.container.querySelector('#ai-test-status');

    if (!feedback) return;
    feedback.style.display = 'block';
    feedback.className = 'ai-test-feedback testing';
    feedback.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing connection...';

    const provider = selectProv?.value || 'gemini';
    const apiKey = provider === 'gemini' ? (inpGemKey?.value || '') : (inpOaiKey?.value || '');

    const res = await testAiConnection({
      provider,
      apiKey,
      model: selGemMod?.value || 'gemini-2.0-flash',
      customEndpoint: inpOaiEnd?.value || 'https://api.openai.com/v1'
    });

    if (res.success) {
      feedback.className = 'ai-test-feedback success';
      feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${escapeHtml(res.message)}`;
    } else {
      feedback.className = 'ai-test-feedback error';
      feedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(res.message)}`;
    }
  }

  async saveSettingsFromForm() {
    const selectProv = this.container.querySelector('#select-ai-provider');
    const inpGemKey = this.container.querySelector('#input-gemini-key');
    const selGemMod = this.container.querySelector('#select-gemini-model');
    const inpOaiEnd = this.container.querySelector('#input-openai-endpoint');
    const inpOaiKey = this.container.querySelector('#input-openai-key');

    const provider = selectProv?.value || 'gemini';
    const apiKey = provider === 'gemini' ? (inpGemKey?.value || '') : (inpOaiKey?.value || '');

    await saveAiCredentials({
      provider,
      apiKey,
      model: selGemMod?.value,
      customEndpoint: inpOaiEnd?.value
    });

    this.isConfigured = await isAiConfigured();
    this.render();
  }
}

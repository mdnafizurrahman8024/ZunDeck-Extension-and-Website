import { escapeHtml } from '../security/sanitizer.js';
import {
  processVibeAgentMessage,
  VIBE_TOOLS
} from '../ai/vibe-agent.js';
import {
  getAiCredentials,
  saveAiCredentials,
  testAiConnection,
  fetchLiveModels,
  getAvailableModels,
  isAiConfigured,
  AI_PROVIDERS,
  PROVIDER_METADATA,
  PRESET_MODELS,
  GEMINI_MODELS,
  callAiText
} from '../ai/byok-client.js';
import {
  getProviderModelCache,
  formatLastSyncTimestamp
} from '../storage/model-cache-storage.js';
import {
  PROMPT_LIBRARY,
  generateStructuredPrompt
} from '../ai/prompt-library.js';
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
  const isPromptPaneOpen = Boolean(state.isPromptPaneOpen);
  const promptEngMessages = Array.isArray(state.promptEngMessages) ? state.promptEngMessages : [];

  return `
    <div class="vibe-studio-root">
      <!-- Vibe Top Bar -->
      <header class="vibe-top-bar">
        <div class="vibe-title-group">
          <span class="vibe-badge"><i class="fa-solid fa-terminal"></i> Vibe Coding Agent</span>
          <span class="vibe-status-pill ${isOnline ? 'online' : 'offline'}" id="vibe-status-indicator" title="${isOnline ? 'Connected to BYOK AI Provider' : 'Offline Heuristics (Deterministic Rules)'}">
            <span class="vibe-dot"></span>
            <span>${isOnline ? 'AI Connected' : 'Offline Heuristics'}</span>
          </span>
        </div>

        <div class="vibe-header-tools">
          <button type="button" class="btn-tool ${isPromptPaneOpen ? 'active' : ''}" id="btn-toggle-prompt-chat" title="Interactive AI Prompt Engineering Side Panel">
            <i class="fa-solid fa-comments"></i>
            <span>Prompt with AI</span>
          </button>
          <button type="button" class="btn-tool" id="btn-open-timeline" title="Browse Checkpoint Undo / Redo Timeline (30 Snapshots)">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Timeline</span>
          </button>
          <button type="button" class="btn-tool" id="btn-open-ai-settings" title="BYOK AI Settings (Gemini, Claude, OpenAI, DeepSeek, Groq)">
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

      <!-- Main Workspace Split Container -->
      <div class="vibe-workspace-split ${isPromptPaneOpen ? 'prompt-pane-open' : ''}" id="vibe-split-container">
        
        <!-- Primary Vibe Execution Panel -->
        <div class="vibe-main-stage">
          <!-- Chat History Stage -->
          <div class="vibe-chat-history" id="vibe-chat-messages">
            ${messages.length === 0 ? `
              <div class="vibe-welcome-box">
                <div class="vibe-avatar-circle">
                  <i class="fa-solid fa-brain"></i>
                </div>
                <h4 class="vibe-welcome-title">Welcome to Safe Vibe Coding Studio</h4>
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
                  <button type="button" class="quick-vibe-chip" data-vibe-cmd="Enable perimeter gradient border and radiant 20px teal glow">
                    Radiant Glow &amp; Shifting Border
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
              <button type="submit" class="btn-primary" id="btn-send-vibe" title="Send to Vibe Agent">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </footer>
        </div>

        <!-- Collapsible Side-by-Side Prompt Engineering Chat Panel -->
        <div class="vibe-prompt-engineering-pane ${isPromptPaneOpen ? 'open' : ''}" id="vibe-prompt-engineering-pane" style="${isPromptPaneOpen ? '' : 'display: none;'}">
          <div class="prompt-pane-header">
            <div class="prompt-pane-title-wrap">
              <i class="fa-solid fa-comments prompt-pane-icon"></i>
              <div>
                <h4 class="prompt-pane-title">Prompt Engineering Chat</h4>
                <p class="prompt-pane-sub">English • বাংলা • Banglish &rarr; 5-Point Pro Prompt</p>
              </div>
            </div>
            <button type="button" class="btn-close-prompt-pane" id="btn-close-prompt-pane" aria-label="Close Prompt Studio" title="Close Prompt Studio (✕)">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="prompt-pane-body" id="prompt-pane-messages">
            ${promptEngMessages.length === 0 ? `
              <div class="prompt-pane-welcome">
                <p class="prompt-pane-hint">Tell me what you want to change in any language (English, বাংলা, or Banglish). I will synthesize a structured 5-point prompt containing Role, Objective, Commands, Design Specs, and Security Rules.</p>
                <div class="prompt-quick-chips">
                  <button type="button" class="quick-eng-chip" data-eng-idea="আমার পোর্টফোলিওকে ডার্ক ও নীল করো">
                    ডার্ক ও নীল থিম (বাংলা)
                  </button>
                  <button type="button" class="quick-eng-chip" data-eng-idea="Make an authoritative AMR pathogen surveillance portfolio with maps and ticker">
                    AMR Pathogen Showcase
                  </button>
                  <button type="button" class="quick-eng-chip" data-eng-idea="Optimize my CV for a Bioinformatics Analyst position">
                    Bioinformatics ATS CV
                  </button>
                  <button type="button" class="quick-eng-chip" data-eng-idea="Draft a PhD SOP for molecular epidemiology">
                    PhD SOP Draft
                  </button>
                </div>
              </div>
            ` : ''}

            ${promptEngMessages.map((m) => `
              <div class="eng-msg-row ${m.role}">
                <div class="eng-msg-bubble">
                  <div class="eng-msg-header">
                    <span class="eng-msg-author">${m.role === 'user' ? 'You' : 'Prompt Engineer'}</span>
                    <span class="eng-msg-time">${m.time || ''}</span>
                  </div>
                  <p class="eng-msg-text">${escapeHtml(m.text)}</p>
                  ${m.structuredPrompt ? `
                    <div class="eng-structured-card">
                      <div class="eng-card-top">
                        <span class="eng-card-badge"><i class="fa-solid fa-file-code"></i> Structured Pro Prompt</span>
                        <div class="eng-card-actions">
                          <button type="button" class="btn-micro btn-outline btn-eng-copy" data-copy-text="${escapeHtml(m.structuredPrompt)}" title="Copy to clipboard">
                            <i class="fa-solid fa-copy"></i> Copy
                          </button>
                          <button type="button" class="btn-micro btn-outline btn-eng-edit" data-edit-text="${escapeHtml(m.structuredPrompt)}" title="Populate vibe input for editing">
                            <i class="fa-solid fa-pen"></i> Edit
                          </button>
                          <button type="button" class="btn-micro btn-primary btn-eng-send" data-send-text="${escapeHtml(m.structuredPrompt)}" title="Execute immediately with Vibe Agent">
                            <i class="fa-solid fa-play"></i> Send to Agent
                          </button>
                        </div>
                      </div>
                      <pre class="eng-prompt-code">${escapeHtml(m.structuredPrompt)}</pre>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <footer class="prompt-pane-footer">
            <form id="form-prompt-eng" class="prompt-eng-form">
              <input type="text" id="input-prompt-eng" class="vibe-text-input" placeholder="Type request in বাংলা, Banglish, or English..." autocomplete="off">
              <button type="submit" class="btn-primary" id="btn-send-eng" title="Generate Pro Prompt">
                <i class="fa-solid fa-sparkles"></i>
              </button>
            </form>
          </footer>
        </div>

      </div>

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
              <span class="vibe-badge"><i class="fa-solid fa-shield-halved"></i> 100% Local Private Vault</span>
              <h3 class="vibe-drawer-title">BYOK AI Settings (All Major Providers)</h3>
              <p class="vibe-drawer-sub">Your API keys are stored strictly in local browser vault storage and never logged or proxied.</p>
            </div>
            <button type="button" class="btn-micro" id="btn-close-ai-settings">&times;</button>
          </div>
          <div class="vibe-settings-body">
            <div class="form-group">
              <label class="form-label" for="select-ai-provider">AI Provider</label>
              <select id="select-ai-provider" class="form-select">
                <option value="gemini">Google Gemini API (Default — Multimodal Text, Vision &amp; PDFs)</option>
                <option value="anthropic">Anthropic Claude (Claude 3.7 Sonnet, Claude 3.5)</option>
                <option value="openai">OpenAI (GPT-4.5, GPT-4o, o3, o4-mini)</option>
                <option value="deepseek">DeepSeek (DeepSeek-V3, DeepSeek-R1 Reasoning)</option>
                <option value="groq">Groq (Ultra-Fast Llama 3.3 &amp; Mixtral)</option>
                <option value="openrouter">OpenRouter (Access 200+ Models with 1 Key)</option>
                <option value="xai">xAI (Grok-2 &amp; Grok Beta)</option>
                <option value="mistral">Mistral AI (Mistral Large &amp; Codestral)</option>
                <option value="custom">Custom Endpoint (Ollama, LM Studio, LocalAI)</option>
                <option value="openai_compatible">OpenAI-Compatible Endpoint</option>
              </select>
            </div>

            <div class="form-group" id="group-ai-key">
              <label class="form-label" for="input-ai-key">
                <span>API Key</span>
                <span class="key-visibility-toggle" id="btn-toggle-key-visibility" title="Show/Hide Key">
                  <i class="fa-solid fa-eye" id="icon-key-visibility"></i>
                </span>
              </label>
              <input type="password" id="input-ai-key" class="form-input" placeholder="Paste your API key here...">
              <span class="form-hint" id="hint-ai-provider">Free key from <strong>aistudio.google.com</strong> (zero credit card needed).</span>
            </div>

            <div class="form-group" id="group-custom-endpoint" style="display: none;">
              <label class="form-label" for="input-custom-endpoint">Custom Base URL</label>
              <input type="text" id="input-custom-endpoint" class="form-input" placeholder="http://localhost:11434/v1">
              <span class="form-hint">Endpoint URL supporting the <code>/chat/completions</code> REST schema.</span>
            </div>

            <div class="form-group" id="group-ai-model">
              <div class="model-select-header">
                <label class="form-label" for="select-ai-model">Select Model</label>
                <span class="model-last-updated" id="model-last-updated">Last updated: Just now</span>
                <button type="button" class="btn-micro btn-outline" id="btn-sync-models" data-alias="btn-fetch-live-models" title="Sync live model catalog from provider">
                  <i class="fa-solid fa-arrows-rotate"></i> Sync Models
                </button>
              </div>
              <select id="select-ai-model" class="form-select">
                <!-- Dynamically populated -->
              </select>
            </div>

            <div class="form-group" id="group-custom-model-id">
              <label class="form-label" for="input-custom-model-id">Custom Model ID (Optional Override)</label>
              <input type="text" id="input-custom-model-id" class="form-input" placeholder="e.g. gemini-4-hydrogen or gpt-6.2-sol">
              <span class="form-hint">Override preset list with any exact model identifier.</span>
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
    this.promptEngMessages = [];
    this.latestDiff = null;
    this.isConfigured = false;
    this.isProcessing = false;
    this.isPromptPaneOpen = false;
    this.isKeyVisible = false;

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
      latestDiff: this.latestDiff,
      isPromptPaneOpen: this.isPromptPaneOpen,
      promptEngMessages: this.promptEngMessages
    });

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Send Main Vibe Form
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

    // Toggle Prompt Engineering Pane
    const btnTogglePrompt = this.container.querySelector('#btn-toggle-prompt-chat');
    btnTogglePrompt?.addEventListener('click', () => {
      this.isPromptPaneOpen = !this.isPromptPaneOpen;
      this.render();
    });

    const btnClosePrompt = this.container.querySelector('#btn-close-prompt-pane');
    btnClosePrompt?.addEventListener('click', () => {
      this.isPromptPaneOpen = false;
      this.render();
    });

    // Prompt Engineering Form
    const formPromptEng = this.container.querySelector('#form-prompt-eng');
    const inputPromptEng = this.container.querySelector('#input-prompt-eng');

    formPromptEng?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userText = inputPromptEng?.value?.trim();
      if (!userText) return;

      inputPromptEng.value = '';
      await this.handlePromptEngMessage(userText);
    });

    // Quick chips in Prompt Engineering Pane
    this.container.querySelectorAll('.quick-eng-chip').forEach((chip) => {
      chip.addEventListener('click', async () => {
        const idea = chip.getAttribute('data-eng-idea');
        if (idea) {
          await this.handlePromptEngMessage(idea);
        }
      });
    });

    // Prompt Engineering Card Actions (Delegated)
    this.container.addEventListener('click', async (e) => {
      // Send to Vibe Agent
      const btnSend = e.target.closest('.btn-eng-send');
      if (btnSend) {
        const promptText = btnSend.getAttribute('data-send-text');
        if (promptText) {
          await this.handleUserMessage(promptText);
        }
        return;
      }

      // Edit Before Running
      const btnEdit = e.target.closest('.btn-eng-edit');
      if (btnEdit) {
        const promptText = btnEdit.getAttribute('data-edit-text');
        if (promptText && input) {
          input.value = promptText;
          input.focus();
        }
        return;
      }

      // Copy Prompt
      const btnCopy = e.target.closest('.btn-eng-copy');
      if (btnCopy) {
        const textToCopy = btnCopy.getAttribute('data-copy-text');
        if (textToCopy) {
          try {
            await navigator.clipboard.writeText(textToCopy);
            const orig = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => {
              btnCopy.innerHTML = orig;
            }, 1800);
          } catch {
            // fallback
          }
        }
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

    // Open/Close BYOK Settings
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

    // Key visibility eye toggle
    const btnEye = this.container.querySelector('#btn-toggle-key-visibility');
    const inpKey = this.container.querySelector('#input-ai-key');
    const iconEye = this.container.querySelector('#icon-key-visibility');
    btnEye?.addEventListener('click', () => {
      this.isKeyVisible = !this.isKeyVisible;
      if (inpKey) inpKey.type = this.isKeyVisible ? 'text' : 'password';
      if (iconEye) iconEye.className = this.isKeyVisible ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    // Provider select change handler
    const selectProvider = this.container.querySelector('#select-ai-provider');
    selectProvider?.addEventListener('change', async (e) => {
      await this.handleProviderChange(e.target.value);
    });

    // Sync / Fetch Live Models Button
    const btnSyncModels = this.container.querySelector('#btn-sync-models') || this.container.querySelector('#btn-fetch-live-models');
    btnSyncModels?.addEventListener('click', async () => {
      await this.runFetchLiveModels();
    });

    // Auto-sync on API Key blur or input change
    const inpAiKey = this.container.querySelector('#input-ai-key');
    inpAiKey?.addEventListener('blur', async () => {
      const key = (inpAiKey.value || '').trim();
      if (key.length > 5) {
        await this.runFetchLiveModels(true);
      }
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
      const msgStage = this.container.querySelector('#vibe-chat-messages');
      if (msgStage) msgStage.scrollTop = msgStage.scrollHeight;
    }
  }

  async handlePromptEngMessage(userText) {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.promptEngMessages.push({
      role: 'user',
      text: userText,
      time: nowTime
    });
    this.render();

    const clean = userText.toLowerCase();
    let structuredPrompt = '';

    // If AI is configured, query the model to synthesize the prompt
    if (this.isConfigured) {
      try {
        const sysPrompt = `You are a precision prompt engineer for ZunDeck Vibe Studio.
The user wants to customize their portfolio, ATS CV, or SOP.
Synthesize their natural language request (in English, Bengali, or Banglish) into a structured 5-point Pro Prompt:
[ROLE]
...
[OBJECTIVE]
...
[COMMANDS]
1. ...
2. ...
[DESIGN SPECS]
...
[SECURITY & PRIVACY]
- ...
Output ONLY the structured prompt with zero filler preamble.`;

        structuredPrompt = await callAiText(userText, {
          systemInstruction: sysPrompt,
          temperature: 0.3
        });
      } catch {
        structuredPrompt = '';
      }
    }

    // Fallback: intelligent heuristic synthesis
    if (!structuredPrompt) {
      if (clean.includes('amr') || clean.includes('pathogen') || clean.includes('surveillance') || clean.includes('one health')) {
        structuredPrompt = generateStructuredPrompt({
          role: 'Lead Academic Portfolio Architect & One Health Specialist',
          objective: 'Reconfigure profile into an authoritative AMR surveillance showcase with teal accents and dual-column grid.',
          commands: [
            'Switch portfolio template to acad-flagship.',
            'Set theme to dark with deep teal accent (#0d9488) and slate backdrop.',
            'Organize cards into a balanced 2-column layout with 5-item initial view.',
            'Position verified first-author journal papers at the top of the research list.',
            'Highlight molecular epidemiology, pathogen genomics, and veterinary surveillance.'
          ],
          designSpecs: {
            theme: 'dark',
            accentColor: '#0d9488',
            fontFamily: 'Plus Jakarta Sans',
            gridColumns: 2,
            effects: 'Perimeter gradient border with radiant 20px teal glow.'
          },
          securityRules: 'Zero fabricated citations or synthetic DOIs. Preserve all verified links.'
        });
      } else if (clean.includes('ডার্ক') || clean.includes('নীল') || clean.includes('বাংলা') || clean.includes('bangla')) {
        structuredPrompt = generateStructuredPrompt({
          role: 'Bengali UI Localization & Frontend Stylist',
          objective: 'বাংলা কম্যান্ডের মাধ্যমে পোর্টফোলিওর থিম, ব্যাকগ্রাউন্ড ও বাটন কালার নিখুঁতভাবে পরিবর্তন করা।',
          commands: [
            'থিম ডার্ক মোডে পরিবর্তন করো।',
            'বাটন এবং অ্যাকসেন্ট কালার ভাইব্রেন্ট ব্লু (#3b82f6) করো।',
            'কার্ডগুলোকে ২-কলাম গ্রিডে সাজাও।',
            'ফন্ট Plus Jakarta Sans এ সেট করো।'
          ],
          designSpecs: {
            theme: 'dark',
            accentColor: '#3b82f6',
            fontFamily: 'Plus Jakarta Sans',
            gridColumns: 2
          },
          securityRules: 'কোনো কাল্পনিক তথ্য বা মিথ্যা অর্জন যোগ করবে না।'
        });
      } else if (clean.includes('bioinformatics') || clean.includes('ats') || clean.includes('cv') || clean.includes('resume')) {
        structuredPrompt = generateStructuredPrompt({
          role: 'Principal Technical Recruiter & ATS Architect',
          objective: 'Optimize CV profile for Bioinformatics Analyst roles with quantified metrics and high ATS compliance.',
          commands: [
            'Create tailored CV profile "Bioinformatics Analyst".',
            'Prioritize skills: Python, Nextflow, BLAST+, Linux, Pandas, Biopython.',
            'Restructure experience bullets using the Google XYZ formula.',
            'Switch CV template to cv-tech-minimalist for clean parsing.'
          ],
          designSpecs: {
            theme: 'dark',
            fontFamily: 'Inter',
            gridColumns: 1
          },
          securityRules: 'Keep metrics grounded in real project scopes without fabricating numbers.'
        });
      } else if (clean.includes('sop') || clean.includes('phd') || clean.includes('letter') || clean.includes('email')) {
        structuredPrompt = generateStructuredPrompt({
          role: 'Graduate Admissions Chair & Scholarly Editor',
          objective: 'Draft a competitive, scholarly document grounded strictly in verified profile facts.',
          commands: [
            'Draft targeted SOP / Letter connecting veterinary clinical pathology to molecular genomics.',
            'Structure into 4 cohesive sections: Motivation, Academic Foundation, Methodological Mastery, Future Trajectory.',
            'Maintain formal scholarly tone without generic filler phrases.'
          ],
          designSpecs: {
            fontFamily: 'Plus Jakarta Sans'
          },
          securityRules: 'Cite ONLY verified publications and genuine experiences from profile.'
        });
      } else {
        structuredPrompt = generateStructuredPrompt({
          role: 'Lead Portfolio Architect & UI Designer',
          objective: `Apply requested customization: "${userText}".`,
          commands: [
            'Apply requested theme tokens and color accents.',
            'Adjust card layout and spacing for optimal responsiveness.',
            'Preserve all authentic credentials and evidence links.'
          ],
          designSpecs: {
            theme: 'dark',
            accentColor: '#0d9488',
            fontFamily: 'Plus Jakarta Sans',
            gridColumns: 2
          },
          securityRules: 'Zero fabricated credentials. Preserve all verified profile records.'
        });
      }
    }

    this.promptEngMessages.push({
      role: 'agent',
      text: 'I have engineered a structured 5-point prompt for your request. You can send it directly to the Vibe Agent, copy it, or edit before running:',
      structuredPrompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.render();
    const paneBody = this.container.querySelector('#prompt-pane-messages');
    if (paneBody) paneBody.scrollTop = paneBody.scrollHeight;
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
    const inpKey = this.container.querySelector('#input-ai-key');
    const inpEndpoint = this.container.querySelector('#input-custom-endpoint');
    const inpCustomModelId = this.container.querySelector('#input-custom-model-id');

    if (selectProv) selectProv.value = creds.provider;
    if (inpKey) inpKey.value = creds.apiKey || '';
    if (inpEndpoint) inpEndpoint.value = creds.customEndpoint || '';
    if (inpCustomModelId) inpCustomModelId.value = creds.customModelId || '';

    await this.handleProviderChange(creds.provider, creds.model);
  }

  async handleProviderChange(provider, selectedModel = null) {
    const meta = PROVIDER_METADATA[provider] || PROVIDER_METADATA[AI_PROVIDERS.GEMINI];
    const groupEndpoint = this.container.querySelector('#group-custom-endpoint');
    const hint = this.container.querySelector('#hint-ai-provider');
    const inpEndpoint = this.container.querySelector('#input-custom-endpoint');
    const selectModel = this.container.querySelector('#select-ai-model');
    const lastUpdatedEl = this.container.querySelector('#model-last-updated');

    const isCustom = provider === AI_PROVIDERS.CUSTOM || provider === AI_PROVIDERS.OPENAI_COMPATIBLE;
    if (groupEndpoint) groupEndpoint.style.display = isCustom ? 'block' : 'none';
    if (inpEndpoint && !inpEndpoint.value) inpEndpoint.value = meta.defaultEndpoint;
    if (hint) hint.innerHTML = meta.keyHelpText;

    // Load available models from persistent cache or 2026 presets (stale-while-revalidate)
    const models = await getAvailableModels(provider);
    const cache = await getProviderModelCache(provider);

    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last updated: ${formatLastSyncTimestamp(cache?.lastUpdated)}`;
    }

    if (selectModel) {
      selectModel.innerHTML = models.map((m) => `
        <option value="${m.id}" ${selectedModel === m.id ? 'selected' : ''}>${escapeHtml(m.name)}${m.isNew ? ' [NEW]' : ''}</option>
      `).join('');
      if (selectedModel && !models.some((m) => m.id === selectedModel)) {
        selectModel.innerHTML += `<option value="${selectedModel}" selected>${escapeHtml(selectedModel)} (Active)</option>`;
      }
    }
  }

  async runFetchLiveModels(isBackground = false) {
    const btn = this.container.querySelector('#btn-sync-models') || this.container.querySelector('#btn-fetch-live-models');
    const selectProv = this.container.querySelector('#select-ai-provider');
    const inpKey = this.container.querySelector('#input-ai-key');
    const inpEndpoint = this.container.querySelector('#input-custom-endpoint');
    const selectModel = this.container.querySelector('#select-ai-model');
    const lastUpdatedEl = this.container.querySelector('#model-last-updated');
    const feedback = this.container.querySelector('#ai-test-status');

    if (btn && !isBackground) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Syncing...';
    }

    const provider = selectProv?.value || AI_PROVIDERS.GEMINI;
    const apiKey = (inpKey?.value || '').trim();
    const customEndpoint = (inpEndpoint?.value || '').trim();

    const res = await fetchLiveModels({ provider, apiKey, customEndpoint });

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Sync Models';
    }

    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last updated: ${formatLastSyncTimestamp(res.lastUpdated || Date.now())}`;
    }

    if (res.success && Array.isArray(res.models) && res.models.length) {
      const currentSelected = selectModel?.value;
      if (selectModel) {
        selectModel.innerHTML = res.models.map((m) => `
          <option value="${m.id}" ${currentSelected === m.id ? 'selected' : ''}>${escapeHtml(m.name)}${m.isNew ? ' [NEW]' : ''}</option>
        `).join('');
        if (currentSelected && !res.models.some((m) => m.id === currentSelected)) {
          selectModel.value = res.models[0]?.id || '';
        }
      }
      if (feedback && !isBackground) {
        feedback.style.display = 'block';
        feedback.className = 'ai-test-feedback success';
        feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Found ${res.models.length} live models for ${PROVIDER_METADATA[provider]?.name || provider}.`;
      }
    } else {
      if (feedback && !isBackground) {
        feedback.style.display = 'block';
        feedback.className = 'ai-test-feedback error';
        feedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(res.message || 'Could not fetch live models. Presets remain available.')}`;
      }
    }
  }

  async runConnectionTest() {
    const selectProv = this.container.querySelector('#select-ai-provider');
    const inpKey = this.container.querySelector('#input-ai-key');
    const selectModel = this.container.querySelector('#select-ai-model');
    const inpCustomModelId = this.container.querySelector('#input-custom-model-id');
    const inpEndpoint = this.container.querySelector('#input-custom-endpoint');
    const feedback = this.container.querySelector('#ai-test-status');

    if (!feedback) return;
    feedback.style.display = 'block';
    feedback.className = 'ai-test-feedback testing';
    feedback.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing connection...';

    const provider = selectProv?.value || AI_PROVIDERS.GEMINI;
    const apiKey = (inpKey?.value || '').trim();
    const model = (inpCustomModelId?.value || '').trim() || selectModel?.value;
    const customEndpoint = (inpEndpoint?.value || '').trim();

    const res = await testAiConnection({
      provider,
      apiKey,
      model,
      customEndpoint
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
    const inpKey = this.container.querySelector('#input-ai-key');
    const selectModel = this.container.querySelector('#select-ai-model');
    const inpCustomModelId = this.container.querySelector('#input-custom-model-id');
    const inpEndpoint = this.container.querySelector('#input-custom-endpoint');

    const provider = selectProv?.value || AI_PROVIDERS.GEMINI;
    const apiKey = (inpKey?.value || '').trim();
    const model = selectModel?.value;
    const customModelId = (inpCustomModelId?.value || '').trim();
    const customEndpoint = (inpEndpoint?.value || '').trim();

    await saveAiCredentials({
      provider,
      apiKey,
      model: customModelId || model,
      customModelId,
      customEndpoint
    });

    this.isConfigured = await isAiConfigured();
    this.render();
  }
}

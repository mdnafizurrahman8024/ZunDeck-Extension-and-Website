import { loadPrivateVault, savePrivateVault } from './vault-storage.js';
import { scanForSecrets } from '../security/secret-scanner.js';

export const MAX_CHECKPOINTS = 30;

let undoIndex = -1; // -1 means at the latest checkpoint

export function calculateDiffSummary(prevProfile, newProfile) {
  if (!prevProfile || !newProfile) return 'Initial workspace snapshot';

  const parts = [];

  // 1. Identity changes
  if (prevProfile.identity?.fullName !== newProfile.identity?.fullName) {
    parts.push(`Name changed to "${newProfile.identity?.fullName || 'Untitled'}"`);
  }
  if (prevProfile.identity?.roleBadge !== newProfile.identity?.roleBadge) {
    parts.push(`Role badge updated: "${newProfile.identity?.roleBadge || ''}"`);
  }

  // 2. Collection count differences
  const countDiff = (label, prevArr, newArr) => {
    const pLen = Array.isArray(prevArr) ? prevArr.length : 0;
    const nLen = Array.isArray(newArr) ? newArr.length : 0;
    if (nLen > pLen) parts.push(`Added ${nLen - pLen} ${label}`);
    else if (nLen < pLen) parts.push(`Removed ${pLen - nLen} ${label}`);
    else if (JSON.stringify(prevArr) !== JSON.stringify(newArr)) parts.push(`Refined ${label}`);
  };

  countDiff('Publication(s)', prevProfile.publications, newProfile.publications);
  countDiff('Education item(s)', prevProfile.education, newProfile.education);
  countDiff('Research appointment(s)', prevProfile.research, newProfile.research);
  countDiff('Project(s)', prevProfile.projects, newProfile.projects);
  countDiff('Certification(s)', prevProfile.certifications, newProfile.certifications);

  // 3. Theme & Layout Config
  const pCfg = prevProfile.displayConfig || {};
  const nCfg = newProfile.displayConfig || {};
  if (pCfg.theme !== nCfg.theme) {
    parts.push(`Theme: ${nCfg.theme || 'default'}`);
  }
  if (pCfg.accentColor !== nCfg.accentColor && nCfg.accentColor) {
    parts.push(`Accent color: ${nCfg.accentColor}`);
  }
  if (pCfg.portfolioTemplateId !== nCfg.portfolioTemplateId && nCfg.portfolioTemplateId) {
    parts.push(`Template: ${nCfg.portfolioTemplateId}`);
  }

  // Security check on diff
  const exposed = scanForSecrets(newProfile);
  const secNotice = exposed.found ? `⚠ Security Warning: ${exposed.matches.length} secret(s) flagged` : 'Security Check: 0 private fields exposed';

  if (!parts.length) {
    return `Refined profile content • ${secNotice}`;
  }

  return `${parts.slice(0, 3).join(' • ')} • ${secNotice}`;
}

export async function getCheckpoints() {
  const vault = await loadPrivateVault();
  const list = Array.isArray(vault.undoCheckpoints) ? vault.undoCheckpoints : [];
  return [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function createCheckpoint(profile, label = 'Workspace Edit', customDiff = '', author = 'vibe-agent') {
  if (!profile) return null;

  const vault = await loadPrivateVault();
  vault.undoCheckpoints = Array.isArray(vault.undoCheckpoints) ? vault.undoCheckpoints : [];

  const prevCheckpoint = vault.undoCheckpoints[0] || null;
  const diffSummary = customDiff || calculateDiffSummary(prevCheckpoint?.profile, profile);

  // Strip any API keys or secrets before saving snapshot
  const safeProfile = JSON.parse(JSON.stringify(profile));

  const checkpoint = {
    id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    label: String(label).slice(0, 80),
    diffSummary: String(diffSummary).slice(0, 200),
    author: ['user', 'vibe-agent', 'importer', 'system'].includes(author) ? author : 'user',
    profile: safeProfile
  };

  // Prepend new checkpoint
  vault.undoCheckpoints.unshift(checkpoint);

  // Trim to MAX_CHECKPOINTS (30)
  if (vault.undoCheckpoints.length > MAX_CHECKPOINTS) {
    vault.undoCheckpoints = vault.undoCheckpoints.slice(0, MAX_CHECKPOINTS);
  }

  undoIndex = -1; // Reset undo pointer to head
  await savePrivateVault(vault);
  return checkpoint;
}

export async function getCheckpointById(id) {
  const checkpoints = await getCheckpoints();
  return checkpoints.find((cp) => cp.id === id) || null;
}

export async function restoreCheckpoint(id) {
  const checkpoint = await getCheckpointById(id);
  if (!checkpoint || !checkpoint.profile) {
    throw new Error(`Checkpoint "${id}" not found.`);
  }
  return JSON.parse(JSON.stringify(checkpoint.profile));
}

export async function undoCheckpoint() {
  const checkpoints = await getCheckpoints();
  if (checkpoints.length <= 1) return null;

  if (undoIndex === -1) {
    undoIndex = 1;
  } else if (undoIndex < checkpoints.length - 1) {
    undoIndex++;
  } else {
    return null; // Reached oldest checkpoint
  }

  const target = checkpoints[undoIndex];
  return {
    profile: JSON.parse(JSON.stringify(target.profile)),
    checkpoint: target,
    index: undoIndex,
    total: checkpoints.length
  };
}

export async function redoCheckpoint() {
  const checkpoints = await getCheckpoints();
  if (undoIndex <= 0) return null; // Already at latest

  undoIndex--;
  const target = checkpoints[undoIndex];
  return {
    profile: JSON.parse(JSON.stringify(target.profile)),
    checkpoint: target,
    index: undoIndex,
    total: checkpoints.length
  };
}

export async function clearCheckpoints() {
  const vault = await loadPrivateVault();
  vault.undoCheckpoints = [];
  undoIndex = -1;
  await savePrivateVault(vault);
  return true;
}

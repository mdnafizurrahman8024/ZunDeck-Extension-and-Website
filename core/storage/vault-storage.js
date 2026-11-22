import { scanForSecrets } from '../security/secret-scanner.js';

export const VAULT_KEYS = {
  PRIVATE: 'zundeck_private',
  WORKSPACE: 'zundeck_workspace'
};

const memoryStore = new Map();

function isChromeExtension() {
  return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
}

function isLocalStorageAvailable() {
  return typeof localStorage !== 'undefined';
}

async function rawGet(key) {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve(res ? res[key] : null));
    });
  }
  if (isLocalStorageAvailable()) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }
  return memoryStore.get(key) || null;
}

async function rawSet(key, value) {
  if (isChromeExtension()) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
  memoryStore.set(key, value);
  return true;
}

export function createDefaultPrivateVault() {
  return {
    keys: {
      gemini: '',
      openai: '',
      anthropic: '',
      openrouter: '',
      githubPat: ''
    },
    settings: {
      theme: 'dark',
      autoSave: true,
      excludeKeysFromBackup: true
    },
    ideaNotes: [],
    aiChatHistory: [],
    undoCheckpoints: []
  };
}

export function createDefaultWorkspace() {
  return {
    activeProfile: null,
    cvProfiles: [],
    activeLetterDrafts: [],
    activeTemplates: {
      portfolio: 'acad-flagship',
      cv: 'cv-acad-flagship'
    },
    lastSaved: null
  };
}

export async function loadPrivateVault() {
  const loaded = await rawGet(VAULT_KEYS.PRIVATE);
  if (!loaded) return createDefaultPrivateVault();
  return {
    ...createDefaultPrivateVault(),
    ...loaded,
    keys: { ...createDefaultPrivateVault().keys, ...(loaded.keys || {}) },
    settings: { ...createDefaultPrivateVault().settings, ...(loaded.settings || {}) }
  };
}

export async function savePrivateVault(vaultData) {
  const clean = {
    ...vaultData,
    lastUpdated: new Date().toISOString()
  };
  await rawSet(VAULT_KEYS.PRIVATE, clean);
  return clean;
}

export async function updatePrivateVault(partialUpdates) {
  const current = await loadPrivateVault();
  const merged = {
    ...current,
    ...partialUpdates,
    keys: { ...current.keys, ...(partialUpdates.keys || {}) },
    settings: { ...current.settings, ...(partialUpdates.settings || {}) }
  };
  return savePrivateVault(merged);
}

export async function loadWorkspace() {
  const loaded = await rawGet(VAULT_KEYS.WORKSPACE);
  if (!loaded) return createDefaultWorkspace();
  return {
    ...createDefaultWorkspace(),
    ...loaded
  };
}

export async function saveWorkspace(workspaceData) {
  const clean = {
    ...workspaceData,
    lastSaved: new Date().toISOString()
  };
  await rawSet(VAULT_KEYS.WORKSPACE, clean);
  return clean;
}

export async function updateWorkspace(partialUpdates) {
  const current = await loadWorkspace();
  const merged = {
    ...current,
    ...partialUpdates
  };
  return saveWorkspace(merged);
}

export async function exportPortableBackup({ excludePrivateKeys = true } = {}) {
  const workspace = await loadWorkspace();
  const privateVault = await loadPrivateVault();

  let sanitizedPrivate = {
    settings: privateVault.settings,
    ideaNotes: privateVault.ideaNotes
  };

  if (!excludePrivateKeys) {
    sanitizedPrivate.keys = privateVault.keys;
  } else {
    sanitizedPrivate.keys = {
      gemini: '',
      openai: '',
      anthropic: '',
      openrouter: '',
      githubPat: ''
    };
  }

  const backupPackage = {
    schemaVersion: 'ZunProfileV1',
    backupType: 'ZunDeck-Full-Portable-Backup',
    exportedAt: new Date().toISOString(),
    excludePrivateKeys,
    workspace,
    private: sanitizedPrivate
  };

  if (excludePrivateKeys) {
    const scanResult = scanForSecrets(backupPackage, 'backup_export');
    if (!scanResult.clean) {
      const err = new Error('Secret Scanner caught private keys inside backup export with excludePrivateKeys=true');
      err.violations = scanResult.violations;
      throw err;
    }
  }

  return backupPackage;
}

export async function importPortableBackup(backupJson) {
  const data = typeof backupJson === 'string' ? JSON.parse(backupJson) : backupJson;

  if (!data || data.schemaVersion !== 'ZunProfileV1' || !data.workspace) {
    throw new Error('Invalid ZunDeck backup format: schemaVersion must be ZunProfileV1');
  }

  if (data.workspace) {
    await saveWorkspace(data.workspace);
  }

  if (data.private) {
    const currentVault = await loadPrivateVault();
    const mergedVault = {
      ...currentVault,
      settings: { ...currentVault.settings, ...(data.private.settings || {}) },
      ideaNotes: Array.isArray(data.private.ideaNotes) ? data.private.ideaNotes : currentVault.ideaNotes
    };
    if (data.private.keys && !data.excludePrivateKeys) {
      mergedVault.keys = { ...currentVault.keys, ...data.private.keys };
    }
    await savePrivateVault(mergedVault);
  }

  return { success: true, importedAt: new Date().toISOString() };
}

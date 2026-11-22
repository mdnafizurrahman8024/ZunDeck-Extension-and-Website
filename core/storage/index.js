const STORAGE_KEY = 'zundeck_profile_v1';

export const Storage = {
  loadLocal: () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {
      return null;
    }
    return null;
  },
  saveLocal: (profile) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }
};

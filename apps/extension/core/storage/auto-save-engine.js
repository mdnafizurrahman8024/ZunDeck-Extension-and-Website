export function createAutoSaveController({
  onSave,
  onStatusChange = () => {},
  delay = 2000
} = {}) {
  let timer = null;
  let isDirty = false;
  let isSaving = false;
  let lastSavedTime = null;

  function updateStatus(status, label) {
    onStatusChange({
      status,
      label,
      lastSavedTime,
      isDirty
    });
  }

  function markDirty(getDataToSave) {
    isDirty = true;
    updateStatus('dirty', 'Unsaved changes...');

    if (timer) clearTimeout(timer);

    timer = setTimeout(async () => {
      await flush(getDataToSave);
    }, delay);
  }

  async function flush(getDataToSave) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    if (!isDirty && !getDataToSave) return;

    try {
      isSaving = true;
      updateStatus('saving', 'Saving...');

      const payload = typeof getDataToSave === 'function' ? getDataToSave() : getDataToSave;
      if (typeof onSave === 'function') {
        await onSave(payload);
      }

      isDirty = false;
      lastSavedTime = new Date();
      updateStatus('saved', 'Saved locally • Just now');
    } catch (err) {
      updateStatus('error', 'Auto-save failed');
      throw err;
    } finally {
      isSaving = false;
    }
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    isDirty = false;
    updateStatus('offline', 'Offline Ready');
  }

  return {
    markDirty,
    flush,
    cancel,
    isDirty: () => isDirty,
    isSaving: () => isSaving,
    getLastSavedTime: () => lastSavedTime
  };
}

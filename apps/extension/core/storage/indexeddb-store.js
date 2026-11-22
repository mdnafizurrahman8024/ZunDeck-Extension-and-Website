const DB_NAME = 'zundeck_db';
const DB_VERSION = 1;
const STORE_NAMES = {
  MEDIA: 'media_blobs',
  SNAPSHOTS: 'workspace_snapshots'
};

const fallbackMemory = new Map();

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      return resolve(null);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAMES.MEDIA)) {
        db.createObjectStore(STORE_NAMES.MEDIA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.SNAPSHOTS)) {
        db.createObjectStore(STORE_NAMES.SNAPSHOTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putBlob(id, blob, metadata = {}) {
  const item = {
    id,
    blob,
    metadata,
    createdAt: new Date().toISOString()
  };

  const db = await openDb();
  if (!db) {
    fallbackMemory.set(`${STORE_NAMES.MEDIA}:${id}`, item);
    return item;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.MEDIA);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getBlob(id) {
  const db = await openDb();
  if (!db) {
    return fallbackMemory.get(`${STORE_NAMES.MEDIA}:${id}`) || null;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.MEDIA, 'readonly');
    const store = tx.objectStore(STORE_NAMES.MEDIA);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBlob(id) {
  const db = await openDb();
  if (!db) {
    fallbackMemory.delete(`${STORE_NAMES.MEDIA}:${id}`);
    return true;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAMES.MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_NAMES.MEDIA);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

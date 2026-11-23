const DB_NAME = 'zundeck_db';
const DB_VERSION = 2;

export const STORE_NAMES = {
  MEDIA: 'media_blobs',
  ORIGINALS: 'zundeck_media_originals',
  DOCUMENTS: 'documents_blobs',
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
      if (!db.objectStoreNames.contains(STORE_NAMES.ORIGINALS)) {
        db.createObjectStore(STORE_NAMES.ORIGINALS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.DOCUMENTS)) {
        db.createObjectStore(STORE_NAMES.DOCUMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.SNAPSHOTS)) {
        db.createObjectStore(STORE_NAMES.SNAPSHOTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putStoreItem(storeName, id, blob, metadata = {}) {
  const item = {
    id,
    blob,
    metadata,
    createdAt: new Date().toISOString()
  };

  const db = await openDb();
  if (!db) {
    fallbackMemory.set(`${storeName}:${id}`, item);
    return item;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoreItem(storeName, id) {
  const db = await openDb();
  if (!db) {
    return fallbackMemory.get(`${storeName}:${id}`) || null;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteStoreItem(storeName, id) {
  const db = await openDb();
  if (!db) {
    fallbackMemory.delete(`${storeName}:${id}`);
    return true;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// Media Blobs
export async function putBlob(id, blob, metadata = {}) {
  return putStoreItem(STORE_NAMES.MEDIA, id, blob, metadata);
}

export async function getBlob(id) {
  return getStoreItem(STORE_NAMES.MEDIA, id);
}

export async function deleteBlob(id) {
  return deleteStoreItem(STORE_NAMES.MEDIA, id);
}

// Original Untouched Images (Part 6 Undo/Restore)
export async function putOriginalBlob(id, blob, metadata = {}) {
  return putStoreItem(STORE_NAMES.ORIGINALS, id, blob, metadata);
}

export async function getOriginalBlob(id) {
  return getStoreItem(STORE_NAMES.ORIGINALS, id);
}

export async function deleteOriginalBlob(id) {
  return deleteStoreItem(STORE_NAMES.ORIGINALS, id);
}

// Documents (Direct PDF uploads, etc.)
export async function putDocumentBlob(id, blob, metadata = {}) {
  return putStoreItem(STORE_NAMES.DOCUMENTS, id, blob, metadata);
}

export async function getDocumentBlob(id) {
  return getStoreItem(STORE_NAMES.DOCUMENTS, id);
}

export async function deleteDocumentBlob(id) {
  return deleteStoreItem(STORE_NAMES.DOCUMENTS, id);
}

export function clearMemoryStore() {
  fallbackMemory.clear();
}

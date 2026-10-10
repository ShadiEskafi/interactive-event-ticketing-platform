/**
 * Offline Storage Engine for Gate Scanner (IndexedDB)
 * Manages local ticket cache and offline scan queue for background sync.
 */

const DB_NAME = 'TicketCraftGateDB';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cached_tickets')) {
          db.createObjectStore('cached_tickets', { keyPath: 'ticket_code' });
        }
        if (!db.objectStoreNames.contains('offline_sync_queue')) {
          db.createObjectStore('offline_sync_queue', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('scan_history')) {
          db.createObjectStore('scan_history', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('IndexedDB failed to open, using memory fallback:', request.error);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB open error:', e);
      resolve(null);
    }
  });

  return dbPromise;
}

// In-memory fallbacks if IndexedDB is unavailable (e.g. testing or private browsing)
const memoryCache = {
  tickets: new Map(),
  syncQueue: [],
  history: [],
};

export const offlineStorage = {
  /**
   * Caches ticket records locally for offline verification
   */
  async cacheTickets(tickets = []) {
    const db = await openDB();
    if (!db) {
      tickets.forEach((t) => memoryCache.tickets.set(t.ticket_code, t));
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('cached_tickets', 'readwrite');
        const store = tx.objectStore('cached_tickets');
        tickets.forEach((t) => store.put(t));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Retrieves a cached ticket by code or id
   */
  async getCachedTicket(ticketCode) {
    const db = await openDB();
    if (!db) {
      const direct = memoryCache.tickets.get(ticketCode);
      if (direct) return direct;
      return (
        Array.from(memoryCache.tickets.values()).find(
          (t) => t.ticket_code === ticketCode || t.id === ticketCode
        ) || null
      );
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('cached_tickets', 'readonly');
        const store = tx.objectStore('cached_tickets');
        const req = store.get(ticketCode);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result);
          } else {
            const allReq = store.getAll();
            allReq.onsuccess = () => {
              const match = (allReq.result || []).find(
                (t) => t.ticket_code === ticketCode || t.id === ticketCode
              );
              resolve(match || null);
            };
            allReq.onerror = () => resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  },

  /**
   * Updates cached ticket status locally
   */
  async updateCachedTicket(ticket) {
    const db = await openDB();
    if (!db) {
      memoryCache.tickets.set(ticket.ticket_code, ticket);
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('cached_tickets', 'readwrite');
        const store = tx.objectStore('cached_tickets');
        store.put(ticket);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  /**
   * Adds an offline scan attempt to the sync queue
   */
  async enqueueOfflineScan(scanRecord) {
    const db = await openDB();
    if (!db) {
      memoryCache.syncQueue.push({ ...scanRecord, id: Date.now() + Math.random() });
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction('offline_sync_queue', 'readwrite');
        const store = tx.objectStore('offline_sync_queue');
        const req = store.add({
          ...scanRecord,
          enqueued_at: new Date().toISOString(),
        });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Retrieves all pending scans in queue
   */
  async getPendingScans() {
    const db = await openDB();
    if (!db) {
      return [...memoryCache.syncQueue];
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('offline_sync_queue', 'readonly');
        const store = tx.objectStore('offline_sync_queue');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  },

  /**
   * Removes processed items from sync queue
   */
  async clearSyncedScans(ids = []) {
    const db = await openDB();
    if (!db) {
      memoryCache.syncQueue = memoryCache.syncQueue.filter((item) => !ids.includes(item.id));
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('offline_sync_queue', 'readwrite');
        const store = tx.objectStore('offline_sync_queue');
        ids.forEach((id) => store.delete(id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  /**
   * Saves scan log to local session history
   */
  async logScan(scanEntry) {
    const db = await openDB();
    if (!db) {
      memoryCache.history.unshift(scanEntry);
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('scan_history', 'readwrite');
        const store = tx.objectStore('scan_history');
        store.add({
          ...scanEntry,
          timestamp: new Date().toISOString(),
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },

  /**
   * Gets recent scans
   */
  async getScanHistory(limit = 20) {
    const db = await openDB();
    if (!db) {
      return memoryCache.history.slice(0, limit);
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('scan_history', 'readonly');
        const store = tx.objectStore('scan_history');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result || []).reverse().slice(0, limit);
          resolve(list);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  },

  /**
   * Clears all local caches and queues (useful for testing or session reset)
   */
  async clearAll() {
    memoryCache.tickets.clear();
    memoryCache.syncQueue = [];
    memoryCache.history = [];
    const db = await openDB();
    if (db) {
      try {
        const tx = db.transaction(['cached_tickets', 'offline_sync_queue', 'scan_history'], 'readwrite');
        tx.objectStore('cached_tickets').clear();
        tx.objectStore('offline_sync_queue').clear();
        tx.objectStore('scan_history').clear();
      } catch {
        // ignore
      }
    }
  },
};

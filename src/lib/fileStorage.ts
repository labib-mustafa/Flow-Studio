import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const rehydrateCallbacks = new Map<string, Set<() => void>>();
const lastClientWriteTimestamps = new Map<string, number>();

// Registry of pending debounced writes across stores
interface PendingWrite {
  value: string;
  timer: ReturnType<typeof setTimeout> | null;
  flush: () => void;
}
const pendingWrites = new Map<string, PendingWrite>();

/**
 * Register a listener to be called when an external process modifies the store on disk/API.
 */
export function onStoreExternalUpdate(storeName: string, callback: () => void) {
  if (!rehydrateCallbacks.has(storeName)) {
    rehydrateCallbacks.set(storeName, new Set());
  }
  rehydrateCallbacks.get(storeName)!.add(callback);
  return () => {
    rehydrateCallbacks.get(storeName)?.delete(callback);
  };
}

/**
 * Immediately flushes any pending debounced writes to the backend.
 */
export function flushPendingStoreWrites(targetStore?: string) {
  if (targetStore) {
    const item = pendingWrites.get(targetStore);
    if (item) {
      if (item.timer) clearTimeout(item.timer);
      item.flush();
      pendingWrites.delete(targetStore);
    }
  } else {
    for (const [storeName, item] of pendingWrites.entries()) {
      if (item.timer) clearTimeout(item.timer);
      item.flush();
    }
    pendingWrites.clear();
  }
}

// Flush pending writes on page unload or when user switches away/backgrounds app
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingStoreWrites();
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingStoreWrites();
    }
  });
}

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function initRealtimeSync() {
  if (typeof window === 'undefined') return;
  if (eventSource) return;

  try {
    eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'store_updated' && data.store) {
          // Echo suppression: Ignore update events if THIS client initiated a write within the last 2.5 seconds
          const lastWrite = lastClientWriteTimestamps.get(data.store) || 0;
          if (Date.now() - lastWrite < 2500) {
            return;
          }

          const cbs = rehydrateCallbacks.get(data.store);
          if (cbs && cbs.size > 0) {
            cbs.forEach((cb) => {
              try {
                cb();
              } catch (e) {
                console.error(`[FileStorage] Rehydrate error for ${data.store}:`, e);
              }
            });
          }
        }
      } catch {
        // Ignore non-json or ping messages
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          initRealtimeSync();
        }, 2000);
      }
    };
  } catch (e) {
    console.warn('[FileStorage] Failed to initialize SSE stream', e);
  }
}

// Auto-initialize SSE connection in the browser
if (typeof window !== 'undefined') {
  initRealtimeSync();
}

/**
 * Creates a file-based storage adapter for Zustand's persist middleware.
 * Routes reads/writes through the Express backend API with immediate localStorage fallback.
 * Writes are debounced to prevent excessive disk I/O, with beforeunload emergency flushing.
 */
function createFileStorageEngine(storeName: string, debounceMs: number = 300): StateStorage {
  const localBackupKey = `flow_backup_${storeName}`;

  const sendWrite = (value: string) => {
    lastClientWriteTimestamps.set(storeName, Date.now());
    fetch(`/api/store/${storeName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: value,
      keepalive: true,
    }).catch(() => {
      console.warn(`[FileStorage] Failed to write ${storeName} to API`);
    });
  };

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const res = await fetch(`/api/store/${storeName}`);
        if (res.ok) {
          const data = await res.text();
          if (data && data !== 'null' && data.trim() !== '') {
            try {
              localStorage.setItem(localBackupKey, data);
            } catch {}
            return data;
          }
        }
      } catch (e) {
        console.warn(`[FileStorage] Failed to read ${storeName} from API, falling back to local cache`, e);
      }

      // Offline or API failure fallback
      try {
        const cached = localStorage.getItem(localBackupKey);
        if (cached && cached !== 'null') {
          return cached;
        }
      } catch {}

      return null;
    },

    setItem: (key: string, value: string): void => {
      // 1. Immediately mirror to synchronous localStorage
      try {
        localStorage.setItem(localBackupKey, value);
      } catch {}

      // 2. Mark this client's active write timestamp for echo suppression
      lastClientWriteTimestamps.set(storeName, Date.now());

      // 3. Clear any active debounce timer for this store
      const existing = pendingWrites.get(storeName);
      if (existing?.timer) {
        clearTimeout(existing.timer);
      }

      // 4. Setup flush function and debounced timer
      const flush = () => {
        sendWrite(value);
      };

      const timer = setTimeout(() => {
        pendingWrites.delete(storeName);
        flush();
      }, debounceMs);

      pendingWrites.set(storeName, { value, timer, flush });
    },

    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(localBackupKey);
      } catch {}
      const existing = pendingWrites.get(storeName);
      if (existing?.timer) clearTimeout(existing.timer);
      pendingWrites.delete(storeName);
      fetch(`/api/store/${storeName}`, { method: 'DELETE', keepalive: true }).catch(() => {});
    },
  };
}

/**
 * Factory function for creating file-based storage for Zustand stores.
 */
export function createFileStorage(storeName: string, debounceMs: number = 300) {
  initRealtimeSync();
  return createJSONStorage(() => createFileStorageEngine(storeName, debounceMs));
}


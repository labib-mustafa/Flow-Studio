import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const rehydrateCallbacks = new Map<string, Set<() => void>>();

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
 * Routes reads/writes through the Express backend API.
 * Writes are debounced to prevent excessive disk I/O during rapid state changes.
 */
function createFileStorageEngine(storeName: string, debounceMs: number = 300): StateStorage {
  let writeTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const res = await fetch(`/api/store/${storeName}`);
        if (res.ok) {
          const data = await res.text();
          if (data && data !== 'null' && data.trim() !== '') {
            return data;
          }
        }
      } catch (e) {
        console.warn(`[FileStorage] Failed to read ${storeName} from API`, e);
      }
      return null;
    },

    setItem: (key: string, value: string): void => {
      // Debounced write to API
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        fetch(`/api/store/${storeName}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: value,
        }).catch(() => {
          console.warn(`[FileStorage] Failed to write ${storeName} to API`);
        });
      }, debounceMs);
    },

    removeItem: (key: string): void => {
      fetch(`/api/store/${storeName}`, { method: 'DELETE' }).catch(() => {});
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


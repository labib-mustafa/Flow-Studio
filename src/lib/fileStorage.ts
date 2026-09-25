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

export function getActiveWorkspaceId(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem('flow_active_workspace') || 'default';
}

export function setActiveWorkspaceId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('flow_active_workspace', id);
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
          // Ignore updates for other workspaces
          if (data.workspaceId && data.workspaceId !== 'app' && data.workspaceId !== getActiveWorkspaceId()) {
            return;
          }

          // Echo suppression: Ignore update events if THIS client wrote within 2.5s
          const lastWrite = lastClientWriteTimestamps.get(data.store) || 0;
          if (Date.now() - lastWrite < 2500) return;

          const cbs = rehydrateCallbacks.get(data.store);
          if (cbs && cbs.size > 0) {
            cbs.forEach((cb) => {
              try { cb(); } catch (e) {
                console.error(`[FileStorage] Rehydrate error for ${data.store}:`, e);
              }
            });
          }
        }
      } catch {}
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

export function clearPendingStoreWrites() {
  for (const item of pendingWrites.values()) {
    if (item.timer) clearTimeout(item.timer);
  }
  pendingWrites.clear();
}

/**
 * Creates a file-based storage adapter for Zustand's persist middleware.
 * Routes reads/writes through the Express backend API with immediate localStorage fallback.
 * Writes are debounced to prevent excessive disk I/O, with beforeunload emergency flushing.
 */
function createFileStorageEngine(storeName: string, debounceMs: number = 300): StateStorage {
  const isAppLevel = ['settings', 'notifications', 'dev', 'workspaces'].includes(storeName);
  const getWs = () => (isAppLevel ? 'app' : getActiveWorkspaceId());
  const getBackupKey = (ws: string) => `flow_backup_${storeName}_${ws}`;

  const sendWrite = (value: string, targetWs: string) => {
    lastClientWriteTimestamps.set(`${targetWs}:${storeName}`, Date.now());
    lastClientWriteTimestamps.set(storeName, Date.now());
    fetch(`/api/store/${storeName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-workspace-id': targetWs },
      body: value,
      keepalive: true,
    }).catch(() => {
      console.warn(`[FileStorage] Failed to write ${storeName} to API`);
    });
  };

  return {
    getItem: async (key: string): Promise<string | null> => {
      const ws = getWs();
      const backupKey = getBackupKey(ws);
      try {
        const res = await fetch(`/api/store/${storeName}`, {
          headers: { 'x-workspace-id': ws },
        });
        if (res.ok) {
          const data = await res.text();
          if (data && data !== 'null' && data.trim() !== '') {
            try {
              localStorage.setItem(backupKey, data);
            } catch {}
            return data;
          }
        }
      } catch (e) {
        console.warn(`[FileStorage] Failed to read ${storeName} from API, falling back to local cache`, e);
      }

      // Offline or API failure fallback
      try {
        const cached = localStorage.getItem(backupKey);
        if (cached && cached !== 'null') {
          return cached;
        }
      } catch {}

      return null;
    },

    setItem: (key: string, value: string): void => {
      const activeWs = getWs();
      // 1. Immediately mirror to synchronous localStorage
      try {
        localStorage.setItem(getBackupKey(activeWs), value);
      } catch {}

      lastClientWriteTimestamps.set(`${activeWs}:${storeName}`, Date.now());
      lastClientWriteTimestamps.set(storeName, Date.now());

      const existing = pendingWrites.get(storeName);
      if (existing?.timer) {
        clearTimeout(existing.timer);
      }

      const flush = () => {
        sendWrite(value, activeWs);
      };

      const timer = setTimeout(() => {
        pendingWrites.delete(storeName);
        flush();
      }, debounceMs);

      pendingWrites.set(storeName, { value, timer, flush });
    },

    removeItem: (key: string): void => {
      const ws = getWs();
      try {
        localStorage.removeItem(getBackupKey(ws));
      } catch {}
      const existing = pendingWrites.get(storeName);
      if (existing?.timer) clearTimeout(existing.timer);
      pendingWrites.delete(storeName);
      fetch(`/api/store/${storeName}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': ws },
        keepalive: true
      }).catch(() => {});
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


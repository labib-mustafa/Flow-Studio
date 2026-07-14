import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Creates a file-based storage adapter for Zustand's persist middleware.
 * Routes reads/writes through the Express backend API, with localStorage as fallback.
 * Writes are debounced to prevent excessive disk I/O during rapid state changes.
 */
function createFileStorageEngine(storeName: string): StateStorage {
  let writeTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        const res = await fetch(`/api/store/${storeName}`);
        if (res.ok) {
          const data = await res.text();
          if (data && data !== 'null' && data.trim() !== '') {
            // Sync successful API data to localStorage as backup
            try { localStorage.setItem(key, data); } catch {}
            return data;
          }
        }
      } catch {
        // API unavailable — fall through to localStorage
      }
      // Fallback to localStorage
      return localStorage.getItem(key);
    },

    setItem: (key: string, value: string): void => {
      // Always write to localStorage immediately as backup
      try { localStorage.setItem(key, value); } catch {}

      // Debounced write to API
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        fetch(`/api/store/${storeName}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: value,
        }).catch(() => {
          // Silently fail — localStorage backup is already in place
          console.warn(`[FileStorage] Failed to write ${storeName} to API`);
        });
      }, 300);
    },

    removeItem: (key: string): void => {
      try { localStorage.removeItem(key); } catch {}
      fetch(`/api/store/${storeName}`, { method: 'DELETE' }).catch(() => {});
    },
  };
}

/**
 * Factory function for creating file-based storage for Zustand stores.
 * 
 * Usage in a store:
 * ```ts
 * import { createFileStorage } from '../lib/fileStorage';
 * 
 * export const useMyStore = create<MyState>()(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: 'my-persist-key',
 *       storage: createFileStorage('mystore'),
 *     }
 *   )
 * );
 * ```
 * 
 * @param storeName - The store identifier used in the API path (e.g., 'clients', 'leads')
 */
export function createFileStorage(storeName: string) {
  return createJSONStorage(() => createFileStorageEngine(storeName));
}

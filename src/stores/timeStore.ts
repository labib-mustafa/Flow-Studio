import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';

export interface TimeEntry {
  id: string;
  projectId: string;
  projectTitle: string;
  taskTitle: string;
  startTime: number;
  endTime: number | null;
  durationSeconds: number; // For manual entries or completed timers
}

export interface ActiveTimer {
  projectId: string;
  projectTitle: string;
  taskTitle: string;
  startTime: number;
}

interface TimeState {
  entries: TimeEntry[];
  activeTimer: ActiveTimer | null;
  _hasHydrated: boolean;
  setHydrated: (state: boolean) => void;
  
  startTimer: (projectId: string, projectTitle: string, taskTitle: string) => void;
  stopTimer: () => void;
  addManualEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  deleteEntry: (id: string) => void;
}

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      entries: [],
      activeTimer: null,
      _hasHydrated: false,
      setHydrated: (state) => set({ _hasHydrated: state }),

      startTimer: (projectId, projectTitle, taskTitle) => {
        const { activeTimer, stopTimer } = get();
        if (activeTimer) {
          stopTimer();
        }
        set({
          activeTimer: {
            projectId,
            projectTitle,
            taskTitle,
            startTime: Date.now()
          }
        });
      },

      stopTimer: () => {
        const { activeTimer, entries } = get();
        if (!activeTimer) return;

        const endTime = Date.now();
        const durationSeconds = Math.floor((endTime - activeTimer.startTime) / 1000);

        const newEntry: TimeEntry = {
          id: `time_${Math.random().toString(36).substr(2, 9)}`,
          ...activeTimer,
          endTime,
          durationSeconds
        };

        set({
          activeTimer: null,
          entries: [newEntry, ...entries].sort((a, b) => b.startTime - a.startTime)
        });
      },

      addManualEntry: (entry) => {
        set((state) => ({
          entries: [
            { id: `time_${Math.random().toString(36).substr(2, 9)}`, ...entry },
            ...state.entries
          ].sort((a, b) => b.startTime - a.startTime)
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id)
        }));
      }
    }),
    {
      name: 'flowstudio-time-storage',
      storage: createFileStorage('time'),
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          entries: Array.isArray(persistedState.entries) ? persistedState.entries : currentState.entries,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated(true);
      }
    }
  )
);


onStoreExternalUpdate('time', () => {
  useTimeStore.persist.rehydrate();
});

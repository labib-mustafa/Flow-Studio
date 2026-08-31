import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';

export interface DevFlags {
  showHiddenButtons: boolean;
  forceShowTooltips: boolean;
  showComponentBorders: boolean;
  enableExperimentalFeatures: boolean;
  disableLogin: boolean;
}

export interface DevHiddenItem {
  id: string;
  name: string;
  category: string;
  isForced: boolean;
}

interface DevState {
  isDeveloperModeEnabled: boolean; // Master toggle or legacy trigger
  flags: DevFlags;
  searchFilter: string;
  hiddenItemsRegistry: Record<string, DevHiddenItem[]>;
  _hasHydrated: boolean;
}

interface DevActions {
  toggleDeveloperMode: () => void;
  toggleFlag: (flagName: keyof DevFlags) => void;
  setSearchFilter: (filter: string) => void;
  registerHiddenItem: (category: string, item: Omit<DevHiddenItem, 'category' | 'isForced'>) => void;
  toggleHiddenItemForce: (category: string, itemId: string) => void;
  setHydrated: (state: boolean) => void;
}

export type DevStore = DevState & DevActions;

const syncBodyClasses = (flags: DevFlags) => {
  if (typeof document === 'undefined') return;
  (Object.keys(flags) as Array<keyof DevFlags>).forEach(flagName => {
    const clsName = `dev-${flagName.toLowerCase()}-enabled`;
    if (flags[flagName]) {
      document.body.classList.add(clsName);
    } else {
      document.body.classList.remove(clsName);
    }
  });
};

export const useDevStore = create<DevStore>()(
  persist(
    (set) => ({
      isDeveloperModeEnabled: false,
      flags: {
        showHiddenButtons: false,
        forceShowTooltips: false,
        showComponentBorders: false,
        enableExperimentalFeatures: false,
        disableLogin: true,
      },
      searchFilter: '',
      hiddenItemsRegistry: {
        'UI Components': [],
        'Moodboard Engine': [],
        'Leads Pipeline': [],
        'State Inspectors': []
      },
      _hasHydrated: false,
      setHydrated: (state) => set({ _hasHydrated: state }),
      
      toggleDeveloperMode: () => set((state) => {
        const nextState = !state.isDeveloperModeEnabled;
        
        const nextFlags = {
          showHiddenButtons: nextState,
          forceShowTooltips: nextState,
          showComponentBorders: nextState,
          enableExperimentalFeatures: nextState,
          disableLogin: state.flags.disableLogin,
        };

        syncBodyClasses(nextFlags);
        
        return { 
          isDeveloperModeEnabled: nextState,
          flags: nextFlags
        };
      }),

      toggleFlag: (flagName) => set((state) => {
        const nextValue = !state.flags[flagName];
        const nextFlags = {
          ...state.flags,
          [flagName]: nextValue
        };
        
        syncBodyClasses(nextFlags);
        
        return {
          flags: nextFlags
        };
      }),

      setSearchFilter: (searchFilter) => set({ searchFilter }),

      registerHiddenItem: (category, item) => set((state) => {
        const currentCategory = state.hiddenItemsRegistry[category] || [];
        if (currentCategory.some(i => i.id === item.id)) return state;
        
        return {
          hiddenItemsRegistry: {
            ...state.hiddenItemsRegistry,
            [category]: [...currentCategory, { ...item, category, isForced: false }]
          }
        };
      }),

      toggleHiddenItemForce: (category, itemId) => set((state) => {
        const currentCategory = state.hiddenItemsRegistry[category] || [];
        return {
          hiddenItemsRegistry: {
            ...state.hiddenItemsRegistry,
            [category]: currentCategory.map(item => 
              item.id === itemId ? { ...item, isForced: !item.isForced } : item
            )
          }
        };
      })
    }),
    {
      name: 'flowstudio-dev-storage',
      storage: createFileStorage('dev'),
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          flags: persistedState.flags ? { ...currentState.flags, ...persistedState.flags } : currentState.flags,
          hiddenItemsRegistry: persistedState.hiddenItemsRegistry || currentState.hiddenItemsRegistry,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          if (state.flags) {
            syncBodyClasses(state.flags);
          }
        }
      },
    }
  )
);


onStoreExternalUpdate('dev', () => {
  useDevStore.persist.rehydrate();
});

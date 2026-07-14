import { create } from 'zustand';

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
}

interface DevActions {
  toggleDeveloperMode: () => void;
  toggleFlag: (flagName: keyof DevFlags) => void;
  setSearchFilter: (filter: string) => void;
  registerHiddenItem: (category: string, item: Omit<DevHiddenItem, 'category' | 'isForced'>) => void;
  toggleHiddenItemForce: (category: string, itemId: string) => void;
}

export type DevStore = DevState & DevActions;

export const useDevStore = create<DevStore>((set) => ({
  isDeveloperModeEnabled: false,
  flags: {
    showHiddenButtons: false,
    forceShowTooltips: false,
    showComponentBorders: false,
    enableExperimentalFeatures: false,
    disableLogin: false,
  },
  searchFilter: '',
  hiddenItemsRegistry: {
    'UI Components': [],
    'Moodboard Engine': [],
    'Leads Pipeline': [],
    'State Inspectors': []
  },
  
  toggleDeveloperMode: () => set((state) => {
    const nextState = !state.isDeveloperModeEnabled;
    
    const nextFlags = {
      showHiddenButtons: nextState,
      forceShowTooltips: nextState,
      showComponentBorders: nextState,
      enableExperimentalFeatures: nextState,
      disableLogin: state.flags.disableLogin, // keep current state or set to nextState? Usually dev mode toggles everything, but disableLogin is dangerous. Let's keep it as is.
    };

    if (nextState) {
      document.body.classList.add('dev-showhiddenbuttons-enabled');
      document.body.classList.add('dev-forceshowtooltips-enabled');
      document.body.classList.add('dev-showcomponentborders-enabled');
    } else {
      document.body.classList.remove('dev-showhiddenbuttons-enabled');
      document.body.classList.remove('dev-forceshowtooltips-enabled');
      document.body.classList.remove('dev-showcomponentborders-enabled');
    }
    
    return { 
      isDeveloperModeEnabled: nextState,
      flags: nextFlags
    };
  }),

  toggleFlag: (flagName) => set((state) => {
    const nextValue = !state.flags[flagName];
    
    // Manage dynamic global body classes for specific developer modes
    const clsName = `dev-${flagName.toLowerCase()}-enabled`;
    if (nextValue) {
      document.body.classList.add(clsName);
    } else {
      document.body.classList.remove(clsName);
    }
    
    return {
      flags: {
        ...state.flags,
        [flagName]: nextValue
      }
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
}));

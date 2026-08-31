import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
  id: string;
  title: string;
  path: string;
  icon?: string;
}

export interface TabSession {
  tabs: Tab[];
  activeTabId: string;
}

interface ExplorerTabState {
  sessions: Record<string, TabSession>;
  
  // Actions
  addTab: (sessionId: string, initialPath?: string) => void;
  removeTab: (sessionId: string, tabId: string) => void;
  setActiveTab: (sessionId: string, tabId: string) => void;
  updateTabPath: (sessionId: string, tabId: string, path: string, title: string) => void;
  ensureSession: (sessionId: string, defaultPath?: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useExplorerTabStore = create<ExplorerTabState>()(
  persist(
    (set, get) => ({
      sessions: {},

      ensureSession: (sessionId, defaultPath = '') => {
        const { sessions } = get();
        if (!sessions[sessionId] || sessions[sessionId].tabs.length === 0) {
          const newTabId = generateId();
          set({
            sessions: {
              ...sessions,
              [sessionId]: {
                tabs: [{ id: newTabId, title: 'Home', path: defaultPath }],
                activeTabId: newTabId
              }
            }
          });
        }
      },

      addTab: (sessionId, initialPath = '') => {
        const newTabId = generateId();
        set((state) => {
          const session = state.sessions[sessionId] || { tabs: [], activeTabId: '' };
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                tabs: [...session.tabs, { id: newTabId, title: 'Home', path: initialPath }],
                activeTabId: newTabId
              }
            }
          };
        });
      },

      removeTab: (sessionId, tabId) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const newTabs = session.tabs.filter((t) => t.id !== tabId);
          if (newTabs.length === 0) return state; // Prevent closing last tab

          let newActiveId = session.activeTabId;
          if (newActiveId === tabId) {
            // Find adjacent tab to activate
            const oldIndex = session.tabs.findIndex((t) => t.id === tabId);
            const nextTab = newTabs[oldIndex] || newTabs[oldIndex - 1];
            newActiveId = nextTab.id;
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                tabs: newTabs,
                activeTabId: newActiveId
              }
            }
          };
        });
      },

      setActiveTab: (sessionId, tabId) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                activeTabId: tabId
              }
            }
          };
        });
      },

      updateTabPath: (sessionId, tabId, path, title) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const newTabs = session.tabs.map((t) => 
            t.id === tabId ? { ...t, path, title } : t
          );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                tabs: newTabs
              }
            }
          };
        });
      }
    }),
    {
      name: 'flow-explorer-tabs'
    }
  )
);

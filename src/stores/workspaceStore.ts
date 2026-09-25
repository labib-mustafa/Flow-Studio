import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createFileStorage,
  onStoreExternalUpdate,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  flushPendingStoreWrites,
  clearPendingStoreWrites
} from '../lib/fileStorage';

export interface WorkspaceProfile {
  name: string;
  tagline: string;
  logo: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  currency: string;
  currencySymbol: string;
  website: string;
  workingHours: string;
  timezone: string;
}

export interface WorkspaceMeta {
  id: string;
  name: string;
  tagline?: string;
  logo?: string;
  currency?: string;
  currencySymbol?: string;
  createdAt: string;
}

export const DEFAULT_WORKSPACE_PROFILE: WorkspaceProfile = {
  name: 'Flow Studio',
  tagline: 'Design & Digital Product Studio',
  logo: '/logo.png',
  legalName: '',
  email: '',
  phone: '',
  address: '',
  taxId: '',
  currency: 'USD',
  currencySymbol: '$',
  website: '',
  workingHours: 'Mon - Fri, 9:00 AM - 6:00 PM',
  timezone: 'auto'
};

export const DEFAULT_WORKSPACES: WorkspaceMeta[] = [
  {
    id: 'default',
    name: 'Flow Studio',
    tagline: 'Design & Digital Product Studio',
    logo: '/logo.png',
    currency: 'USD',
    currencySymbol: '$',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

interface WorkspaceRegistryState {
  workspaces: WorkspaceMeta[];
  activeWorkspaceId: string;
  _hasHydrated: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (meta: { name: string; tagline?: string; logo?: string; currency?: string; currencySymbol?: string }) => Promise<string>;
  updateWorkspaceMeta: (id: string, updates: Partial<WorkspaceMeta>) => void;
  deleteWorkspace: (id: string) => void;
}

// Global registry of all user workspaces (persists to global workspaces.json)
export const useWorkspaceRegistry = create<WorkspaceRegistryState>()(
  persist(
    (set, get) => ({
      workspaces: DEFAULT_WORKSPACES,
      activeWorkspaceId: getActiveWorkspaceId(),
      _hasHydrated: false,
      switchWorkspace: (id: string) => {
        if (!id || id === getActiveWorkspaceId()) return;
        flushPendingStoreWrites();
        clearPendingStoreWrites();
        setActiveWorkspaceId(id);
        set({ activeWorkspaceId: id });
        window.location.reload();
      },
      createWorkspace: async (meta) => {
        flushPendingStoreWrites();
        clearPendingStoreWrites();
        const id = `ws-${Date.now()}`;
        const newMeta: WorkspaceMeta = {
          id,
          name: meta.name.trim() || 'Untitled Workspace',
          tagline: meta.tagline?.trim() || '',
          logo: meta.logo || '',
          currency: meta.currency || 'USD',
          currencySymbol: meta.currencySymbol || '$',
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          workspaces: [...state.workspaces, newMeta]
        }));

        // Seed initial workspace profile in the new workspace directory
        const initialProfile: WorkspaceProfile = {
          ...DEFAULT_WORKSPACE_PROFILE,
          name: newMeta.name,
          tagline: newMeta.tagline || '',
          logo: newMeta.logo || '',
          currency: newMeta.currency || 'USD',
          currencySymbol: newMeta.currencySymbol || '$'
        };

        try {
          await fetch('/api/store/workspace', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-workspace-id': id
            },
            body: JSON.stringify({ state: { ...initialProfile, _hasHydrated: true }, version: 0 })
          });
        } catch (e) {
          console.warn('[Workspace] Failed to seed initial profile:', e);
        }

        // Switch to the newly created workspace
        setActiveWorkspaceId(id);
        set({ activeWorkspaceId: id });
        window.location.reload();
        return id;
      },
      updateWorkspaceMeta: (id, updates) => {
        set((state) => ({
          workspaces: state.workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w))
        }));
      },
      deleteWorkspace: (id: string) => {
        if (id === 'default') return;
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id)
        }));
        if (getActiveWorkspaceId() === id) {
          setActiveWorkspaceId('default');
          window.location.reload();
        }
      }
    }),
    {
      name: 'workspace-registry-storage',
      storage: createFileStorage('workspaces', 1500),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      }
    }
  )
);

onStoreExternalUpdate('workspaces', () => {
  useWorkspaceRegistry.persist.rehydrate();
});

// Workspace-specific profile store (persists to workspaces/<id>/workspace.json)
interface WorkspaceProfileState extends WorkspaceProfile {
  _hasHydrated: boolean;
  updateWorkspace: (updates: Partial<WorkspaceProfile>) => void;
  resetWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceProfileState>()(
  persist(
    (set) => ({
      ...DEFAULT_WORKSPACE_PROFILE,
      _hasHydrated: false,
      updateWorkspace: (updates) => {
        set((state) => {
          const next = { ...state, ...updates };
          const activeId = getActiveWorkspaceId();
          useWorkspaceRegistry.getState().updateWorkspaceMeta(activeId, {
            name: next.name,
            tagline: next.tagline,
            logo: next.logo,
            currency: next.currency,
            currencySymbol: next.currencySymbol
          });
          return next;
        });
      },
      resetWorkspace: () => set(() => ({ ...DEFAULT_WORKSPACE_PROFILE, _hasHydrated: true }))
    }),
    {
      name: 'workspace-storage',
      storage: createFileStorage('workspace', 1500),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      }
    }
  )
);

onStoreExternalUpdate('workspace', () => {
  useWorkspaceStore.persist.rehydrate();
});

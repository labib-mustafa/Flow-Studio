import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';

export type TrashItemType = 'lead' | 'client' | 'project' | 'task' | 'team-member';

export interface TrashItem {
  id: string;
  originalId: string;
  type: TrashItemType;
  name: string;
  data: any;
  deletedAt: string;
}

export interface TrashState {
  trashItems: TrashItem[];
  moveToTrash: (type: TrashItemType, originalId: string, name: string, data: any) => void;
  restoreItem: (trashId: string) => void;
  permanentlyDeleteItem: (trashId: string) => void;
  emptyTrash: () => void;
  cleanupExpiredItems: (retentionDays: number) => void;
  _hasHydrated: boolean;
  setHydrated: (state: boolean) => void;
}

export const useTrashStore = create<TrashState>()(
  persist(
    (set, get) => ({
      trashItems: [],
      _hasHydrated: false,
      setHydrated: (state) => set({ _hasHydrated: state }),
      
      moveToTrash: (type, originalId, name, data) => {
        const newItem: TrashItem = {
          id: `trash_${Math.random().toString(36).substring(2, 9)}`,
          originalId,
          type,
          name,
          data,
          deletedAt: new Date().toISOString()
        };
        set(state => ({ trashItems: [newItem, ...(state.trashItems || [])] }));
      },

      restoreItem: async (trashId) => {
        const state = get();
        const item = state.trashItems.find(i => i.id === trashId);
        if (!item) return;

        // Restore to corresponding store
        switch (item.type) {
          case 'lead': {
            const { useLeadStore } = await import('./leadStore');
            useLeadStore.setState((s) => ({ leads: [item.data, ...(s.leads || [])] }));
            break;
          }
          case 'client': {
            const { useClientStore } = await import('./clientStore');
            useClientStore.setState((s) => ({ clients: [item.data, ...(s.clients || [])] }));
            break;
          }
          case 'project': {
            const { useProjectStore } = await import('./projectStore');
            useProjectStore.setState((s) => ({ projects: [item.data, ...(s.projects || [])] }));
            break;
          }
          case 'task': {
            const { useTaskStore } = await import('./taskStore');
            useTaskStore.setState((s) => ({ tasks: [item.data, ...(s.tasks || [])] }));
            break;
          }
          case 'team-member': {
            const { useTeamStore } = await import('./teamStore');
            useTeamStore.setState((s) => ({ members: [item.data, ...(s.members || [])] }));
            break;
          }
        }

        // Remove from trash
        set(state => ({ trashItems: state.trashItems.filter(i => i.id !== trashId) }));
      },

      permanentlyDeleteItem: (trashId) => {
        set(state => ({ trashItems: state.trashItems.filter(i => i.id !== trashId) }));
      },

      emptyTrash: () => {
        set({ trashItems: [] });
      },

      cleanupExpiredItems: (retentionDays: number) => {
        if (retentionDays <= 0) return; // 0 = Never auto-delete
        
        const now = Date.now();
        const msInDay = 24 * 60 * 60 * 1000;
        
        set(state => ({
          trashItems: (state.trashItems || []).filter(item => {
            const deletedTime = new Date(item.deletedAt).getTime();
            const daysSinceDeletion = (now - deletedTime) / msInDay;
            return daysSinceDeletion <= retentionDays;
          })
        }));
      }
    }),
    {
      name: 'flowstudio-trash-storage',
      storage: createFileStorage('trash'),
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        return {
          ...currentState,
          ...persistedState,
          trashItems: Array.isArray(persistedState.trashItems) ? persistedState.trashItems : [],
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);


onStoreExternalUpdate('trash', () => {
  useTrashStore.persist.rehydrate();
});

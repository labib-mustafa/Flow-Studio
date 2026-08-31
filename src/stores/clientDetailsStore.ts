import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';

export interface Expert {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  online?: boolean;
  invited?: boolean;
  inviteDate?: string;
}

export interface PinnedAsset {
  id: string;
  name: string;
  type: 'pdf' | 'zip' | 'doc';
  date: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'note' | 'task' | 'comment';
}

interface ClientDetailsState {
  experts: Record<string, { assigned: Expert[]; available: Expert[] }>;
  pinnedAssets: PinnedAsset[];
  activityLogs: ActivityLog[];

  setExperts: (clientId: string, assigned: Expert[]) => void;
  addPinnedAsset: (asset: PinnedAsset) => void;
  removePinnedAsset: (id: string) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;
}

export const useClientDetailsStore = create<ClientDetailsState>()(
  persist(
    (set) => ({
      experts: {},
      pinnedAssets: [],
      activityLogs: [],

      setExperts: (clientId, assigned) =>
        set((state) => ({
          experts: {
            ...state.experts,
            [clientId]: {
              assigned,
              available: state.experts[clientId]?.available || [],
            },
          },
        })),

      addPinnedAsset: (asset) =>
        set((state) => ({
          pinnedAssets: [...state.pinnedAssets, asset],
        })),

      removePinnedAsset: (id) =>
        set((state) => ({
          pinnedAssets: state.pinnedAssets.filter((a) => a.id !== id),
        })),

      addActivityLog: (log) =>
        set((state) => ({
          activityLogs: [
            { ...log, id: `act-${Date.now()}` },
            ...state.activityLogs,
          ].slice(0, 100),
        })),
    }),
    {
      name: 'flowstudio-client-details-storage',
      storage: createFileStorage('clientDetails'),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
      }),
    }
  )
);


onStoreExternalUpdate('clientDetails', () => {
  useClientDetailsStore.persist.rehydrate();
});

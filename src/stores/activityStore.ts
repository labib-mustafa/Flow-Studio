import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';

export type ActivityCategory =
  | 'email_sent'
  | 'email_reply'
  | 'lead_added'
  | 'lead_status_changed'
  | 'lead_promoted'
  | 'lead_deleted'
  | 'task_completed'
  | 'task_created'
  | 'project_created'
  | 'project_updated'
  | 'invoice_created'
  | 'client_added'
  | 'file_uploaded'
  | 'general';

export interface ActivityEvent {
  id: string;
  timestamp: string; // ISO String (e.g., '2026-07-03T15:20:12Z')
  type: 'task' | 'project' | 'invoice' | 'client' | 'lead' | 'file' | 'email';
  category?: ActivityCategory;
  description: string;
  actorName?: string;    // Who performed the action (user name or email)
  targetId?: string;     // ID of the affected entity (lead, task, project, etc.)
  targetName?: string;   // Human-readable name of the target
  metadata?: Record<string, any>; // Extra details (e.g., { oldStatus, newStatus, emailUsed, recipientEmail })
}

interface ActivityState {
  activities: ActivityEvent[];
  _hasHydrated: boolean;
  logActivity: (type: ActivityEvent['type'], description: string, extra?: Partial<Pick<ActivityEvent, 'category' | 'actorName' | 'targetId' | 'targetName' | 'metadata'>>) => void;
  getActivityCounts: () => Record<string, number>; // Maps YYYY-MM-DD -> count
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],
      _hasHydrated: false,
      logActivity: (type, description, extra) => set((state) => {
        // Keep only the last 5000 activities to prevent infinite growth
        const newActivities = [
          {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString(),
            type,
            description,
            ...extra,
          },
          ...state.activities,
        ].slice(0, 5000);
        
        return { activities: newActivities };
      }),
      getActivityCounts: () => {
        const counts: Record<string, number> = {};
        get().activities.forEach((act) => {
          const dateStr = act.timestamp.split('T')[0]; // Get YYYY-MM-DD
          counts[dateStr] = (counts[dateStr] || 0) + 1;
        });
        return counts;
      },
    }),
    {
      name: 'activity-storage',
      storage: createFileStorage('activities'),
      onRehydrateStorage: () => () => {
        useActivityStore.setState({ _hasHydrated: true });
      },
    }
  )
);


onStoreExternalUpdate('activities', () => {
  useActivityStore.persist.rehydrate();
});

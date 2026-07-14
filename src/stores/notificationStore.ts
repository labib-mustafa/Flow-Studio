import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage } from '../lib/fileStorage';

export interface NotificationItem {
  id: number | string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  markAllRead: () => void;
  markAsRead: (id: number | string) => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'unread' | 'time'>) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, unread: false })),
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        })),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              id: Date.now(),
              ...notification,
              time: 'Just now',
              unread: true,
            },
            ...state.notifications,
          ],
        })),
    }),
    {
      name: 'flowstudio-notifications-storage',
      storage: createFileStorage('notifications'),
    }
  )
);

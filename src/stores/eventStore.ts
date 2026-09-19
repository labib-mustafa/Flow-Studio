import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage, onStoreExternalUpdate } from '../lib/fileStorage';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'Call' | 'Design' | 'Team Sync' | 'Other';
  participants: string;
  client?: any;
}

interface EventState {
  _hasHydrated: boolean;
  events: CalendarEvent[];
  isEventModalOpen: boolean;
  setEventModalOpen: (open: boolean) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsByDate: (date: string) => CalendarEvent[];
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      events: [],
      isEventModalOpen: false,
      setEventModalOpen: (open) => set({ isEventModalOpen: open }),
      addEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: Math.random().toString(36).substring(2, 9),
        };
        set((state) => ({
          events: [...state.events, newEvent].sort((a, b) => {
             if (a.date === b.date) {
                return a.time.localeCompare(b.time);
             }
             return a.date.localeCompare(b.date);
          }),
        }));
      },
      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((evt) =>
            evt.id === id ? { ...evt, ...updates } : evt
          ).sort((a, b) => {
             if (a.date === b.date) {
                return a.time.localeCompare(b.time);
             }
             return a.date.localeCompare(b.date);
          }),
        }));
      },
      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((evt) => evt.id !== id),
        }));
      },
      getEventsByDate: (date) => {
        return get().events.filter((evt) => evt.date === date);
      },
    }),
    {
      name: 'event-storage',
      storage: createFileStorage('events'),
      onRehydrateStorage: () => () => { useEventStore.setState({ _hasHydrated: true }); },
      partialize: (state) => ({ events: state.events }),
    }
  )
);


onStoreExternalUpdate('events', () => {
  useEventStore.persist.rehydrate();
});

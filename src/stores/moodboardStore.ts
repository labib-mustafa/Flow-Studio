import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFileStorage } from '../lib/fileStorage';
import { MoodboardItemData } from '../components/Projects/ProjectDetails/MoodboardPage/MoodboardItem';

const initialItems: MoodboardItemData[] = [];

interface MoodboardState {
  items: MoodboardItemData[];
  selectedIds: string[];
  view: { zoom: number; pan: { x: number; y: number } };
  history: MoodboardItemData[][];
  historyIndex: number;

  setItems: (items: MoodboardItemData[] | ((prev: MoodboardItemData[]) => MoodboardItemData[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setView: (view: { zoom: number; pan: { x: number; y: number } } | ((prev: { zoom: number; pan: { x: number; y: number } }) => { zoom: number; pan: { x: number; y: number } })) => void;
  
  saveToHistory: (newItems: MoodboardItemData[]) => void;
  undo: () => void;
  redo: () => void;
}

export const useMoodboardStore = create<MoodboardState>()(
  persist(
    (set, get) => ({
      items: initialItems,
      selectedIds: [],
      view: { zoom: 1, pan: { x: -4500, y: -4500 } },
      history: [initialItems],
      historyIndex: 0,

      setItems: (updater) => set((state) => {
        const newItems = typeof updater === 'function' ? updater(state.items) : updater;
        return { items: newItems };
      }),
      setSelectedIds: (updater) => set((state) => {
        const newIds = typeof updater === 'function' ? updater(state.selectedIds) : updater;
        return { selectedIds: newIds };
      }),
      setView: (updater) => set((state) => {
        const newView = typeof updater === 'function' ? updater(state.view) : updater;
        return { view: newView };
      }),

      saveToHistory: (newItems) => set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newItems);
        return { history: newHistory, historyIndex: newHistory.length - 1, items: newItems };
      }),
      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          return { historyIndex: newIndex, items: state.history[newIndex] };
        }
        return state;
      }),
      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          return { historyIndex: newIndex, items: state.history[newIndex] };
        }
        return state;
      })
    }),
    {
      name: 'moodboard-storage',
      storage: createFileStorage('moodboard'),
      // Only persist items and view
      partialize: (state) => ({ items: state.items, view: state.view }),
    }
  )
);

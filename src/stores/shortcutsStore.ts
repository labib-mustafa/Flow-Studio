import { create } from 'zustand';

interface ShortcutsState {
  isOpen: boolean;
  openShortcuts: () => void;
  closeShortcuts: () => void;
  toggleShortcuts: () => void;
}

export const useShortcutsStore = create<ShortcutsState>((set) => ({
  isOpen: false,
  openShortcuts: () => set({ isOpen: true }),
  closeShortcuts: () => set({ isOpen: false }),
  toggleShortcuts: () => set((s) => ({ isOpen: !s.isOpen })),
}));

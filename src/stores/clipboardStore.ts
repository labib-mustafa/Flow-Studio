import { create } from 'zustand';

export interface ClipboardItem {
  path: string;
  type: 'cut' | 'copy';
}

interface ClipboardState {
  clipboard: ClipboardItem | null;
  setClipboard: (item: ClipboardItem | null) => void;
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  clipboard: null,
  setClipboard: (item) => set({ clipboard: item }),
}));

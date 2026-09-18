import { create } from 'zustand';

export interface PromptOptions {
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface PromptState {
  isOpen: boolean;
  options: PromptOptions | null;
  resolver: ((value: string | null) => void) | null;
  openPrompt: (options: PromptOptions) => Promise<string | null>;
  closePrompt: (result: string | null) => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  isOpen: false,
  options: null,
  resolver: null,

  openPrompt: (options) => {
    return new Promise<string | null>((resolve) => {
      set({
        isOpen: true,
        options,
        resolver: resolve,
      });
    });
  },

  closePrompt: (result) => {
    const { resolver } = get();
    if (resolver) resolver(result);
    set({
      isOpen: false,
      options: null,
      resolver: null,
    });
  },
}));

export const prompt = {
  show: (options: PromptOptions) => usePromptStore.getState().openPrompt(options),
};

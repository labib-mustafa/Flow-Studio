import { create } from 'zustand';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'default';

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  delaySeconds?: number;
}

export interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions | null;
  resolver: ((value: boolean) => void) | null;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolver: null,

  openConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        options,
        resolver: resolve,
      });
    });
  },

  closeConfirm: (result) => {
    const { resolver } = get();
    if (resolver) resolver(result);
    set({
      isOpen: false,
      options: null,
      resolver: null,
    });
  },
}));

// Export convenient helper methods: confirm.show(), confirm.danger(), confirm.warning()
export const confirm = {
  show: (options: ConfirmOptions) => useConfirmStore.getState().openConfirm(options),
  danger: (title: string, message: string, options?: Partial<ConfirmOptions>) =>
    useConfirmStore.getState().openConfirm({
      title,
      message,
      type: 'danger',
      confirmText: 'Delete',
      ...options,
    }),
  warning: (title: string, message: string, options?: Partial<ConfirmOptions>) =>
    useConfirmStore.getState().openConfirm({
      title,
      message,
      type: 'warning',
      confirmText: 'Confirm',
      ...options,
    }),
  info: (title: string, message: string, options?: Partial<ConfirmOptions>) =>
    useConfirmStore.getState().openConfirm({
      title,
      message,
      type: 'info',
      confirmText: 'Continue',
      ...options,
    }),
};

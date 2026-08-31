import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'sync';

export interface ToastOptions {
  duration?: number;
  actionText?: string;
  onAction?: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  actionText?: string;
  onAction?: () => void;
  dismissing?: boolean;
}

interface ToastStoreState {
  toasts: ToastItem[];
  maxToasts: number;
  addToast: (type: ToastType, title: string, message: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStoreState>((set, get) => ({
  toasts: [],
  maxToasts: 4,

  addToast: (type, title, message, options = {}) => {
    const id = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const duration = options.duration || 4000;

    const newToast: ToastItem = {
      id,
      type,
      title,
      message,
      duration,
      actionText: options.actionText,
      onAction: options.onAction,
      dismissing: false,
    };

    set((state) => {
      // Prepend newest toast at top of list
      const updated = [newToast, ...state.toasts];
      const activeToasts = updated.filter((t) => !t.dismissing);

      // If active toasts exceed maxToasts (4), mark the oldest (last active item) for dismissal
      if (activeToasts.length > state.maxToasts) {
        const oldest = activeToasts[activeToasts.length - 1];
        if (oldest) {
          setTimeout(() => {
            get().dismissToast(oldest.id);
          }, 80);
        }
      }

      return { toasts: updated };
    });

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, dismissing: true } : t
      ),
    }));

    // Remove from store array after exit animation completes
    setTimeout(() => {
      get().removeToast(id);
    }, 320);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Export convenient global helper methods: toast.success(), toast.error(), etc.
export const toast = {
  show: (type: ToastType, title: string, message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast(type, title, message, options),
  success: (title: string, message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast('success', title, message, options),
  error: (title: string, message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast('error', title, message, options),
  warning: (title: string, message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast('warning', title, message, options),
  info: (title: string, message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast('info', title, message, options),
  sync: (title: string, message: string, options?: ToastOptions) =>
    useToastStore.getState().addToast('sync', title, message, options),
  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
};

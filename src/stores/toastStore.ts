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
  addToast: (type: ToastType, title: string, message?: string, options?: ToastOptions) => string;
  dismissToast: (id: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStoreState>((set, get) => ({
  toasts: [],
  maxToasts: 2,

  addToast: (type, title, message = '', options = {}) => {
    const id = 'toast-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    // Give actionable toasts (like Undo) 5s; errors 4.5s; standard confirmations a quick 2.6s
    const defaultDuration = options.actionText ? 5000 : (type === 'error' ? 4500 : 2600);
    const duration = options.duration || defaultDuration;

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
      const updated = [newToast, ...state.toasts.filter((t) => t.id !== id)];
      // If toasts exceed maxToasts, gracefully evict the oldest
      const trimmed = updated.slice(0, state.maxToasts);
      return { toasts: trimmed };
    });

    // Fallback store-level auto-dismiss timer (duration + 600ms) to ensure toasts never get orphaned
    setTimeout(() => {
      get().dismissToast(id);
    }, duration + 600);

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Export convenient global helper methods: toast.success(), toast.error(), etc.
export const toast = {
  show: (type: ToastType, title: string, message: string = '', options?: ToastOptions) =>
    useToastStore.getState().addToast(type, title, message, options),
  success: (title: string, message: string = '', options?: ToastOptions) =>
    useToastStore.getState().addToast('success', title, message, options),
  error: (title: string, message: string = '', options?: ToastOptions) =>
    useToastStore.getState().addToast('error', title, message, options),
  warning: (title: string, message: string = '', options?: ToastOptions) =>
    useToastStore.getState().addToast('warning', title, message, options),
  info: (title: string, message: string = '', options?: ToastOptions) =>
    useToastStore.getState().addToast('info', title, message, options),
  sync: (title: string, message: string = '', options?: ToastOptions) =>
    useToastStore.getState().addToast('sync', title, message, options),
  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
};

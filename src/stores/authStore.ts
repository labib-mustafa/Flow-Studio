import { create } from 'zustand';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  accessToken: null,
  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoading: (loading) => set({ loading }),
  initialize: () => {
    // Listen for Firebase auth state changes
    onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
  },
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, accessToken: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}));

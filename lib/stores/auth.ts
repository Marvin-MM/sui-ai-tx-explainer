import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  suiAddress: string;
  email?: string | null;
  name?: string | null;
  avatar?: string | null;
  plan: string;
  dailyUsage?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  showAuthModal: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      showAuthModal: false,

      login: (user) => set({ user, showAuthModal: false }),
      
      logout: () => set({ user: null }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setShowAuthModal: (showAuthModal) => set({ showAuthModal }),

      checkSession: async () => {
        try {
          const res = await fetch('/api/auth');
          const data = await res.json();
          if (data.user) {
            set({ user: data.user });
          } else {
            set({ user: null });
          }
        } catch (e) {
          console.error('Session check failed:', e);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

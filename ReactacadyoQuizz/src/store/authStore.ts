import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "../types/User";
import AuthService from "../services/AuthService";

export type Auth = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<Auth>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        const result = await AuthService.login(email, password);
        if (result.success) {
          const user = await AuthService.getCurrentUser();
          set({ user, isAuthenticated: !!user, isLoading: false, error: null });
          return true;
        } else {
          set({ isLoading: false, error: result.message });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await AuthService.logout();
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const user = await AuthService.getCurrentUser();
          set({ user, isAuthenticated: !!user, isLoading: false, error: null });
          return !!user;
        } catch (error) {
          // Ici, ce ne sont que les vraies erreurs (réseau, serveur, etc.)
          console.error('Erreur lors de la vérification de l\'authentification:', error);
          set({ user: null, isAuthenticated: false, isLoading: false, error: 'Erreur de connexion' });
          return false;
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading })
    }),
    {
      name: "auth-user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);

export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
    clearError: store.clearError,
    setLoading: store.setLoading,
    setUser: store.setUser,
    isAdmin: () => store.user?.roles?.includes('ROLE_ADMIN') || false,
    isStudent: () => store.user?.roles?.includes('ROLE_USER') || false,
    hasRole: (role: string) => store.user?.roles?.includes(role) || false,
    getUsername: () => store.user?.name || store.user?.email || '',
    getUserId: () => store.user?.id || null
  };
};
import { create } from 'zustand';
import { storage } from '../lib/storage';
import { queryClient } from '../lib/query-client';
import type { AuthUser, Role } from '../types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (payload: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;

  // Convenience getters
  role: Role | null;
  clubId: string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  get role() {
    return get().user?.role ?? null;
  },
  get clubId() {
    return get().user?.clubId ?? null;
  },

  setAuth: async ({ user, accessToken, refreshToken }) => {
    await Promise.all([
      storage.setAccessToken(accessToken),
      storage.setRefreshToken(refreshToken),
      storage.setAuthUser(user),
    ]);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  clearAuth: async () => {
    await storage.clearAuth();
    queryClient.clear();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const [token, userJson] = await Promise.all([
        storage.getAccessToken(),
        storage.getAuthUser(),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        const refreshToken = await storage.getRefreshToken();
        set({ user, accessToken: token, refreshToken, isAuthenticated: true });
      }
    } catch {
      // corrupted storage — clear it
      await storage.clearAuth();
    } finally {
      set({ isLoading: false });
    }
  },
}));

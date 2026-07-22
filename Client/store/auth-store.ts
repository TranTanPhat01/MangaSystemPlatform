import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AuthResponse } from '@/types/auth';
import { setAuthCookies, removeAuthCookies } from '@/lib/auth';

export const AUTH_STORAGE_KEY = 'manga-auth-storage';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (auth: AuthResponse) => void;
  clearAuthSession: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (auth) => {
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: auth.user,
          isAuthenticated: true,
        });
        // Sync token and roles to cookies for Next.js middleware protection
        setAuthCookies(auth.accessToken, auth.user.roles, auth.expiresAt);
      },
      clearAuthSession: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
        removeAuthCookies();
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
          window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
      },
      logout: () => get().clearAuthSession(),
    }),
    {
      name: AUTH_STORAGE_KEY,
    }
  )
);

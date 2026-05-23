import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AuthResponse } from '@/types/auth';
import { setAuthCookies, removeAuthCookies } from '@/lib/auth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (auth: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
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
      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
        // Clear all cookies
        removeAuthCookies();
      },
    }),
    {
      name: 'manga-auth-storage',
    }
  )
);

import { useCallback, useState } from 'react';
import { authApi } from '@/services/auth-api';
import { useAuthStore } from '@/store/auth-store';

type RedirectToLogin = () => void;

let logoutInFlight: Promise<void> | null = null;

const redirectToLogin = () => {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

/**
 * Revokes the current refresh token when possible, then always clears the
 * client session. The optional redirect is only for deterministic unit tests.
 */
export const logout = (redirect: RedirectToLogin = redirectToLogin): Promise<void> => {
  if (logoutInFlight) {
    return logoutInFlight;
  }

  logoutInFlight = (async () => {
    const { refreshToken, clearAuthSession } = useAuthStore.getState();

    try {
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch {
      // Client cleanup must not depend on network or token-revocation success.
    } finally {
      clearAuthSession();
      redirect();
    }
  })().finally(() => {
    logoutInFlight = null;
  });

  return logoutInFlight;
};

export const useLogoutAction = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    await logout();
  }, [isLoggingOut]);

  return { logout: handleLogout, isLoggingOut };
};

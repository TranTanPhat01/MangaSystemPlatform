import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApiLogout, mockClearAuthSession, getAuthState } = vi.hoisted(() => {
  const state = {
    refreshToken: 'test-refresh-token' as string | null,
    clearAuthSession: vi.fn(),
  };

  return {
    mockApiLogout: vi.fn(),
    mockClearAuthSession: state.clearAuthSession,
    getAuthState: () => state,
  };
});

vi.mock('@/services/auth-api', () => ({
  authApi: {
    logout: mockApiLogout,
  },
}));

vi.mock('@/store/auth-store', () => ({
  useAuthStore: {
    getState: () => ({
      refreshToken: getAuthState().refreshToken,
      clearAuthSession: mockClearAuthSession,
    }),
  },
}));

import { logout } from '@/lib/logout';

describe('auth logout contract and lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthState().refreshToken = 'test-refresh-token';
    mockApiLogout.mockResolvedValue(undefined);
  });

  it('reads the refresh token before clearing the client session', async () => {
    const callOrder: string[] = [];
    mockApiLogout.mockImplementation(async ({ refreshToken }: { refreshToken: string }) => {
      callOrder.push(`api:${refreshToken}`);
      expect(mockClearAuthSession).not.toHaveBeenCalled();
    });
    mockClearAuthSession.mockImplementation(() => callOrder.push('clear'));
    const redirect = vi.fn(() => callOrder.push('redirect'));

    await logout(redirect);

    expect(mockApiLogout).toHaveBeenCalledWith({ refreshToken: 'test-refresh-token' });
    expect(callOrder).toEqual(['api:test-refresh-token', 'clear', 'redirect']);
  });

  it.each([400, 401, 403])('clears the client session after HTTP %i logout failures', async (status) => {
    mockApiLogout.mockRejectedValue({ response: { status } });
    const redirect = vi.fn();

    await expect(logout(redirect)).resolves.toBeUndefined();

    expect(mockClearAuthSession).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
  });

  it('clears the client session after a network logout failure', async () => {
    mockApiLogout.mockRejectedValue(new Error('Network unavailable'));
    const redirect = vi.fn();

    await expect(logout(redirect)).resolves.toBeUndefined();

    expect(mockClearAuthSession).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
  });

  it('does not call the backend when no refresh token exists, but still clears the client', async () => {
    getAuthState().refreshToken = null;
    const redirect = vi.fn();

    await logout(redirect);

    expect(mockApiLogout).not.toHaveBeenCalled();
    expect(mockClearAuthSession).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledOnce();
  });
});

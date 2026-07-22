import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    post: mockPost,
    get: vi.fn(),
  },
}));

import { authApi } from '@/services/auth-api';

describe('auth API logout contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts the required refresh-token request body to the logout endpoint', async () => {
    const response = { data: { success: true, data: 'Logged out successfully' } };
    mockPost.mockResolvedValue(response);

    const result = await authApi.logout({ refreshToken: 'test-refresh-token' });

    expect(mockPost).toHaveBeenCalledWith('/identity/auth/logout', {
      refreshToken: 'test-refresh-token',
    });
    expect(mockPost.mock.calls[0][0]).not.toContain('?');
    expect(result).toBe(response);
  });
});

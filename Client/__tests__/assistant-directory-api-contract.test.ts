import { beforeEach, describe, expect, it, vi } from 'vitest';
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get } }));
import { authApi } from '@/services/auth-api';
describe('assistant directory API contract', () => {
 beforeEach(() => { vi.clearAllMocks(); });
 it('gets the safe assistant directory without admin users route', async () => { const response = { data: { success: true, data: [{ id: 'assistant-1', fullName: 'Aiko', email: 'aiko@example.test' }] } }; get.mockResolvedValue(response); await expect(authApi.getAssistants()).resolves.toBe(response); expect(get).toHaveBeenCalledWith('/identity/users/assistants'); expect(get).not.toHaveBeenCalledWith('/identity/admin/users'); });
 it.each([401, 403])('propagates HTTP %i', async status => { const error = { response: { status } }; get.mockRejectedValue(error); await expect(authApi.getAssistants()).rejects.toBe(error); });
});

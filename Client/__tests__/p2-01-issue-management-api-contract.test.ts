import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, patch } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get, post, patch } }));

import { editorialApi } from '@/services/editorial-api';

describe('P2-01 editorial issue management API contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: { success: true, data: [] } });
    post.mockResolvedValue({ data: { success: true, data: {} } });
    patch.mockResolvedValue({ data: { success: true, data: {} } });
  });

  it('creates, lists, and loads an issue using the BE routes', async () => {
    await editorialApi.createIssue({ issueNumber: '2026-08', title: 'August issue', releaseDate: '2026-08-01T00:00:00.000Z' });
    await editorialApi.getIssues();
    await editorialApi.getIssue('issue-1');

    expect(post).toHaveBeenCalledWith('/editorial/issues', {
      issueNumber: '2026-08',
      title: 'August issue',
      releaseDate: '2026-08-01T00:00:00.000Z',
    });
    expect(get).toHaveBeenNthCalledWith(1, '/editorial/issues');
    expect(get).toHaveBeenNthCalledWith(2, '/editorial/issues/issue-1');
  });

  it('updates issue status with the BE PATCH DTO', async () => {
    await editorialApi.updateIssueStatus('issue-1', { status: 2 });

    expect(patch).toHaveBeenCalledWith('/editorial/issues/issue-1/status', { status: 2 });
  });
});
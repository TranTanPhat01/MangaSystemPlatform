import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { post: mockPost } }));

import { mangaApi } from '@/services/manga-api';

describe('series proposal decision API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: { success: true, data: {} } });
  });

  it('approves a proposal with a decision note', async () => {
    await mangaApi.approveProposal('series-1', { decisionNote: 'Approved for production.' });

    expect(mockPost).toHaveBeenCalledWith('/manga/series/series-1/approve-proposal', {
      decisionNote: 'Approved for production.',
    });
  });

  it('rejects a proposal with a decision note', async () => {
    await mangaApi.rejectProposal('series-1', { decisionNote: 'Needs a stronger chapter outline.' });

    expect(mockPost).toHaveBeenCalledWith('/manga/series/series-1/reject-proposal', {
      decisionNote: 'Needs a stronger chapter outline.',
    });
  });
});

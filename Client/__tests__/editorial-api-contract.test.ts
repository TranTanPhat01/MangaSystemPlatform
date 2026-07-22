import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));

vi.mock('@/lib/api', () => ({ api: { get: mockGet, post: mockPost } }));
vi.mock('@/services/manga-api', () => ({ mangaApi: { getSeries: vi.fn() } }));

import { editorialApi } from '@/services/editorial-api';

describe('editorial review API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { success: true, data: [] } });
    mockPost.mockResolvedValue({ data: { success: true, data: {} } });
  });

  it('loads a review and its comments from their backend endpoints', async () => {
    await editorialApi.getReview('review-1');
    await editorialApi.getReviewComments('review-1');

    expect(mockGet).toHaveBeenNthCalledWith(1, '/editorial/reviews/review-1');
    expect(mockGet).toHaveBeenNthCalledWith(2, '/editorial/reviews/review-1/comments');
  });

  it('posts a server-compatible editorial comment payload', async () => {
    await editorialApi.addReviewComment('review-1', { commentText: 'Please revise panel 2.', pageId: 'page-1' });

    expect(mockPost).toHaveBeenCalledWith('/editorial/reviews/review-1/comments', {
      commentText: 'Please revise panel 2.', pageId: 'page-1',
    });
    expect(mockPost.mock.calls[0][1]).not.toHaveProperty('content');
  });

  it.each([
    ['approveReview', '/approve'],
    ['requestReviewRevision', '/request-revision'],
    ['rejectReview', '/reject'],
  ] as const)('sends DecisionRequest to %s', async (method, suffix) => {
    await editorialApi[method]('review-1', { decisionNote: 'Decision recorded.' });

    expect(mockPost).toHaveBeenCalledWith(`/editorial/reviews/review-1${suffix}`, { decisionNote: 'Decision recorded.' });
    const body = mockPost.mock.calls[0][1];
    expect(body).not.toHaveProperty('notes');
    expect(body).not.toHaveProperty('reason');
  });

  it.each([400, 401, 403, 404])('propagates editorial HTTP %i errors', async (status) => {
    const requestError = { response: { status, data: { message: `HTTP ${status}` } } };
    mockPost.mockRejectedValue(requestError);

    await expect(editorialApi.approveReview('review-1', {})).rejects.toBe(requestError);
  });
});

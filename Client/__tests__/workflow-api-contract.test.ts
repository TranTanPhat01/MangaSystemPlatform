import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockPost, mockGet, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    post: mockPost,
    get: mockGet,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

import { mangaApi } from '@/services/manga-api';

describe('manga workflow API contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: { success: true } });
    mockGet.mockResolvedValue({ data: { success: true } });
    mockPatch.mockResolvedValue({ data: { success: true } });
    mockDelete.mockResolvedValue({ data: { success: true } });
  });

  it('submits chapter review to the review endpoint', async () => {
    await mangaApi.submitChapterForReview('chapter-1');

    expect(mockPost).toHaveBeenCalledWith('/manga/chapters/chapter-1/submit-review');
  });

  it('updates a series with PATCH and only the backend UpdateSeriesRequest fields', async () => {
    const response = {
      data: {
        success: true,
        data: {
          id: 'series-1',
          title: 'Updated Series',
          status: 3,
        },
      },
    };
    mockPatch.mockResolvedValue(response);

    const result = await mangaApi.updateSeries('series-1', {
      title: 'Updated Series',
      genre: 'Action',
      status: 3,
    });

    expect(mockPatch).toHaveBeenCalledWith('/manga/series/series-1', {
      title: 'Updated Series',
      genre: 'Action',
      status: 3,
    });
    expect(mockPatch.mock.calls[0][1]).not.toHaveProperty('frequency');
    expect(result).toBe(response);
  });

  it.each([400, 401, 403])('propagates update-series HTTP %i errors to the caller', async (status) => {
    const requestError = {
      response: {
        status,
        data: { message: `Series update failed with HTTP ${status}.` },
      },
    };
    mockPatch.mockRejectedValue(requestError);

    await expect(mangaApi.updateSeries('series-1', { title: 'Updated Series' }))
      .rejects.toBe(requestError);
  });

  it('creates annotations using the server-compatible payload shape', async () => {
    await mangaApi.createAnnotation('page-1', {
      type: 'Background',
      coordinatesJson: '{"x":10,"y":20}',
      description: 'Shade the background',
    });

    expect(mockPost).toHaveBeenCalledWith('/manga/pages/page-1/annotations', {
      type: 'Background',
      coordinatesJson: '{"x":10,"y":20}',
      description: 'Shade the background',
    });
  });
});

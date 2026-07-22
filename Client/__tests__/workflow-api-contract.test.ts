import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

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

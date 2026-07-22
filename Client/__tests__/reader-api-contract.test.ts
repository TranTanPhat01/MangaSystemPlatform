import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, put, del } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), del: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { get, post, put, delete: del } }));

import { readerApi } from '@/services/reader-api';

describe('reader API contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses real favorite, bookmark, progress and history routes', async () => {
    await readerApi.addFavorite('series-1'); await readerApi.removeFavorite('series-1'); await readerApi.getFavorites();
    await readerApi.addBookmark({ chapterId: 'chapter-1', pageId: 'page-1' }); await readerApi.removeBookmark('bookmark-1'); await readerApi.getBookmarks();
    await readerApi.saveProgress({ seriesId: 'series-1', chapterId: 'chapter-1', pageId: 'page-1' }); await readerApi.continueReading(); await readerApi.getHistory(); await readerApi.clearHistory();
    expect(post).toHaveBeenCalledWith('/manga/reader/favorites/series-1');
    expect(del).toHaveBeenCalledWith('/manga/reader/favorites/series-1');
    expect(get).toHaveBeenCalledWith('/manga/reader/favorites', { params: { page: 1, pageSize: 20 } });
    expect(post).toHaveBeenCalledWith('/manga/reader/bookmarks', { chapterId: 'chapter-1', pageId: 'page-1' });
    expect(put).toHaveBeenCalledWith('/manga/reader/progress', { seriesId: 'series-1', chapterId: 'chapter-1', pageId: 'page-1' });
    expect(del).toHaveBeenCalledWith('/manga/reader/history');
  });

  it('uses rating and comment contracts without local persistence', async () => {
    await readerApi.getRatingSummary('series-1'); await readerApi.rate('series-1', { value: 5 }); await readerApi.removeRating('series-1');
    await readerApi.addSeriesComment('series-1', { content: 'Great chapter.' }); await readerApi.getSeriesComments('series-1'); await readerApi.updateComment('comment-1', { content: 'Updated.' }); await readerApi.deleteComment('comment-1');
    expect(get).toHaveBeenCalledWith('/manga/series/series-1/ratings/summary');
    expect(put).toHaveBeenCalledWith('/manga/reader/ratings/series-1', { value: 5 });
    expect(post).toHaveBeenCalledWith('/manga/series/series-1/comments', { content: 'Great chapter.' });
    expect(get).toHaveBeenCalledWith('/manga/series/series-1/comments', { params: { page: 1, pageSize: 20 } });
    expect(put).toHaveBeenCalledWith('/manga/comments/comment-1', { content: 'Updated.' });
    expect(del).toHaveBeenCalledWith('/manga/comments/comment-1');
  });
});
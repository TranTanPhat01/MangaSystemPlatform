// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardDashboard } from '@/hooks/useBoardDashboard';
import { editorialApi } from '@/services/editorial-api';
import { mangaApi } from '@/services/manga-api';

vi.mock('@/services/editorial-api', () => ({
  editorialApi: {
    getPublicationSchedules: vi.fn(),
    getIssues: vi.fn(),
    getVoteSummary: vi.fn(),
    getRankings: vi.fn(),
    getSeriesRankingHistory: vi.fn(),
    getCancellationWarnings: vi.fn(),
  },
}));

vi.mock('@/services/manga-api', () => ({
  mangaApi: {
    getSeries: vi.fn(),
  },
}));

type MockFunction = ReturnType<typeof vi.fn>;

const series = {
  id: 'series-1',
  studioId: 'studio-1',
  title: 'Manga One',
  status: 1,
  createdBy: 'user-1',
  createdAt: '2026-07-01T00:00:00.000Z',
};

describe('P1 board dashboard refresh contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mangaApi.getSeries as MockFunction).mockResolvedValue({
      data: { success: true, data: [series] },
    });
    (editorialApi.getPublicationSchedules as MockFunction).mockResolvedValue({
      data: { success: true, data: [] },
    });
    (editorialApi.getIssues as MockFunction).mockResolvedValue({
      data: { success: true, data: [] },
    });
    (editorialApi.getVoteSummary as MockFunction).mockResolvedValue({
      data: { success: true, data: { seriesId: 'series-1' } },
    });
    (editorialApi.getRankings as MockFunction).mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  it('returns false and preserves existing data when a resolved API envelope is unsuccessful', async () => {
    const { result } = renderHook(() => useBoardDashboard());

    await waitFor(() => {
      expect(result.current.series).toEqual([series]);
    });

    (mangaApi.getSeries as MockFunction).mockResolvedValueOnce({
      data: { success: false, data: [], message: 'Series unavailable' },
    });

    let refreshResult: boolean | undefined;
    await act(async () => {
      refreshResult = await result.current.fetchBoardData();
    });

    expect(refreshResult).toBe(false);
    expect(result.current.series).toEqual([series]);
    expect(result.current.error).toBe('Series unavailable');
  });

  it('applies a calculated ranking snapshot to the currently selected issue', async () => {
    const { result } = renderHook(() => useBoardDashboard());
    const rankingItems = [{
      seriesId: 'series-1',
      voteCount: 12,
      rankPosition: 1,
      positiveRate: 100,
      trend: 'Up',
      riskLevel: 'Low',
      score: 12,
    }];

    await waitFor(() => {
      expect(result.current.series).toEqual([series]);
    });
    await act(async () => {
      await result.current.selectIssue('issue-1');
    });
    act(() => {
      result.current.applyCalculatedRanking('issue-1', rankingItems);
    });

    expect(result.current.rankings).toEqual(rankingItems);
  });
});

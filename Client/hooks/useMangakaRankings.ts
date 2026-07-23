import { useState, useEffect } from 'react';
import { editorialApi } from '@/services/editorial-api';
import { IssueResponse, RankingItemResponse, CancellationWarningResponse } from '@/types/editorial';

export interface MangakaSeriesRanking {
  seriesId: string;
  seriesTitle: string;
  rank: number;
  votes: number;
  trend: 'up' | 'down' | 'stable';
  hasWarning: boolean;
}

export function useMangakaRankings() {
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [rankings, setRankings] = useState<MangakaSeriesRanking[]>([]);
  const [cancellationWarnings, setCancellationWarnings] = useState<CancellationWarningResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await editorialApi.getIssues();
      if (res.data?.success) {
        const issueList = res.data.data || [];
        setIssues(issueList);
        if (issueList.length > 0 && !selectedIssueId) {
          setSelectedIssueId(issueList[0].id);
          void loadRankingsForIssue(issueList[0].id);
        }
      } else {
        setError(res.data?.message || 'Failed to load issues.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Could not reach editorial service.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadRankingsForIssue = async (issueId: string) => {
    if (!issueId) return;
    setLoadingRanking(true);
    setError(null);
    try {
      const res = await editorialApi.getRankings(issueId);
      if (res.data?.success) {
        const rankingSnapshots = res.data.data || [];
        const mappedRankings: MangakaSeriesRanking[] = (rankingSnapshots[0]?.items || []).map(
          (item: RankingItemResponse, index: number) => ({
            seriesId: item.seriesId,
            seriesTitle: `Series ${item.seriesId.toString().slice(0, 8)}`,
            rank: item.rankPosition || index + 1,
            votes: item.voteCount || 0,
            trend: (item.trend as 'up' | 'down' | 'stable') || 'stable',
            hasWarning: item.riskLevel !== 'Low',
          })
        );
        setRankings(mappedRankings);
      } else {
        setRankings([]);
        setError(res.data?.message || 'Could not load rankings.');
      }
    } catch (err: any) {
      setRankings([]);
      setError(err.response?.data?.message || 'Could not reach editorial service.');
    } finally {
      setLoadingRanking(false);
    }
  };

  const handleIssueChange = async (issueId: string) => {
    setSelectedIssueId(issueId);
    void loadRankingsForIssue(issueId);
  };

  useEffect(() => {
    void fetchIssues();
  }, []);

  return {
    issues,
    selectedIssueId,
    rankings,
    loading,
    loadingRanking,
    error,
    handleIssueChange,
    fetchIssues,
  };
}

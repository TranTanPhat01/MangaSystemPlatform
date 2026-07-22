import { useCallback, useEffect, useState } from 'react';
import { editorialApi } from '@/services/editorial-api';
import { mangaApi } from '@/services/manga-api';
import { SeriesResponse } from '@/types/manga';
import { BoardVoteSummaryResponse, BoardVoteValue, CreatePublicationScheduleRequest, IssueResponse, PublicationScheduleResponse, RankingItemResponse, VoteDecision } from '@/types/editorial';

function messageFor(error: unknown, action: string) {
  const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
  if (response?.status === 401) return 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
  if (response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  return response?.data?.message || `Không thể ${action}.`;
}

export function useBoardDashboard() {
  const [series, setSeries] = useState<SeriesResponse[]>([]);
  const [voteSummaries, setVoteSummaries] = useState<Record<string, BoardVoteSummaryResponse>>({});
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [rankings, setRankings] = useState<RankingItemResponse[]>([]);
  const [schedules, setSchedules] = useState<PublicationScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const [seriesRes, schedulesRes, issuesRes] = await Promise.all([mangaApi.getSeries(), editorialApi.getPublicationSchedules(), editorialApi.getIssues()]);
      const loadedSeries = seriesRes.data.success ? seriesRes.data.data : [];
      setSeries(loadedSeries);
      setSchedules(schedulesRes.data.success ? schedulesRes.data.data : []);
      setIssues(issuesRes.data.success ? issuesRes.data.data : []);
      const entries = await Promise.all(loadedSeries.map(async item => {
        try { const response = await editorialApi.getVoteSummary(item.id); return response.data.success ? [item.id, response.data.data] as const : null; } catch { return null; }
      }));
      setVoteSummaries(Object.fromEntries(entries.filter((entry): entry is readonly [string, BoardVoteSummaryResponse] => entry !== null)));
    } catch (error) { setError(messageFor(error, 'tải dữ liệu hội đồng')); }
    finally { setIsLoading(false); }
  }, []);

  const loadRankings = useCallback(async (issueId: string) => {
    if (!issueId) return;
    setIsRankingLoading(true); setError(null);
    try { const response = await editorialApi.getRankings(issueId); setRankings(response.data.success ? response.data.data.items : []); if (!response.data.success) setError(response.data.message || 'Không thể tải bảng xếp hạng.'); }
    catch (error) { setRankings([]); setError(messageFor(error, 'tải bảng xếp hạng')); }
    finally { setIsRankingLoading(false); }
  }, []);

  const selectIssue = async (issueId: string) => { setSelectedIssueId(issueId); setRankings([]); if (issueId) await loadRankings(issueId); };
  const calculateRanking = async () => {
    if (!selectedIssueId) return;
    setIsRankingLoading(true); setError(null);
    try { const response = await editorialApi.calculateRanking(selectedIssueId); if (response.data.success) { setRankings(response.data.data.items); setSuccessMessage('Đã tính lại bảng xếp hạng.'); } else setError(response.data.message || 'Không thể tính bảng xếp hạng.'); }
    catch (error) { setError(messageFor(error, 'tính bảng xếp hạng')); }
    finally { setIsRankingLoading(false); }
  };
  const inputReaderVote = async (seriesId: string, voteCount: number) => {
    if (!selectedIssueId || voteCount < 0) return false;
    setIsRankingLoading(true); setError(null);
    try { const response = await editorialApi.inputReaderVote(selectedIssueId, { seriesId, voteCount }); if (response.data.success) { setSuccessMessage('Đã ghi nhận phiếu độc giả.'); await loadRankings(selectedIssueId); return true; } setError(response.data.message || 'Không thể ghi nhận phiếu độc giả.'); return false; }
    catch (error) { setError(messageFor(error, 'ghi nhận phiếu độc giả')); return false; } finally { setIsRankingLoading(false); }
  };
  const voteProposal = async (seriesId: string, decision: VoteDecision, note?: string) => {
    setIsVoting(true); setError(null);
    const voteValue = decision === 'Approve' ? BoardVoteValue.Approve : decision === 'Reject' ? BoardVoteValue.Reject : BoardVoteValue.Revision;
    try { const response = await editorialApi.voteProposal(seriesId, note ? { voteValue, note } : { voteValue }); if (response.data.success) { setVoteSummaries(previous => ({ ...previous, [seriesId]: response.data.data })); setSuccessMessage('Biểu quyết đã được ghi nhận.'); } else setError(response.data.message || 'Không thể ghi nhận biểu quyết.'); }
    catch (error) { setError(messageFor(error, 'ghi nhận biểu quyết')); } finally { setIsVoting(false); }
  };
  const finalizeProposal = async (seriesId: string) => {
    setIsFinalizing(true); setError(null);
    try { const response = await editorialApi.finalizeProposal(seriesId, { adminOverride: false }); if (response.data.success) { setVoteSummaries(previous => ({ ...previous, [seriesId]: response.data.data })); setSuccessMessage('Đã chốt kết quả biểu quyết.'); } else setError(response.data.message || 'Không thể chốt kết quả.'); }
    catch (error) { setError(messageFor(error, 'chốt kết quả')); } finally { setIsFinalizing(false); }
  };
  const createSchedule = async (data: CreatePublicationScheduleRequest) => {
    setIsScheduling(true); setError(null);
    try { const response = await editorialApi.createPublicationSchedule(data); if (response.data.success) { setSchedules(previous => [response.data.data, ...previous]); setSuccessMessage('Đã tạo lịch xuất bản.'); return true; } setError(response.data.message || 'Không thể tạo lịch xuất bản.'); return false; }
    catch (error) { setError(messageFor(error, 'tạo lịch xuất bản')); return false; } finally { setIsScheduling(false); }
  };
  useEffect(() => { void fetchBoardData(); }, [fetchBoardData]);
  return { series, voteSummaries, issues, selectedIssueId, rankings, schedules, isLoading, isRankingLoading, isVoting, isFinalizing, isScheduling, error, successMessage, fetchBoardData, selectIssue, voteProposal, finalizeProposal, calculateRanking, inputReaderVote, createSchedule, clearError: () => setError(null), clearSuccess: () => setSuccessMessage(null) };
}

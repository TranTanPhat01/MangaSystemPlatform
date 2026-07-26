import { useCallback, useEffect, useState } from 'react';
import { editorialApi } from '@/services/editorial-api';
import { mangaApi } from '@/services/manga-api';
import { SeriesResponse } from '@/types/manga';
import { BoardVoteSummaryResponse, BoardVoteValue, CancellationWarningResponse, CreateIssueRequest, CreatePublicationScheduleRequest, IssueResponse, PublicationScheduleResponse, RankingItemResponse, UpdateIssueStatusRequest, VoteDecision } from '@/types/editorial';

function messageFor(error: unknown, action: string) {
  const response = (error as { response?: { status?: number; data?: { message?: string; error?: { message?: string } } } }).response;
  if (response?.status === 401) return 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
  if (response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  return response?.data?.error?.message || response?.data?.message || `Không thể ${action}.`;
}

export function useBoardDashboard() {
  const [series, setSeries] = useState<SeriesResponse[]>([]);
  const [voteSummaries, setVoteSummaries] = useState<Record<string, BoardVoteSummaryResponse>>({});
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState('');
  const [rankings, setRankings] = useState<RankingItemResponse[]>([]);
  const [rankingHistory, setRankingHistory] = useState<RankingItemResponse[]>([]);
  const [cancellationWarnings, setCancellationWarnings] = useState<CancellationWarningResponse[]>([]);
  const [schedules, setSchedules] = useState<PublicationScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [publishingScheduleId, setPublishingScheduleId] = useState<string | null>(null);
  const [isSeriesActionLoading, setIsSeriesActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const [seriesRes, schedulesRes, issuesRes] = await Promise.all([mangaApi.getSeries(), editorialApi.getPublicationSchedules(), editorialApi.getIssues()]);
      const failedResponse = [seriesRes.data, schedulesRes.data, issuesRes.data]
        .find(response => !response.success);
      if (failedResponse) {
        setError(failedResponse.message || 'Không thể tải dữ liệu hội đồng.');
        return false;
      }
      const loadedSeries = seriesRes.data.data;
      setSeries(loadedSeries);
      setSchedules(schedulesRes.data.data);
      setIssues(issuesRes.data.data);

      let hasSummaryError = false;
      const fetchedSummaries: Record<string, BoardVoteSummaryResponse> = {};
      
      await Promise.all(
        loadedSeries.map(async (s) => {
          try {
            const summaryRes = await editorialApi.getVoteSummary(s.id);
            if (summaryRes.data.success) {
              fetchedSummaries[s.id] = summaryRes.data.data;
            } else {
              hasSummaryError = true;
            }
          } catch {
            hasSummaryError = true;
          }
        })
      );

      setVoteSummaries(prev => ({ ...prev, ...fetchedSummaries }));

      if (hasSummaryError) {
        setError('Một số tóm tắt biểu quyết không thể tải và có thể đã cũ (degraded).');
        return false;
      }

      return true;
    } catch (error) { setError(messageFor(error, 'tải dữ liệu hội đồng')); return false; }
    finally { setIsLoading(false); }
  }, []);

  const loadRankings = useCallback(async (issueId: string) => {
    if (!issueId) return;
    setIsRankingLoading(true); setError(null);
    try { const response = await editorialApi.getRankings(issueId); setRankings(response.data.success ? (response.data.data[0]?.items || []) : []); if (!response.data.success) setError(response.data.message || 'Không thể tải bảng xếp hạng.'); }
    catch (error) { setRankings([]); setError(messageFor(error, 'tải bảng xếp hạng')); }
    finally { setIsRankingLoading(false); }
  }, []);

  const loadSeriesInsights = useCallback(async (seriesId: string) => {
    if (!seriesId) { setRankingHistory([]); setCancellationWarnings([]); return; }
    try {
      const [historyResponse, warningsResponse] = await Promise.all([editorialApi.getSeriesRankingHistory(seriesId), editorialApi.getCancellationWarnings(seriesId)]);
      setRankingHistory(historyResponse.data.success ? historyResponse.data.data : []);
      setCancellationWarnings(warningsResponse.data.success ? warningsResponse.data.data : []);
    } catch (error) { setError(messageFor(error, 'tải lịch sử ranking')); }
  }, []);

  const loadVoteSummary = useCallback(async (seriesId: string) => {
    if (!seriesId) return;
    try {
      const response = await editorialApi.getVoteSummary(seriesId);
      if (response.data.success) {
        setVoteSummaries(prev => ({ ...prev, [seriesId]: response.data.data }));
      }
    } catch (e) {
      console.error('Failed to load vote summary:', e);
    }
  }, []);

  const selectIssue = async (issueId: string) => { setSelectedIssueId(issueId); setRankings([]); if (issueId) await loadRankings(issueId); };
  const applyCalculatedRanking = useCallback((issueId: string, items: RankingItemResponse[]) => {
    if (issueId === selectedIssueId) setRankings(items);
  }, [selectedIssueId]);
  const calculateRanking = async () => {
    if (!selectedIssueId) return;
    setIsRankingLoading(true); setError(null); setSuccessMessage(null);
    try { const response = await editorialApi.calculateRanking(selectedIssueId); if (response.data.success) { setRankings(response.data.data.items); setSuccessMessage('Đã tính lại bảng xếp hạng.'); } else setError(response.data.message || 'Không thể tính bảng xếp hạng.'); }
    catch (error) { setError(messageFor(error, 'tính bảng xếp hạng')); }
    finally { setIsRankingLoading(false); }
  };
  const inputReaderVote = async (seriesId: string, voteCount: number) => {
    if (!selectedIssueId || voteCount < 0) return false;
    setIsRankingLoading(true); setError(null); setSuccessMessage(null);
    try { const response = await editorialApi.inputReaderVote(selectedIssueId, { seriesId, voteCount }); if (response.data.success) { setSuccessMessage('Đã ghi nhận phiếu độc giả.'); await loadRankings(selectedIssueId); return true; } setError(response.data.message || 'Không thể ghi nhận phiếu độc giả.'); return false; }
    catch (error) { setError(messageFor(error, 'ghi nhận phiếu độc giả')); return false; } finally { setIsRankingLoading(false); }
  };
  const voteProposal = async (seriesId: string, decision: VoteDecision, note?: string) => {
    setIsVoting(true); setError(null); setSuccessMessage(null);
    let voteValue: BoardVoteValue;
    if (decision === 'Approve') voteValue = BoardVoteValue.Approve;
    else if (decision === 'Reject') voteValue = BoardVoteValue.Reject;
    else if (decision === 'Abstain') voteValue = BoardVoteValue.Abstain;
    else voteValue = BoardVoteValue.Revision;

    try {
      const response = await editorialApi.voteProposal(seriesId, note ? { voteValue, note } : { voteValue });
      if (response.data.success) {
        setSuccessMessage('Biểu quyết đã được ghi nhận.');
        try {
          const summaryRes = await editorialApi.getVoteSummary(seriesId);
          if (summaryRes.data.success) {
            setVoteSummaries(previous => ({ ...previous, [seriesId]: summaryRes.data.data }));
          }
        } catch (e) {
          console.error('Failed to fetch updated vote summary:', e);
        }
        await fetchBoardData();
        return true;
      } else {
        setError(response.data.message || 'Không thể ghi nhận biểu quyết.');
        return false;
      }
    }
    catch (error) { setError(messageFor(error, 'ghi nhận biểu quyết')); return false; } finally { setIsVoting(false); }
  };
  const finalizeProposal = async (seriesId: string, adminOverride = false, reason?: string) => {
    setIsFinalizing(true); setError(null); setSuccessMessage(null);
    try {
      const response = await editorialApi.finalizeProposal(seriesId, { adminOverride, reason });
      if (response.data.success) {
        setVoteSummaries(previous => ({ ...previous, [seriesId]: response.data.data }));
        setSuccessMessage('Đã chốt kết quả biểu quyết.');
        await fetchBoardData();
        return true;
      } else {
        setError(response.data.message || 'Không thể chốt kết quả.');
        return false;
      }
    }
    catch (error) { setError(messageFor(error, 'chốt kết quả')); return false; } finally { setIsFinalizing(false); }
  };
  const setSeriesStatus = async (seriesId: string, action: 'hiatus' | 'cancel') => {
    setIsSeriesActionLoading(true); setError(null); setSuccessMessage(null);
    try {
      const response = action === 'hiatus' ? await editorialApi.setSeriesHiatus(seriesId) : await editorialApi.cancelSeries(seriesId);
      if (response.data.success) {
        setSuccessMessage(action === 'hiatus' ? 'Series đã chuyển sang hiatus.' : 'Series đã được hủy.');
        await loadSeriesInsights(seriesId);
        await fetchBoardData();
        return true;
      }
      setError(response.data.message || 'Không thể cập nhật trạng thái series.'); return false;
    } catch (error) { setError(messageFor(error, 'cập nhật trạng thái series')); return false; }
    finally { setIsSeriesActionLoading(false); }
  };
  const createSchedule = async (data: CreatePublicationScheduleRequest) => {
    setIsScheduling(true); setError(null); setSuccessMessage(null);
    try { const response = await editorialApi.createPublicationSchedule(data); if (response.data.success) { setSchedules(previous => [response.data.data, ...previous]); setSuccessMessage('Đã tạo lịch xuất bản.'); return true; } setError(response.data.message || 'Không thể tạo lịch xuất bản.'); return false; }
    catch (error) { setError(messageFor(error, 'tạo lịch xuất bản')); return false; } finally { setIsScheduling(false); }
  };
  const publishSchedule = async (scheduleId: string) => {
    setPublishingScheduleId(scheduleId); setError(null); setSuccessMessage(null);
    try { const response = await editorialApi.publishPublicationSchedule(scheduleId); if (response.data.success) { setSchedules(previous => previous.map(schedule => schedule.id === scheduleId ? response.data.data : schedule)); setSuccessMessage('Đã xuất bản lịch.'); return true; } setError(response.data.message || 'Không thể xuất bản lịch.'); return false; }
    catch (error) { setError(messageFor(error, 'xuất bản lịch')); return false; } finally { setPublishingScheduleId(null); }
  };
  const createIssue = async (data: CreateIssueRequest) => {
    setError(null); setSuccessMessage(null);
    try { const response = await editorialApi.createIssue(data); if (response.data.success) { setIssues(previous => [response.data.data, ...previous]); setSuccessMessage('Đã tạo issue.'); return true; } setError(response.data.message || 'Không thể tạo issue.'); return false; }
    catch (error) { setError(messageFor(error, 'tạo issue')); return false; }
  };
  const updateIssueStatus = async (issueId: string, data: UpdateIssueStatusRequest) => {
    setError(null); setSuccessMessage(null);
    try { const response = await editorialApi.updateIssueStatus(issueId, data); if (response.data.success) { setIssues(previous => previous.map(issue => issue.id === issueId ? response.data.data : issue)); setSuccessMessage('Đã cập nhật trạng thái issue.'); return true; } setError(response.data.message || 'Không thể cập nhật trạng thái issue.'); return false; }
    catch (error) { setError(messageFor(error, 'cập nhật trạng thái issue')); return false; }
  };
  const clearError = useCallback(() => setError(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchBoardData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchBoardData]);
  return { series, voteSummaries, issues, selectedIssueId, rankings, rankingHistory, cancellationWarnings, schedules, isLoading, isRankingLoading, isVoting, isFinalizing, isScheduling, isSeriesActionLoading, publishingScheduleId, error, successMessage, fetchBoardData, loadSeriesInsights, loadVoteSummary, selectIssue, applyCalculatedRanking, voteProposal, finalizeProposal, setSeriesStatus, calculateRanking, inputReaderVote, createSchedule, publishSchedule, createIssue, updateIssueStatus, clearError, clearSuccess };
}

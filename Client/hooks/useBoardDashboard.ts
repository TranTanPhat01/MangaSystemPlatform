import { useState, useEffect } from 'react';
import { editorialApi } from '@/services/editorial-api';
import {
  SeriesProposalResponse,
  BoardVoteSummaryResponse,
  RankingResponse,
  PublicationScheduleResponse,
  VoteDecision,
  CreatePublicationScheduleRequest,
} from '@/types/editorial';

export function useBoardDashboard() {
  const [proposals, setProposals] = useState<SeriesProposalResponse[]>([]);
  const [voteSummaries, setVoteSummaries] = useState<Record<string, BoardVoteSummaryResponse>>({});
  const [rankings, setRankings] = useState<RankingResponse[]>([]);
  const [schedules, setSchedules] = useState<PublicationScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  const fetchBoardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch Proposals & Schedules in parallel
      const [proposalsRes, schedulesRes] = await Promise.all([
        editorialApi.getProposals(),
        editorialApi.getPublicationSchedules(),
      ]);

      if (proposalsRes.data.success) {
        const proposalList = proposalsRes.data.data;
        setProposals(proposalList);

        // Fetch vote summary for each proposal
        const summaryPromises = proposalList.map((p: SeriesProposalResponse) =>
          editorialApi.getVoteSummary(p.id)
            .then((res) => ({ proposalId: p.id, summary: res.data.data }))
            .catch(() => null)
        );

        const summaries = await Promise.all(summaryPromises);
        const summariesMap: Record<string, BoardVoteSummaryResponse> = {};
        summaries.forEach((item) => {
          if (item && item.summary) {
            summariesMap[item.proposalId] = item.summary;
          }
        });
        setVoteSummaries(summariesMap);
      }

      if (schedulesRes.data.success) {
        setSchedules(schedulesRes.data.data || []);
      }
    } catch (err: any) {
      handleApiError(err, 'load board data');
    } finally {
      setIsLoading(false);
    }
  };

  const voteProposal = async (proposalId: string, decision: VoteDecision, comment?: string) => {
    setIsVoting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await editorialApi.voteProposal(proposalId, { decision, comment });
      if (res.data.success) {
        // Update local vote summary
        setVoteSummaries((prev) => ({
          ...prev,
          [proposalId]: res.data.data,
        }));
        setSuccessMessage('Biểu quyết của bạn đã được ghi nhận.');
      } else {
        setError(res.data.message || 'Không thể ghi nhận biểu quyết.');
      }
    } catch (err: any) {
      handleApiError(err, 'vote');
    } finally {
      setIsVoting(false);
    }
  };

  const finalizeProposal = async (proposalId: string) => {
    setIsFinalizing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await editorialApi.finalizeProposal(proposalId);
      if (res.data.success) {
        const updatedProposal = res.data.data;
        setProposals((prev) =>
          prev.map((p) => (p.id === proposalId ? { ...p, status: updatedProposal.status } : p))
        );
        setSuccessMessage(`Đề xuất series "${updatedProposal.seriesTitle}" đã được chốt và thay đổi trạng thái thành công.`);
      } else {
        setError(res.data.message || 'Không thể chốt đề xuất.');
      }
    } catch (err: any) {
      handleApiError(err, 'finalize');
    } finally {
      setIsFinalizing(false);
    }
  };

  const createSchedule = async (data: CreatePublicationScheduleRequest) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await editorialApi.createPublicationSchedule(data);
      if (res.data.success) {
        setSchedules((prev) => [res.data.data, ...prev]);
        setSuccessMessage('Lịch xuất bản đã được tạo thành công.');
      } else {
        setError(res.data.message || 'Không thể tạo lịch xuất bản.');
      }
    } catch (err: any) {
      handleApiError(err, 'create schedule');
    }
  };

  const calculateRanking = async () => {
    setError(null);
    setSuccessMessage(null);
    setError('Vui lòng chỉ định Kỳ phát hành (IssueId) để tính toán bảng xếp hạng.');
  };


  const handleApiError = (err: any, action: string) => {
    const status = err.response?.status;
    let msg = `Có lỗi xảy ra khi thực hiện ${action}.`;

    if (status === 401) {
      msg = 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
    } else if (status === 403) {
      msg = 'Bạn không có quyền thực hiện thao tác hội đồng.';
    } else if (status === 409 || status === 400) {
      msg = err.response?.data?.message || err.response?.data?.error || msg;
    } else if (status >= 500) {
      msg = 'Dịch vụ hội đồng tạm thời không khả dụng.';
    } else {
      msg = err.response?.data?.message || err.message || msg;
    }

    setError(msg);
  };

  useEffect(() => {
    fetchBoardData();
  }, []);

  return {
    proposals,
    voteSummaries,
    rankings,
    schedules,
    isLoading,
    isVoting,
    isFinalizing,
    error,
    successMessage,
    fetchBoardData,
    voteProposal,
    finalizeProposal,
    createSchedule,
    calculateRanking,
    clearError,
    clearSuccess,
  };
}

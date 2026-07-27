'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import BoardSidebar from './BoardSidebar';
import BoardHeader from './BoardHeader';
import BoardVotingPanel from './BoardVotingPanel';
import RankingTable from './RankingTable';
import BoardBottomRow from './BoardBottomRow';
import IssueManagement from './IssueManagement';
import CancellationRiskPanel from './CancellationRiskPanel';
import BoardKpiCards from './BoardKpiCards';
import { ActiveNav } from '@/types/board';
import { useBoardDashboard } from '@/hooks/useBoardDashboard';
import { useAuthStore } from '@/store/auth-store';

const EMPTY_ROLES: string[] = [];

export function BoardDashboard() {
  const board = useBoardDashboard();
  const searchParams = useSearchParams();
  const router = useRouter();

  const querySeriesId = searchParams.get('seriesId') || '';
  const queryTab = (searchParams.get('tab') as ActiveNav) || 'Dashboard';

  const [activeNav, setActiveNav] = useState<ActiveNav>(queryTab);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSeriesId, setSelectedSeriesId] = useState(querySeriesId);

  const loadSeriesInsights = board.loadSeriesInsights;
  const clearBoardError = board.clearError;
  const boardError = board.error;

  const updateQuery = (seriesId: string, tab: ActiveNav) => {
    const params = new URLSearchParams();
    if (seriesId) params.set('seriesId', seriesId);
    if (tab) params.set('tab', tab);
    router.replace(`/board?${params.toString()}`);
  };

  const handleNavigate = (tab: ActiveNav) => {
    setActiveNav(tab);
    updateQuery(selectedSeriesId, tab);
  };

  useEffect(() => {
    if (selectedSeriesId || !board.series[0]) return;
    const timer = window.setTimeout(() => {
      setSelectedSeriesId(board.series[0].id);
      updateQuery(board.series[0].id, activeNav);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [board.series, selectedSeriesId]);

  const loadVoteSummary = board.loadVoteSummary;

  useEffect(() => {
    if (selectedSeriesId) {
      void loadSeriesInsights(selectedSeriesId);
      void loadVoteSummary(selectedSeriesId);
    }
  }, [loadSeriesInsights, loadVoteSummary, selectedSeriesId]);

  useEffect(() => {
    if (!boardError) return;
    const timer = setTimeout(clearBoardError, 5000);
    return () => clearTimeout(timer);
  }, [boardError, clearBoardError]);

  const isDraft = (status: any) => status === 1 || status === 'Draft';
  const isSubmitted = (status: any) => status === 2 || status === 'Submitted';

  // Proposal queue filtering: Draft must NOT appear in the Board Queue
  const visibleSeries = board.series.filter((item) => !isDraft(item.status));
  const submittedSeries = visibleSeries.filter((item) => isSubmitted(item.status));

  const selected = visibleSeries.find((item) => item.id === selectedSeriesId) || null;
  const storedRoles = useAuthStore((state) => state.user?.roles);
  const roles = storedRoles ?? EMPTY_ROLES;
  const canManageIssues = roles.some((role) =>
    ['editorialboard', 'admin'].includes(role.toLowerCase())
  );

  const voting = (
    <section className="bg-white rounded-2xl border p-5">
      <h2 className="font-bold mb-3">Board voting</h2>
      <select
        aria-label="Series to vote"
        value={selectedSeriesId}
        onChange={(e) => {
          setSelectedSeriesId(e.target.value);
          updateQuery(e.target.value, activeNav);
        }}
        className="border rounded p-2 mb-4 w-full"
      >
        <option value="">Chọn Series</option>
        {submittedSeries.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <BoardVotingPanel
        proposal={selected}
        summary={selected ? board.voteSummaries[selected.id] || null : null}
        onVote={board.voteProposal}
        onFinalize={board.finalizeProposal}
        isVoting={board.isVoting}
        isFinalizing={board.isFinalizing}
      />
    </section>
  );

  const rankings = (
    <RankingTable
      issues={board.issues}
      series={visibleSeries}
      selectedIssueId={board.selectedIssueId}
      rankings={board.rankings}
      isLoading={board.isRankingLoading}
      onIssueChange={(id) => void board.selectIssue(id)}
      onReaderVote={board.inputReaderVote}
      onRecalculate={board.calculateRanking}
      onRetry={() =>
        board.selectedIssueId ? board.selectIssue(board.selectedIssueId) : Promise.resolve()
      }
    />
  );

  const schedules = (
    <BoardBottomRow
      schedules={board.schedules}
      issues={board.issues}
      onCreate={board.createSchedule}
      onPublish={board.publishSchedule}
      publishingScheduleId={board.publishingScheduleId}
      isSubmitting={board.isScheduling}
    />
  );

  const cancellation = (
    <CancellationRiskPanel
      series={visibleSeries}
      selectedSeriesId={selectedSeriesId}
      warnings={board.cancellationWarnings}
      rankingHistory={board.rankingHistory}
      isLoading={board.isSeriesActionLoading}
      onSeriesChange={(id) => {
        setSelectedSeriesId(id);
        updateQuery(id, activeNav);
      }}
      onStatusChange={(action) => board.setSeriesStatus(selectedSeriesId, action)}
    />
  );

  const content =
    activeNav === 'Issue Management' ? (
      <IssueManagement
        issues={board.issues}
        canManage={canManageIssues}
        onCreate={board.createIssue}
        onStatusChange={(issueId, status) => board.updateIssueStatus(issueId, { status })}
        onRefresh={board.fetchBoardData}
        onRankingCalculated={board.applyCalculatedRanking}
      />
    ) : activeNav === 'Board Voting' ? (
      voting
    ) : activeNav === 'Rankings' ? (
      rankings
    ) : activeNav === 'Cancellation Review' || activeNav === 'Decision History' ? (
      cancellation
    ) : activeNav === 'Publication Schedule' ? (
      schedules
    ) : (
      <div className="space-y-6">
        <BoardKpiCards
          proposalCount={submittedSeries.length}
          totalVotes={Object.values(board.voteSummaries).reduce((total, summary) => total + summary.total, 0)}
          publishedScheduleCount={board.schedules.filter((schedule) => schedule.status === 2).length}
          rankingWarningCount={board.rankings.filter((item) => ['High', 'Critical'].includes(item.riskLevel)).length}
          cancellationWarningCount={board.cancellationWarnings.filter((warning) => !warning.isResolved).length}
        />
        {voting}
        {rankings}
        {cancellation}
        {schedules}
      </div>
    );

  return (
    <div className="flex h-screen bg-slate-50">
      <BoardSidebar
        active={activeNav}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        proposalCount={submittedSeries.length}
        warningCount={board.cancellationWarnings.filter((warning) => !warning.isResolved).length}
      />
      <div className="flex-1 min-w-0 overflow-auto">
        <BoardHeader onToggleSidebar={() => setSidebarOpen((value) => !value)} />
        <div className="p-6 space-y-4">
          {board.error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded flex justify-between">
              <span>
                <AlertCircle size={14} className="inline mr-2" />
                {board.error}
              </span>
              <button onClick={board.clearError} aria-label="Dismiss board error">
                <X size={14} />
              </button>
            </div>
          )}
          {board.successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded flex justify-between">
              <span>
                <CheckCircle2 size={14} className="inline mr-2" />
                {board.successMessage}
              </span>
              <button onClick={board.clearSuccess} aria-label="Dismiss board success message">
                <X size={14} />
              </button>
            </div>
          )}
          {board.isLoading && <p>Đang tải workspace…</p>}
          {content}
        </div>
      </div>
    </div>
  );
}

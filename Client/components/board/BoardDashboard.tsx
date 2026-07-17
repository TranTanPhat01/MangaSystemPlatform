'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Users, ShieldCheck, AlertCircle, CheckCircle2, X } from 'lucide-react';
import BoardSidebar from './BoardSidebar';
import BoardHeader from './BoardHeader';
import BoardKpiCards from './BoardKpiCards';
import ProposalQueue from './ProposalQueue';
import BoardVotingPanel from './BoardVotingPanel';
import RankingTable from './RankingTable';
import CancellationRiskPanel from './CancellationRiskPanel';
import BoardBottomRow from './BoardBottomRow';
import BoardRightPanel from './BoardRightPanel';
import { ActiveNav } from '@/types/board';
import { useBoardDashboard } from '@/hooks/useBoardDashboard';
import { SeriesProposalResponse } from '@/types/editorial';

interface DashboardContentProps {
  proposals: SeriesProposalResponse[];
  voteSummaries: Record<string, any>;
  rankings: any[];
  schedules: any[];
  onVote: any;
  onFinalize: any;
  onRecalculate: any;
  isVoting: boolean;
  isFinalizing: boolean;
  isLoading: boolean;
}

function DashboardContent({
  proposals,
  voteSummaries,
  rankings,
  schedules,
  onVote,
  onFinalize,
  onRecalculate,
  isVoting,
  isFinalizing,
  isLoading,
}: DashboardContentProps) {
  const [selectedProposal, setSelectedProposal] = useState<SeriesProposalResponse | null>(null);

  // Set default proposal
  useEffect(() => {
    if (proposals.length > 0 && !selectedProposal) {
      setSelectedProposal(proposals[0]);
    }
  }, [proposals]);

  // Keep selected proposal updated on data changes
  useEffect(() => {
    if (selectedProposal && proposals.length > 0) {
      const found = proposals.find(p => p.id === selectedProposal.id);
      if (found) {
        setSelectedProposal(found);
      }
    }
  }, [proposals]);

  return (
    <div className="space-y-7">
      {/* ── Greeting Banner ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-plum-50/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-burgundy-50/30 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-plum-50 text-plum-800 border border-plum-100 mb-3 uppercase tracking-wider">
            <ShieldCheck size={11} className="text-plum-600" />
            Editorial Board · Q2/2026
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Tổng quan quyết định xuất bản và hiệu suất series hôm nay.
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1 max-w-xl">
            {proposals.filter(p => p.status === 'Voting').length} đề xuất đang chờ biểu quyết · {schedules.length} lịch xuất bản đã lên kế hoạch.
          </p>
        </div>
        <div className="relative flex flex-wrap gap-2.5 shrink-0">
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Upload size={13} />Nhập bình chọn độc giả
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            <Calendar size={13} />Tạo lịch xuất bản
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-plum-800 text-xs font-bold text-white hover:bg-plum-900 shadow-[0_2px_8px_rgba(88,28,135,0.2)] transition-all active:scale-[0.98]">
            <Users size={13} />Xem phiên họp hội đồng
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <BoardKpiCards />

      {/* ── Two-column layout: Proposals + Right Panel ── */}
      <div className="flex gap-6">
        {/* Main Left */}
        <div className="flex-1 min-w-0 space-y-7">
          <ProposalQueue
            proposals={proposals}
            voteSummaries={voteSummaries}
            onSelectProposal={setSelectedProposal}
          />
          
          <BoardVotingPanel
            proposal={selectedProposal}
            summary={selectedProposal ? voteSummaries[selectedProposal.id] : null}
            onVote={onVote}
            onFinalize={onFinalize}
            isVoting={isVoting}
            isFinalizing={isFinalizing}
          />
          
          <RankingTable
            rankings={rankings}
            onRecalculate={onRecalculate}
            isLoading={isLoading}
          />
          
          <CancellationRiskPanel />
          
          <BoardBottomRow schedules={schedules} />
        </div>
        {/* Right Sidebar */}
        <BoardRightPanel />
      </div>
    </div>
  );
}

export function BoardDashboard() {
  const {
    proposals,
    voteSummaries,
    rankings,
    schedules,
    isLoading,
    isVoting,
    isFinalizing,
    error,
    successMessage,
    voteProposal,
    finalizeProposal,
    calculateRanking,
    clearError,
    clearSuccess,
  } = useBoardDashboard();

  const [activeNav, setActiveNav] = useState<ActiveNav>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto clear notifications after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(clearSuccess, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Render view based on active menu item
  const renderContent = () => {
    switch (activeNav) {
      case 'Dashboard':
        return (
          <DashboardContent
            proposals={proposals}
            voteSummaries={voteSummaries}
            rankings={rankings}
            schedules={schedules}
            onVote={voteProposal}
            onFinalize={finalizeProposal}
            onRecalculate={calculateRanking}
            isVoting={isVoting}
            isFinalizing={isFinalizing}
            isLoading={isLoading}
          />
        );
      case 'Series Proposals':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Series Proposals</h1>
            <ProposalQueue proposals={proposals} voteSummaries={voteSummaries} />
          </div>
        );
      case 'Board Voting':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Board Voting</h1>
            {proposals.length > 0 ? (
              <BoardVotingPanel
                proposal={proposals[0]}
                summary={voteSummaries[proposals[0].id]}
                onVote={voteProposal}
                onFinalize={finalizeProposal}
                isVoting={isVoting}
                isFinalizing={isFinalizing}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <p className="text-xs text-slate-500 font-semibold">Chưa có đề cử nào để biểu quyết.</p>
              </div>
            )}
          </div>
        );
      case 'Rankings':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Popularity Rankings</h1>
            <RankingTable
              rankings={rankings}
              onRecalculate={calculateRanking}
              isLoading={isLoading}
            />
          </div>
        );
      case 'Cancellation Review':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Cancellation Review</h1>
            <CancellationRiskPanel />
          </div>
        );
      case 'Publication Schedule':
      case 'Decision History':
      default:
        return (
          <div className="bg-white border border-slate-150 rounded-xl p-8 text-center max-w-xl mx-auto shadow-sm mt-8 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-slate-800">Module: {activeNav}</h3>
            <p className="text-sm text-slate-500 font-semibold mt-1.5 max-w-md mx-auto">
              Không có API thật cho tab này. Module đang hiển thị giao diện mẫu.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-800 overflow-hidden font-sans antialiased">
      <BoardSidebar active={activeNav} onNavigate={setActiveNav} open={sidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <BoardHeader onToggleSidebar={() => setSidebarOpen(s => !s)} />
        
        {/* Banner notifications */}
        <div className="px-6 pt-4 space-y-3 bg-[#F4F6FA]">
          {error && (
            <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-rose-600 hover:text-rose-800 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={clearSuccess} className="text-emerald-600 hover:text-emerald-850 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-6 bg-[#F4F6FA]">
          {isLoading && proposals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 border-4 border-plum-800 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-semibold mt-3">Loading board workspace...</span>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Mobile overlay */}
      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  );
}

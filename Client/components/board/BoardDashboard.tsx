'use client';
import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import BoardSidebar from './BoardSidebar';
import BoardHeader from './BoardHeader';
import BoardVotingPanel from './BoardVotingPanel';
import RankingTable from './RankingTable';
import BoardBottomRow from './BoardBottomRow';
import { ActiveNav } from '@/types/board';
import { useBoardDashboard } from '@/hooks/useBoardDashboard';

export function BoardDashboard() {
 const board = useBoardDashboard(); const [activeNav, setActiveNav] = useState<ActiveNav>('Dashboard'); const [sidebarOpen, setSidebarOpen] = useState(true); const [selectedSeriesId, setSelectedSeriesId] = useState('');
 useEffect(() => { if (!selectedSeriesId && board.series[0]) setSelectedSeriesId(board.series[0].id); }, [board.series, selectedSeriesId]);
 useEffect(() => { if (!board.error) return; const timer = setTimeout(board.clearError, 5000); return () => clearTimeout(timer); }, [board.error]);
 const selected = board.series.find(item => item.id === selectedSeriesId) || null;
 const voting = <section className="bg-white rounded-2xl border p-5"><h2 className="font-bold mb-3">Board voting</h2><select aria-label="Series to vote" value={selectedSeriesId} onChange={e => setSelectedSeriesId(e.target.value)} className="border rounded p-2 mb-4 w-full"><option value="">Chọn Series</option>{board.series.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select><BoardVotingPanel proposal={selected} summary={selected ? board.voteSummaries[selected.id] || null : null} onVote={board.voteProposal} onFinalize={board.finalizeProposal} isVoting={board.isVoting} isFinalizing={board.isFinalizing}/></section>;
 const rankings = <RankingTable issues={board.issues} series={board.series} selectedIssueId={board.selectedIssueId} rankings={board.rankings} isLoading={board.isRankingLoading} onIssueChange={id => void board.selectIssue(id)} onReaderVote={board.inputReaderVote} onRecalculate={board.calculateRanking} onRetry={() => board.selectedIssueId ? board.selectIssue(board.selectedIssueId) : Promise.resolve()}/>;
 const schedules = <BoardBottomRow schedules={board.schedules} issues={board.issues} onCreate={board.createSchedule} isSubmitting={board.isScheduling}/>;
 const content = activeNav === 'Board Voting' ? voting : activeNav === 'Rankings' ? rankings : activeNav === 'Publication Schedule' ? schedules : <div className="space-y-6">{voting}{rankings}{schedules}</div>;
 return <div className="flex h-screen bg-slate-50"><BoardSidebar active={activeNav} onNavigate={setActiveNav} open={sidebarOpen}/><div className="flex-1 min-w-0 overflow-auto"><BoardHeader onToggleSidebar={() => setSidebarOpen(value => !value)}/><div className="p-6 space-y-4">{board.error && <div className="p-3 bg-rose-50 text-rose-700 rounded flex justify-between"><span><AlertCircle size={14} className="inline mr-2"/>{board.error}</span><button onClick={board.clearError}><X size={14}/></button></div>}{board.successMessage && <div className="p-3 bg-emerald-50 text-emerald-700 rounded flex justify-between"><span><CheckCircle2 size={14} className="inline mr-2"/>{board.successMessage}</span><button onClick={board.clearSuccess}><X size={14}/></button></div>}{board.isLoading ? <p>Đang tải workspace…</p> : content}</div></div></div>;
}

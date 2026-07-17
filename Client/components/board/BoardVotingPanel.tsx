import React, { useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, RotateCcw, XCircle, CheckSquare, Sparkles, Send } from 'lucide-react';
import { SeriesProposalResponse, BoardVoteSummaryResponse, VoteDecision } from '@/types/editorial';

interface BoardVotingPanelProps {
  proposal: SeriesProposalResponse | null;
  summary: BoardVoteSummaryResponse | null;
  onVote: (id: string, decision: VoteDecision, comment?: string) => Promise<void>;
  onFinalize: (id: string) => Promise<void>;
  isVoting: boolean;
  isFinalizing: boolean;
}

export default function BoardVotingPanel({
  proposal,
  summary,
  onVote,
  onFinalize,
  isVoting,
  isFinalizing,
}: BoardVotingPanelProps) {
  const [comment, setComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<VoteDecision | null>(null);

  if (!proposal) {
    return (
      <section className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h3 className="text-sm font-bold text-slate-700">Chưa chọn đề xuất nào</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">Chọn một đề cử từ bảng trên để tiến hành thảo luận & bỏ phiếu.</p>
      </section>
    );
  }

  const handleVoteClick = (decision: VoteDecision) => {
    if (decision === 'Approve') {
      // Direct vote without comment required
      onVote(proposal.id, 'Approve', comment || undefined);
      setComment('');
      setShowCommentBox(false);
      setPendingDecision(null);
    } else {
      // Require comment box
      setPendingDecision(decision);
      setShowCommentBox(true);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingDecision || !comment.trim()) return;
    await onVote(proposal.id, pendingDecision, comment);
    setComment('');
    setShowCommentBox(false);
    setPendingDecision(null);
  };

  const total = summary?.totalVotes ?? 0;
  const approve = summary?.approveCount ?? 0;

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-plum-800 to-burgundy-900 h-24 relative p-4 flex flex-col justify-end text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex justify-between items-end">
          <div>
            <p className="text-base font-black leading-tight">{proposal.seriesTitle}</p>
            <p className="text-[10px] font-semibold text-white/70">
              Mangaka: {proposal.mangakaName || 'Chưa rõ'} · Thể loại: {proposal.genre || 'Manga'}
            </p>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 bg-white/10 uppercase">
            {proposal.status}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Synopsis */}
        {proposal.synopsis && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Synopsis</p>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{proposal.synopsis}</p>
          </div>
        )}

        {/* Voting Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiến độ bỏ phiếu</span>
            <span className="text-[10px] font-black text-slate-700">{total} phiếu</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-plum-600 to-plum-400 transition-all duration-500"
              style={{ width: total > 0 ? `${(approve / total) * 100}%` : '0%' }}
            />
          </div>
          {summary && (
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-2">
              <span className="text-emerald-600">✓ Duyệt: {summary.approveCount} ({summary.approvePercent}%)</span>
              <span className="text-amber-600">↺ Sửa: {summary.reviseCount} ({summary.revisePercent}%)</span>
              <span className="text-rose-600">✗ Từ chối: {summary.rejectCount} ({summary.rejectPercent}%)</span>
            </div>
          )}
        </div>

        {/* Action Form */}
        {showCommentBox && pendingDecision ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
            <label className="block text-[10px] font-bold text-slate-655 uppercase">
              Lý do {pendingDecision === 'Reject' ? 'Từ chối' : 'Yêu cầu sửa'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Lý do quyết định ${pendingDecision}...`}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-plum-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowCommentBox(false); setPendingDecision(null); }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isVoting}
                className="px-3 py-1.5 bg-plum-800 text-white rounded-lg text-[10px] font-bold hover:bg-plum-900 transition-colors flex items-center gap-1"
              >
                <Send size={10} />
                <span>Gửi phiếu</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleVoteClick('Approve')}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 hover:bg-emerald-100 transition-all duration-150 disabled:opacity-50"
            >
              <CheckCircle2 size={12} />Duyệt
            </button>
            <button
              onClick={() => handleVoteClick('Revise')}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250 hover:bg-amber-100 transition-all duration-150 disabled:opacity-50"
            >
              <RotateCcw size={12} />Yêu cầu sửa
            </button>
            <button
              onClick={() => handleVoteClick('Reject')}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-250 hover:bg-rose-100 transition-all duration-150 disabled:opacity-50"
            >
              <XCircle size={12} />Từ chối
            </button>
          </div>
        )}

        {/* User Current Vote */}
        {summary?.currentUserVote && (
          <div className={clsx(
            'py-2 px-3 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border',
            summary.currentUserVote === 'Approve' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
            summary.currentUserVote === 'Revise' && 'bg-amber-50 text-amber-700 border-amber-200',
            summary.currentUserVote === 'Reject' && 'bg-rose-50 text-rose-700 border-rose-200',
          )}>
            <CheckSquare size={12} />
            Phiếu của bạn: {summary.currentUserVote === 'Approve' ? 'Duyệt' : summary.currentUserVote === 'Revise' ? 'Yêu cầu sửa' : 'Từ chối'}
          </div>
        )}

        {/* Finalize Proposal Action */}
        {proposal.status !== 'Finalized' && summary && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-700">Chốt đề cử phát hành</p>
              <p className="text-[9px] font-medium text-slate-400">
                {summary.quorumMet ? 'Đủ phiếu số đông. Đã sẵn sàng chốt kết quả.' : 'Chưa đạt đủ phiếu cần thiết.'}
              </p>
            </div>
            <button
              onClick={() => onFinalize(proposal.id)}
              disabled={isFinalizing}
              className="px-4 py-2 bg-plum-800 text-white rounded-xl text-[10px] font-bold hover:bg-plum-900 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isFinalizing ? 'Finalizing...' : 'Chốt kết quả'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

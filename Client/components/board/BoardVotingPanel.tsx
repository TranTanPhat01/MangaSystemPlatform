'use client';

import { useState } from 'react';
import { 
  CheckCircle2, RotateCcw, XCircle, Shield, RefreshCw,
  Users, BarChart3, CheckSquare
} from 'lucide-react';
import { BoardVoteSummaryResponse, VoteDecision } from '@/types/editorial';
import { SeriesResponse } from '@/types/manga';
import { useAuthStore } from '@/store/auth-store';

interface Props {
  proposal: SeriesResponse | null;
  summary: BoardVoteSummaryResponse | null;
  onVote: (seriesId: string, decision: VoteDecision, note?: string) => Promise<unknown>;
  onFinalize: (seriesId: string, adminOverride?: boolean, reason?: string) => Promise<unknown>;
  isVoting: boolean;
  isFinalizing: boolean;
}

const EMPTY_ROLES: string[] = [];

export default function BoardVotingPanel({
  proposal,
  summary,
  onVote,
  onFinalize,
  isVoting,
  isFinalizing,
}: Props) {
  const [note, setNote] = useState('');
  const [voted, setVoted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [adminOverride, setAdminOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const storedRoles = useAuthStore((state) => state.user?.roles);
  const roles = storedRoles ?? EMPTY_ROLES;
  const isAdmin = roles.some((role) => role.toLowerCase() === 'admin');

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Shield size={28} className="text-slate-700 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Select a series to cast your vote.</p>
        <p className="text-xs text-slate-700 mt-1">Use the series proposals list to choose a submission.</p>
      </div>
    );
  }

  const vote = async (decision: VoteDecision) => {
    setVoted(false);
    await onVote(proposal.id, decision, note.trim() || undefined);
    setNote('');
    setVoted(true);
    setTimeout(() => setVoted(false), 3000);
  };

  const isFinalized = proposal.status === 3 || proposal.status === 9 || (proposal.status as string | number) === 'Approved' || (proposal.status as string | number) === 'Rejected';

  return (
    <div className="space-y-4">
      {/* Series info */}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 mb-1">Voting On</p>
        <h3 className="text-base font-bold text-slate-800">{proposal.title}</h3>
        {proposal.description && (
          <p className="text-xs text-slate-700 mt-0.5 font-medium line-clamp-2">{proposal.description}</p>
        )}
        {proposal.genre && (
          <span className="inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            {proposal.genre}
          </span>
        )}
      </div>

      {/* Vote summary */}
      {summary ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 mb-3 flex items-center gap-1.5">
            <BarChart3 size={10} />Current Votes
          </p>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-lg font-black text-emerald-600">{summary.approve}</p>
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Approve</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-amber-600">{summary.revision}</p>
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Revision</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-rose-600">{summary.reject}</p>
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Reject</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-slate-600">{summary.abstain}</p>
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Abstain</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-700 font-semibold">
            <span className="flex items-center gap-1">
              <Users size={10} />
              {summary.total} total vote(s)
            </span>
            <span className={`flex items-center gap-1 font-bold ${summary.quorumReached ? 'text-emerald-600' : 'text-slate-400'}`}>
              <CheckSquare size={10} />
              {summary.quorumReached ? 'Quorum Reached' : 'Quorum Not Reached'}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-700 font-semibold">No votes recorded yet.</p>
        </div>
      )}

      {/* Voted confirmation */}
      {voted && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={13} />
          Vote recorded successfully.
        </div>
      )}

      {/* Note input */}
      {!isFinalized && (
        <div>
          <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-widest mb-1.5">
            Vote Note (Optional)
          </label>
          <textarea
            aria-label="Vote note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-300 resize-none transition-colors"
            rows={3}
            placeholder="Add a note to your vote (optional)…"
          />
        </div>
      )}

      {/* Vote buttons */}
      {!isFinalized ? (
        <div className="grid grid-cols-4 gap-2">
          <button
            disabled={isVoting}
            onClick={() => void vote('Approve')}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
          >
            {isVoting ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
            Approve
          </button>
          <button
            disabled={isVoting}
            onClick={() => void vote('Revision')}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
          >
            {isVoting ? <RefreshCw size={11} className="animate-spin" /> : <RotateCcw size={11} />}
            Revision
          </button>
          <button
            disabled={isVoting}
            onClick={() => void vote('Reject')}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
          >
            {isVoting ? <RefreshCw size={11} className="animate-spin" /> : <XCircle size={11} />}
            Reject
          </button>
          <button
            disabled={isVoting}
            onClick={() => void vote('Abstain')}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors disabled:opacity-50"
          >
            {isVoting ? <RefreshCw size={11} className="animate-spin" /> : <Shield size={11} />}
            Abstain
          </button>
        </div>
      ) : (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 text-center">
          Proposal has been finalized. Voting is closed.
        </div>
      )}

      {/* Finalize button & Confirmation block */}
      {!isFinalized && (summary?.quorumReached || isAdmin) && (
        <div className="space-y-3">
          {!showConfirm ? (
            <button
              disabled={isFinalizing}
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {isFinalizing ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
              Finalize Decision
            </button>
          ) : (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <p className="text-xs font-bold text-indigo-950">Confirm Proposal Finalization</p>
              <p className="text-[11px] text-indigo-700">Are you sure you want to finalize this decision? The proposal status will be synced immediately. This cannot be undone.</p>
              
              {isAdmin && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input 
                      type="checkbox" 
                      checked={adminOverride} 
                      onChange={(e) => setAdminOverride(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500" 
                    />
                    Use Admin Override
                  </label>
                  
                  {adminOverride && (
                    <input
                      aria-label="Override reason"
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Reason for admin override (required)"
                      className="w-full border rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  disabled={isFinalizing || (adminOverride && !overrideReason.trim())}
                  onClick={async () => {
                    await onFinalize(proposal.id, adminOverride, adminOverride ? overrideReason : undefined);
                    setShowConfirm(false);
                    setAdminOverride(false);
                    setOverrideReason('');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setAdminOverride(false);
                    setOverrideReason('');
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { BoardVoteSummaryResponse, VoteDecision } from '@/types/editorial';
import { SeriesResponse } from '@/types/manga';

interface Props {
  proposal: SeriesResponse | null;
  summary: BoardVoteSummaryResponse | null;
  onVote: (seriesId: string, decision: VoteDecision, note?: string) => Promise<void>;
  onFinalize: (seriesId: string) => Promise<void>;
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
}: Props) {
  const [note, setNote] = useState('');

  if (!proposal) {
    return <p className="text-sm text-slate-500">Chọn một Series để biểu quyết.</p>;
  }

  const vote = async (decision: VoteDecision) => {
    await onVote(proposal.id, decision, note.trim() || undefined);
    setNote('');
  };

  return (
    <div className="space-y-3">
      <p className="font-semibold">{proposal.title}</p>
      {summary ? (
        <div className="grid grid-cols-3 text-xs gap-2">
          <span>Approve: {summary.approve}</span>
          <span>Revision: {summary.revision}</span>
          <span>Reject: {summary.reject}</span>
          <span>Abstain: {summary.abstain}</span>
          <span>Total: {summary.total}</span>
          <span>Quorum: {summary.quorumReached ? 'Yes' : 'No'}</span>
        </div>
      ) : (
        <p className="text-xs">Chưa có phiếu.</p>
      )}
      <textarea
        aria-label="Vote note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full border rounded p-2"
        placeholder="Ghi chú (không bắt buộc)"
      />
      <div className="flex gap-2">
        <button disabled={isVoting} onClick={() => void vote('Approve')}>
          Approve
        </button>
        <button disabled={isVoting} onClick={() => void vote('Revise')}>
          Request revision
        </button>
        <button disabled={isVoting} onClick={() => void vote('Reject')}>
          Reject
        </button>
        <button disabled={isFinalizing} onClick={() => void onFinalize(proposal.id)}>
          {isFinalizing ? 'Finalizing…' : 'Finalize'}
        </button>
      </div>
    </div>
  );
}

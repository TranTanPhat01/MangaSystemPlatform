'use client';

import { useEffect, useState } from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import {
  AlertCircle, AlertTriangle, ChevronDown, ChevronUp, FileText,
  MessageSquare, Play, RefreshCw, ThumbsUp, XCircle, Trophy,
  TrendingUp, TrendingDown, Minus, BarChart3,
} from 'lucide-react';
import { editorialApi } from '@/services/editorial-api';
import { useAuthStore } from '@/store/auth-store';
import {
  EditorialCommentResponse, EditorialReviewResponse,
  IssueResponse, RankingItemResponse, RankingSnapshotResponse, ReviewStatus,
} from '@/types/editorial';

type ApiError = {
  message?: unknown;
  response?: { status?: number; data?: { message?: unknown; error?: unknown } };
};

function errorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError;
  const value = apiError.response?.data?.message ?? apiError.response?.data?.error ?? apiError.message;
  if (typeof value === 'string' && value.trim()) return value;
  if (apiError.response?.status === 403) return 'You do not have permission to perform this editorial action.';
  if (apiError.response?.status === 404) return 'This review no longer exists.';
  return fallback;
}

function reviewStatusLabel(status: ReviewStatus) {
  return ReviewStatus[status] ?? 'Unknown';
}

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const classes: Record<ReviewStatus, string> = {
    [ReviewStatus.Pending]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    [ReviewStatus.InReview]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [ReviewStatus.RevisionRequested]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [ReviewStatus.Approved]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    [ReviewStatus.Rejected]: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${classes[status]}`}>{reviewStatusLabel(status)}</span>;
}

function compactId(id: string) { return id.slice(0, 8); }

function CommentForm({ reviewId, disabled, onSuccess }: { reviewId: string; disabled: boolean; onSuccess: () => Promise<void> }) {
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = commentText.trim();
    if (!value) return;
    setLoading(true);
    setError(null);
    try {
      const response = await editorialApi.addReviewComment(reviewId, { commentText: value });
      if (!response.data.success) throw new Error(response.data.message || 'Failed to add comment.');
      setCommentText('');
      await onSuccess();
    } catch (error: unknown) {
      setError(errorMessage(error, 'Failed to add comment.'));
    } finally {
      setLoading(false);
    }
  };

  if (disabled) return <p className="text-xs text-slate-500">Only Tantou Editors and Admins can add editorial comments.</p>;
  return <div className="mt-3 space-y-2">
    {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
    <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a comment..." rows={2} className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none" />
    <button onClick={submit} disabled={loading || !commentText.trim()} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
      {loading ? 'Sending…' : 'Send Comment'}
    </button>
  </div>;
}

export function ReviewCard({ review, canManage, onRefresh }: { review: EditorialReviewResponse; canManage: boolean; onRefresh: () => Promise<void> }) {
  const [loadedDetail, setLoadedDetail] = useState<EditorialReviewResponse | null>(null);
  const [comments, setComments] = useState<EditorialCommentResponse[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const detail = loadedDetail ?? review;

  const loadDetail = async () => {
    setDetailLoading(true);
    setActionError(null);
    try {
      const [reviewResponse, commentsResponse] = await Promise.all([
        editorialApi.getReview(review.id),
        editorialApi.getReviewComments(review.id),
      ]);
      if (!reviewResponse.data.success) throw new Error(reviewResponse.data.message || 'Failed to load review details.');
      if (!commentsResponse.data.success) throw new Error(commentsResponse.data.message || 'Failed to load review comments.');
      setLoadedDetail(reviewResponse.data.data);
      setComments(commentsResponse.data.data);
    } catch (error: unknown) {
      setActionError(errorMessage(error, 'Failed to load review details.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDetailAndQueue = async () => {
    await loadDetail();
    await onRefresh();
  };

  const performAction = async (action: 'start' | 'approve' | 'revision' | 'reject') => {
    if (action === 'reject' && !window.confirm('Reject this review?')) return;
    const note = decisionNote.trim();
    if (action === 'revision' && !note) {
      setActionError('A decision note is required when requesting a revision.');
      return;
    }
    const request = note ? { decisionNote: note } : {};
    setActionLoading(action);
    setActionError(null);
    try {
      const response = action === 'start'
        ? await editorialApi.startReview(detail.id)
        : action === 'approve'
          ? await editorialApi.approveReview(detail.id, request)
          : action === 'revision'
            ? await editorialApi.requestReviewRevision(detail.id, request)
            : await editorialApi.rejectReview(detail.id, request);
      if (!response.data.success) throw new Error(response.data.message || `Failed to ${action} review.`);
      setDecisionNote('');
      await refreshDetailAndQueue();
    } catch (error: unknown) {
      setActionError(errorMessage(error, `Failed to ${action} review.`));
    } finally {
      setActionLoading(null);
    }
  };

  const toggleDetails = async () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded) await loadDetail();
  };

  return <div className="p-5 hover:bg-slate-900/20 transition-colors">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-bold text-slate-200 text-sm">Series {compactId(detail.seriesId)} — Chapter {compactId(detail.chapterId)}</h4>
        <p className="text-xs text-slate-500 mt-0.5">Created {new Date(detail.createdAt).toLocaleDateString()}</p>
      </div>
      <ReviewStatusBadge status={detail.status} />
    </div>
    {detail.decisionNote && <p className="mb-3 text-xs text-slate-400">Decision note: {detail.decisionNote}</p>}
    {actionError && <div role="alert" className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg mb-3"><AlertTriangle size={12} className="text-rose-400 shrink-0" /><p className="text-xs text-rose-300">{actionError}</p></div>}
    <div className="flex flex-wrap gap-2 mt-3">
      {canManage && detail.status === ReviewStatus.Pending && <button onClick={() => void performAction('start')} disabled={Boolean(actionLoading)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"><Play size={11} />{actionLoading === 'start' ? 'Starting…' : 'Start Review'}</button>}
      {canManage && detail.status === ReviewStatus.InReview && <>
        <button onClick={() => void performAction('approve')} disabled={Boolean(actionLoading)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"><ThumbsUp size={11} />{actionLoading === 'approve' ? 'Approving…' : 'Approve'}</button>
        <button onClick={() => void performAction('revision')} disabled={Boolean(actionLoading)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50"><AlertCircle size={11} />{actionLoading === 'revision' ? 'Sending…' : 'Request Revision'}</button>
        <button onClick={() => void performAction('reject')} disabled={Boolean(actionLoading)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"><XCircle size={11} />{actionLoading === 'reject' ? 'Rejecting…' : 'Reject'}</button>
      </>}
      <button onClick={() => void toggleDetails()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/50 ml-auto"><MessageSquare size={11} />Comments {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}</button>
    </div>
    {canManage && detail.status === ReviewStatus.InReview && <textarea aria-label="Decision note" value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Decision note (required for revision)" rows={2} className="mt-3 w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none" />}
    {expanded && <div className="mt-3 border-t border-slate-800/60 pt-3">
      {detailLoading ? <p className="text-xs text-slate-500">Loading review details…</p> : comments.length ? <div className="space-y-2 mb-3">{comments.map((comment) => <div key={comment.id} className="p-2 bg-slate-800/40 rounded-lg"><p className="text-[10px] font-bold text-slate-400 mb-0.5">User {compactId(comment.createdByUserId)} · {new Date(comment.createdAt).toLocaleDateString()}</p><p className="text-xs text-slate-300">{comment.commentText}</p></div>)}</div> : <p className="text-xs text-slate-600 mb-2">No comments yet.</p>}
      <CommentForm reviewId={detail.id} disabled={!canManage} onSuccess={refreshDetailAndQueue} />
    </div>}
  </div>;
}

// ─── Rankings Panel (real data) ───────────────────────────────────────────────
function RankingsPanel() {
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [rankItems, setRankItems] = useState<RankingItemResponse[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingIssues(true);
      try {
        const res = await editorialApi.getIssues();
        if (res.data.success) {
          const sorted = (res.data.data ?? []).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setIssues(sorted);
          if (sorted.length > 0) setSelectedIssueId(sorted[0].id);
        }
      } catch {
        setError('Could not load issues.');
      } finally {
        setLoadingIssues(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!selectedIssueId) return;
    const load = async () => {
      setLoadingRankings(true);
      setError(null);
      setRankItems([]);
      try {
        const res = await editorialApi.getRankings(selectedIssueId);
        if (res.data.success) {
          // getRankings returns RankingSnapshotResponse[] — take latest snapshot's items
          const snapshots: RankingSnapshotResponse[] = res.data.data ?? [];
          if (snapshots.length > 0) {
            const latest = snapshots.sort(
              (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
            )[0];
            setRankItems(latest.items ?? []);
          }
        } else {
          setError(res.data.message || 'Failed to load rankings.');
        }
      } catch {
        setError('Could not load rankings data.');
      } finally {
        setLoadingRankings(false);
      }
    };
    void load();
  }, [selectedIssueId]);

  const rankColor = (rank: number) => {
    if (rank === 1) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    if (rank === 2) return 'bg-slate-400/10 border-slate-400/20 text-slate-300';
    if (rank === 3) return 'bg-orange-700/10 border-orange-700/20 text-orange-500';
    return 'bg-slate-700/10 border-slate-700/20 text-slate-500';
  };

  const trendIcon = (trend: string | undefined | null) => {
    if (trend === 'Up') return <TrendingUp size={10} className="text-emerald-400" />;
    if (trend === 'Down') return <TrendingDown size={10} className="text-rose-400" />;
    return <Minus size={10} className="text-slate-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={13} className="text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Rankings</h3>
        </div>
        {loadingRankings && <RefreshCw size={11} className="animate-spin text-indigo-400" />}
      </div>

      {/* Issue selector */}
      {loadingIssues ? (
        <div className="text-xs text-slate-500 font-semibold">Loading issues…</div>
      ) : issues.length > 0 ? (
        <select
          value={selectedIssueId}
          onChange={(e) => setSelectedIssueId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
        >
          {issues.map((issue) => (
            <option key={issue.id} value={issue.id}>
              Issue #{issue.issueNumber} — {issue.title}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-slate-500 font-semibold">No issues found. Create an issue first.</p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-semibold">
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      {/* Rankings list */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden">
        {loadingRankings ? (
          <div className="p-6 text-center">
            <RefreshCw size={16} className="animate-spin text-indigo-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading rankings…</p>
          </div>
        ) : rankItems.length === 0 ? (
          <div className="p-6 text-center">
            <BarChart3 size={22} className="text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">No rankings yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Calculate rankings after entering reader votes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {rankItems
              .slice()
              .sort((a, b) => a.rankPosition - b.rankPosition)
              .map((item) => (
                <div key={item.seriesId} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-7 w-7 rounded border flex items-center justify-center font-bold text-xs font-mono shrink-0 ${rankColor(item.rankPosition)}`}>
                    {item.rankPosition}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-200 text-xs truncate font-mono">{compactId(item.seriesId)}</h4>
                    <p className="text-[10px] text-slate-500">{item.voteCount.toLocaleString()} votes · score {item.score.toFixed(1)}</p>
                  </div>
                  <div className="shrink-0">{trendIcon(item.trend)}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditorialPage() {
  const roles = useAuthStore((state) => state.user?.roles ?? []);
  const canManage = roles.some((role) => ['tantoueditor', 'admin'].includes(role.toLowerCase()));
  const [reviews, setReviews] = useState<EditorialReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true); setError(null);
    try {
      const response = await editorialApi.getReviews();
      if (!response.data.success) throw new Error(response.data.message || 'Failed to load reviews.');
      setReviews(response.data.data);
    } catch (error: unknown) {
      setError(errorMessage(error, 'Could not reach editorial service. Please check that the backend is running.'));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchReviews(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Editorial Operations</h1>
            <p className="text-xs text-slate-500 font-medium">Review submitted manuscripts and collaborate with creators.</p>
          </div>
          <button
            onClick={() => void fetchReviews()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/50 rounded-lg disabled:opacity-50 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Permission warning */}
        {!canManage && (
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            Read-only access. Editorial actions require the TantouEditor or Admin role.
          </p>
        )}

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-300">Failed to load reviews</p>
              <p className="text-xs text-rose-400 mt-0.5">{error}</p>
            </div>
            <button onClick={() => void fetchReviews()} className="text-xs font-bold text-rose-400 underline">Retry</button>
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Review Queue */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Manuscripts Review Queue
              <span className="ml-2 text-slate-600 normal-case font-semibold">({reviews.length})</span>
            </h3>
            {loading ? (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-3" />
                <p className="text-xs text-slate-500">Loading reviews…</p>
              </div>
            ) : !error && reviews.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-10 text-center">
                <FileText size={28} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">No reviews in queue</p>
                <p className="text-xs text-slate-600 mt-1">Waiting for Mangaka to submit chapters for review.</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} canManage={canManage} onRefresh={fetchReviews} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Right: Rankings (real data) */}
          <div>
            <RankingsPanel />
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}

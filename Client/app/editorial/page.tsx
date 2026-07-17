'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { FileText, ThumbsUp, MessageSquare, AlertCircle, Play, XCircle, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { editorialApi } from '@/services/editorial-api';
import { EditorialReviewResponse, ReviewStatus } from '@/types/editorial';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, string> = {
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    InProgress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    RevisionRequested: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {status}
    </span>
  );
}

// ─── Comment Form ─────────────────────────────────────────────────────────────
function CommentForm({ reviewId, onSuccess }: { reviewId: string; onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await editorialApi.addComment(reviewId, { content });
      if (res.data.success) {
        setContent('');
        onSuccess();
      } else {
        setError(res.data.message || 'Failed to add comment.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to add comment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={2}
        className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send Comment'}
      </button>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, onRefresh }: { review: EditorialReviewResponse; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  const handleAction = async (action: 'start' | 'approve' | 'reject') => {
    setActionLoading(action);
    setActionError(null);
    try {
      let res;
      if (action === 'start') res = await editorialApi.startReview(review.id);
      else if (action === 'approve') res = await editorialApi.approveReview(review.id);
      else res = await editorialApi.rejectReview(review.id, { reason: 'Rejected by editor.' });

      if (res.data.success) {
        onRefresh();
      } else {
        setActionError(res.data.message || `Failed to ${action} review.`);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.response?.data?.error || `Failed to ${action}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) return;
    setActionLoading('revision');
    setActionError(null);
    try {
      const res = await editorialApi.requestRevision(review.id, { notes: revisionNote });
      if (res.data.success) {
        setRevisionNote('');
        setShowRevisionInput(false);
        onRefresh();
      } else {
        setActionError(res.data.message || 'Failed to request revision.');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || err.response?.data?.error || 'Failed to request revision.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-5 hover:bg-slate-900/20 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-200 text-sm">
            {review.seriesTitle || 'Unknown Series'} — {review.chapterTitle || `Review #${review.id.slice(0, 6)}`}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted {new Date(review.submittedAt).toLocaleDateString()}
            {review.mangakaName && ` by ${review.mangakaName}`}
          </p>
        </div>
        <ReviewStatusBadge status={review.status} />
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg mb-3">
          <AlertTriangle size={12} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-300">{actionError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        {review.status === 'Pending' && (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading === 'start'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Play size={11} />
            {actionLoading === 'start' ? 'Starting…' : 'Start Review'}
          </button>
        )}
        {review.status === 'InProgress' && (
          <>
            <button
              onClick={() => handleAction('approve')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <ThumbsUp size={11} />
              {actionLoading === 'approve' ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={() => setShowRevisionInput(!showRevisionInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <AlertCircle size={11} />
              Request Revision
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle size={11} />
              {actionLoading === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/50 transition-colors ml-auto"
        >
          <MessageSquare size={11} />
          Comment
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Revision Input */}
      {showRevisionInput && (
        <div className="mt-3 space-y-2">
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="Describe what needs revision..."
            rows={2}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRequestRevision}
              disabled={actionLoading === 'revision' || !revisionNote.trim()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === 'revision' ? 'Sending…' : 'Send Revision Request'}
            </button>
            <button onClick={() => setShowRevisionInput(false)} className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comment Section */}
      {expanded && (
        <div className="mt-3 border-t border-slate-800/60 pt-3">
          {review.comments && review.comments.length > 0 ? (
            <div className="space-y-2 mb-3">
              {review.comments.map((c) => (
                <div key={c.id} className="p-2 bg-slate-800/40 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 mb-0.5">{c.authorName || 'Editor'} · {new Date(c.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-300">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 mb-2">No comments yet.</p>
          )}
          <CommentForm reviewId={review.id} onSuccess={onRefresh} />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditorialPage() {
  const [reviews, setReviews] = useState<EditorialReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await editorialApi.getReviews();
      if (res.data.success) {
        setReviews(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load reviews.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not reach editorial service. Please check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Editorial Operations</h1>
            <p className="text-xs text-slate-500 font-medium">Review submitted manuscripts, process rankings, and collaborate with creators.</p>
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-300">Failed to load reviews</p>
              <p className="text-xs text-rose-400 mt-0.5">{error}</p>
            </div>
            <button onClick={fetchReviews} className="text-xs font-bold text-rose-400 hover:text-rose-200 underline shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review Queue */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Manuscripts Review Queue</h3>

            {/* Loading */}
            {loading && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-3" />
                <p className="text-xs text-slate-500">Loading reviews…</p>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && reviews.length === 0 && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-10 text-center">
                <FileText size={28} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">No reviews in queue</p>
                <p className="text-xs text-slate-600 mt-1">Submissions will appear here once mangakas submit chapters for review.</p>
              </div>
            )}

            {/* Reviews List */}
            {!loading && reviews.length > 0 && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} onRefresh={fetchReviews} />
                ))}
              </div>
            )}
          </div>

          {/* Side Panel – Mock Rankings with clear badge */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Popularity Rankings</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">⚠ Mock Data</span>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
              {[
                { rank: 1, title: 'Shadow Syndicate', votes: '4,285', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                { rank: 2, title: 'Whisper of the Wind', votes: '3,120', color: 'bg-slate-500/10 border-slate-500/20 text-slate-400' },
              ].map((item) => (
                <div key={item.rank} className="flex items-center gap-3 pb-3 border-b border-slate-800/60 last:border-0 last:pb-0">
                  <div className={`h-7 w-7 rounded border flex items-center justify-center font-bold text-xs font-mono ${item.color}`}>{item.rank}</div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">{item.title}</h4>
                    <p className="text-[10px] text-slate-500">{item.votes} votes this week</p>
                  </div>
                </div>
              ))}
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[11px] text-slate-450 leading-relaxed">
                <span className="font-bold text-indigo-400 block mb-1">Rankings — Not Integrated Yet</span>
                Connect to <code className="text-indigo-300">/editorial/rankings</code> to see live data.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}

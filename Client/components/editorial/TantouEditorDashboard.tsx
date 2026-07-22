'use client';

import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, AlertTriangle, Play, CheckSquare, Layers, Clock } from 'lucide-react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { editorialApi } from '@/services/editorial-api';
import { EditorialReviewResponse, ReviewStatus } from '@/types/editorial';

// Status Badge Helper
function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, string> = {
    [ReviewStatus.Pending]: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    [ReviewStatus.InReview]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [ReviewStatus.Approved]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    [ReviewStatus.RevisionRequested]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [ReviewStatus.Rejected]: 'bg-rose-500/10 text-rose-450 border-rose-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {ReviewStatus[status]}
    </span>
  );
}

export function TantouEditorDashboard() {
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
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: unknown; error?: unknown } }; message?: unknown };
      const message = apiError.response?.data?.message ?? apiError.response?.data?.error ?? apiError.message;
      setError(typeof message === 'string' && message.trim() ? message : 'Could not fetch review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchReviews(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const pendingCount = reviews.filter(r => r.status === ReviewStatus.Pending).length;
  const inProgressCount = reviews.filter(r => r.status === ReviewStatus.InReview).length;
  const completedCount = reviews.filter(r => [ReviewStatus.Approved, ReviewStatus.Rejected, ReviewStatus.RevisionRequested].includes(r.status)).length;

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Tantou Editor Dashboard</h1>
            <p className="text-xs text-slate-500 font-medium">Overview of chapter review queues, assignments, and feedback statuses.</p>
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh Queue
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unassigned / Pending</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-450 border border-amber-500/10">
              <Clock size={20} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Active Review</p>
              <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">{inProgressCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-450 border border-indigo-500/10">
              <Play size={20} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Processed Reviews</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{completedCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-450 border border-emerald-500/10">
              <CheckSquare size={20} />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-300">Connection Error</p>
              <p className="text-xs text-rose-450 mt-0.5">{error}</p>
            </div>
            <button onClick={fetchReviews} className="text-xs font-bold text-rose-400 hover:text-rose-250 underline shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* Review Queue Summary List */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800/80 flex items-center gap-2">
            <Layers size={16} className="text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Editorial Queue ({reviews.length})</h2>
          </div>
          
          {loading && reviews.length === 0 ? (
            <div className="p-12 text-center text-slate-550 text-xs font-semibold">
              <RefreshCw size={20} className="animate-spin mx-auto mb-3 text-indigo-500" />
              Loading manuscript queue...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-semibold">
              <FileText size={24} className="mx-auto mb-3 text-slate-600" />
              No manuscript reviews found in the queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-850">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-850/20 transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Series {review.seriesId.slice(0, 8)} · Chapter {review.chapterId.slice(0, 8)}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                      Created: {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ReviewStatusBadge status={review.status} />
                    <a 
                      href="/editorial" 
                      className="px-2.5 py-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded border border-indigo-500/20 transition-colors"
                    >
                      Manage
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
export default TantouEditorDashboard;

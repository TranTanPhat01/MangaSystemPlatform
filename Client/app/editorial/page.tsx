'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import {
  AlertCircle, AlertTriangle, ChevronDown, ChevronUp, FileText,
  MessageSquare, Play, RefreshCw, ThumbsUp, XCircle, Trophy,
  TrendingUp, TrendingDown, Minus, BarChart3, ShieldAlert, X,
} from 'lucide-react';
import { editorialApi } from '@/services/editorial-api';
import { useAuthStore } from '@/store/auth-store';
import {
  EditorialCommentResponse, EditorialReviewResponse,
  IssueResponse, RankingItemResponse, RankingSnapshotResponse, ReviewStatus,
  CancellationWarningResponse, CancellationRiskLevel,
} from '@/types/editorial';
import { mangaApi } from '@/services/manga-api';
import { fileApi } from '@/services/file-api';
import { PageResponse, AnnotationResponse, AnnotationType } from '@/types/manga';

type ApiError = {
  message?: unknown;
  response?: { status?: number; data?: { message?: unknown; error?: unknown } };
};

const EMPTY_ROLES: string[] = [];

function errorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError;
  if (apiError.response?.status === 403) return 'You do not have permission to perform this editorial action.';
  const value = apiError.response?.data?.message ?? apiError.response?.data?.error ?? apiError.message;
  if (typeof value === 'string' && value.trim()) return value;
  if (apiError.response?.status === 404) return 'This review no longer exists.';
  return fallback;
}

function reviewStatusLabel(status: ReviewStatus) {
  return ReviewStatus[status] ?? 'Unknown';
}

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const classes: Record<ReviewStatus, string> = {
    [ReviewStatus.Pending]: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    [ReviewStatus.InReview]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [ReviewStatus.RevisionRequested]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [ReviewStatus.Approved]: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
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

function VisualReviewPanel({ chapterId, canManage }: { chapterId: string; canManage: boolean }) {
  const [pages, setPages] = useState<PageResponse[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationResponse[]>([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [annotationType, setAnnotationType] = useState<AnnotationType>('error');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoadingPages(true);
    setError(null);
    try {
      const res = await mangaApi.getPages(chapterId);
      if (res.data.success) {
        setPages(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          setSelectedPageId(res.data.data[0].id);
        }
      }
    } catch {
      setError('Could not load chapter pages.');
    } finally {
      setLoadingPages(false);
    }
  }, [chapterId]);

  const fetchAnnotations = useCallback(async (pageId: string) => {
    setAnnotationsLoading(true);
    try {
      const res = await mangaApi.getPageAnnotations(pageId);
      if (res.data.success) {
        setAnnotations(res.data.data || []);
      }
    } catch {
      console.warn('Failed to load annotations');
    } finally {
      setAnnotationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    setImageUrl(null);
    setAnnotations([]);
    if (!selectedPageId) return;

    const pageObj = pages.find((p) => p.id === selectedPageId);
    if (pageObj?.fileId) {
      setImageLoading(true);
      fileApi
        .getFileUrl(pageObj.fileId)
        .then((res) => {
          if (res.data?.success && res.data.data?.url) {
            setImageUrl(res.data.data.url);
          }
        })
        .catch((err) => console.warn('Failed to get page URL:', err))
        .finally(() => setImageLoading(false));
    }
    void fetchAnnotations(selectedPageId);
  }, [selectedPageId, pages, fetchAnnotations]);

  // Drawing Canvas logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canManage || submitting || !imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentBox || !imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const width = Math.abs(startPos.x - currentX);
    const height = Math.abs(startPos.y - currentY);

    setCurrentBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !imageUrl) return;
    setIsDrawing(false);
    if (currentBox && (currentBox.width > 1.5 || currentBox.height > 1.5)) {
      setShowForm(true);
    } else {
      setCurrentBox(null);
    }
  };

  const handleAddAnnotation = async () => {
    if (!selectedPageId || !annotationText.trim()) return;
    setSubmitting(true);
    try {
      const res = await mangaApi.createAnnotation(selectedPageId, {
        type: annotationType,
        description: annotationText.trim(),
        notes: 'Added by Editor review',
        coordinatesJson: currentBox ? JSON.stringify(currentBox) : undefined,
      });
      if (res.data.success) {
        setAnnotationText('');
        setShowForm(false);
        setCurrentBox(null);
        void fetchAnnotations(selectedPageId);
      }
    } catch {
      setError('Could not create annotation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    if (!window.confirm('Delete this annotation?')) return;
    try {
      const res = await mangaApi.deleteAnnotation(id);
      if (res.data.success && selectedPageId) {
        void fetchAnnotations(selectedPageId);
      }
    } catch {
      console.warn('Failed to delete annotation');
    }
  };

  if (loadingPages) return <div className="text-xs text-slate-500 py-4 text-center">Loading chapter pages…</div>;
  if (pages.length === 0) return <div className="text-xs text-slate-500 py-4 text-center">No manuscript pages uploaded for this chapter.</div>;

  return (
    <div className="mt-4 border border-slate-800 rounded-xl bg-slate-950 p-4 space-y-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-850 pb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Visual Review Canvas</span>
        <select
          aria-label="Select page to review"
          value={selectedPageId || ''}
          onChange={(e) => setSelectedPageId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>Page {p.pageNumber}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-semibold">
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Canvas */}
        <div className="md:col-span-3">
          {imageLoading ? (
            <div className="aspect-[3/4] bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-center text-xs text-slate-500">
              Loading image…
            </div>
          ) : imageUrl ? (
            <div className="relative group/canvas">
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-slate-850 select-none cursor-crosshair bg-slate-900"
              >
                <img src={imageUrl} alt="Manuscript" className="w-full h-full object-contain pointer-events-none" />

                {/* Overlays */}
                {annotations.map((annot) => {
                  if (!annot.coordinatesJson) return null;
                  try {
                    const box = JSON.parse(annot.coordinatesJson);
                    return (
                      <div
                        key={annot.id}
                        className={`absolute border-2 pointer-events-none rounded ${
                          annot.type === 'error' ? 'border-rose-500 bg-rose-500/10' :
                          annot.type === 'correction' ? 'border-purple-500 bg-purple-500/10' :
                          'border-blue-500 bg-blue-500/10'
                        }`}
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.width}%`,
                          height: `${box.height}%`,
                        }}
                      />
                    );
                  } catch { return null; }
                })}

                {/* Drawing box */}
                {isDrawing && currentBox && (
                  <div
                    className="absolute border-2 border-dashed border-indigo-400 bg-indigo-500/20 rounded pointer-events-none"
                    style={{
                      left: `${currentBox.x}%`,
                      top: `${currentBox.y}%`,
                      width: `${currentBox.width}%`,
                      height: `${currentBox.height}%`,
                    }}
                  />
                )}
              </div>
              <div className="text-[9px] text-slate-500 mt-1 font-mono text-center">
                {canManage ? 'DRAG MOUSE OVER IMAGE TO MARK ERROR / COMMENT' : 'READ-ONLY ACCESS'}
              </div>
            </div>
          ) : (
            <div className="aspect-[3/4] bg-slate-900 border-2 border-dashed border-slate-850 rounded-lg flex flex-col items-center justify-center p-4 text-center text-slate-500 gap-1.5">
              <FileText className="text-slate-700" size={24} />
              <span className="text-xs font-bold">No Image Uploaded</span>
              <span className="text-[10px] leading-relaxed max-w-xs font-mono">This page does not have an attached file asset yet.</span>
            </div>
          )}
        </div>

        {/* Annotations side list */}
        <div className="md:col-span-2 space-y-3">
          {showForm && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2.5 text-slate-200">
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider font-mono">New Visual Annotation</p>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Type</label>
                <select
                  aria-label="Annotation type"
                  value={annotationType}
                  onChange={(e) => setAnnotationType(e.target.value as AnnotationType)}
                  className="w-full text-[11px] bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-250 focus:outline-none"
                >
                  <option value="error">❌ Error</option>
                  <option value="comment">💬 Comment</option>
                  <option value="correction">✏️ Correction</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block mb-1">Issue Description</label>
                <textarea
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Specify what needs to be fixed..."
                  className="w-full text-xs bg-slate-950 border border-slate-850 rounded p-2 resize-none h-14 text-slate-100 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => { setShowForm(false); setCurrentBox(null); }}
                  className="px-2 py-1 hover:bg-slate-800 rounded text-[10px] text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAnnotation}
                  disabled={submitting || !annotationText.trim()}
                  className="px-2.5 py-1 bg-indigo-750 hover:bg-indigo-850 text-white rounded text-[10px] font-bold disabled:opacity-50"
                >
                  Save Box
                </button>
              </div>
            </div>
          )}

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Current Annotations ({annotations.length})</div>
          
          {annotationsLoading ? (
            <div className="text-[10px] text-slate-550 py-3 text-center">Loading annotations...</div>
          ) : annotations.length === 0 ? (
            <div className="text-[10px] text-slate-600 font-mono py-6 text-center border border-dashed border-slate-850 rounded-lg">No annotations on this page.</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {annotations.map((a) => (
                <div key={a.id} className="p-2 bg-slate-900/60 border border-slate-850 rounded-lg flex items-start justify-between gap-2">
                  <div className="text-[11px] flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 font-bold font-mono text-[9px]">
                      <span className={a.type === 'error' ? 'text-rose-455' : a.type === 'correction' ? 'text-purple-400' : 'text-blue-400'}>
                        {a.type === 'error' ? 'ERROR' : a.type === 'correction' ? 'CORRECTION' : 'COMMENT'}
                      </span>
                      {a.coordinatesJson && <span className="text-[8px] bg-slate-800 px-1 py-0.2 rounded text-slate-500 font-normal">Box</span>}
                    </div>
                    <p className="text-slate-300 break-words text-[11px] italic leading-tight">&quot;{a.description || a.notes}&quot;</p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => void handleDeleteAnnotation(a.id)}
                      className="text-slate-500 hover:text-rose-500 p-0.5 rounded transition-colors"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewCard({ review, canManage, onRefresh, defaultExpanded }: { review: EditorialReviewResponse; canManage: boolean; onRefresh: () => Promise<void>; defaultExpanded?: boolean }) {
  const [loadedDetail, setLoadedDetail] = useState<EditorialReviewResponse | null>(null);
  const [comments, setComments] = useState<EditorialCommentResponse[]>([]);
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const detail = loadedDetail ?? review;

  const loadDetail = useCallback(async () => {
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
  }, [review.id]);

  useEffect(() => {
    if (defaultExpanded) {
      void loadDetail();
    }
  }, [defaultExpanded, loadDetail]);

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

  return <div className="p-5 bg-slate-900 transition-colors">
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="font-bold text-slate-100 text-sm">Series {compactId(detail.seriesId)} — Chapter {compactId(detail.chapterId)}</h4>
        <p className="text-xs text-slate-300 mt-0.5">Created {new Date(detail.createdAt).toLocaleDateString()}</p>
      </div>
      <ReviewStatusBadge status={detail.status} />
    </div>
    {detail.decisionNote && <p className="mb-3 text-xs text-slate-300">Decision note: {detail.decisionNote}</p>}
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

      {/* Historical review rounds */}
      {!detailLoading && detail.history && detail.history.length > 0 && (
        <div className="mt-4 mb-4 p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Previous Review Rounds</p>
          <div className="space-y-3">
            {detail.history.map((hist, index) => (
              <div key={hist.id} className="p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">Round {index + 1}</span>
                  <ReviewStatusBadge status={hist.status} />
                </div>
                {hist.decisionNote && (
                  <p className="text-xs text-slate-400 font-medium">
                    <span className="font-semibold text-slate-500">Reason:</span> {hist.decisionNote}
                  </p>
                )}
                <p className="text-[10px] text-slate-500">
                  Reviewed: {new Date(hist.createdAt).toLocaleDateString()}
                </p>
                {hist.comments && hist.comments.length > 0 && (
                  <div className="mt-2 space-y-1 pl-3 border-l-2 border-slate-700">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Comments</p>
                    {hist.comments.map((c) => (
                      <div key={c.id} className="text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500">{compactId(c.createdByUserId)}:</span> {c.commentText}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Visual Canvas Annotation for Editor */}
      {!detailLoading && (
        <VisualReviewPanel chapterId={detail.chapterId} canManage={canManage} />
      )}

      <CommentForm reviewId={detail.id} disabled={!canManage} onSuccess={refreshDetailAndQueue} />
    </div>}
  </div>;
}

// ─── Cancellation Warnings Panel ──────────────────────────────────────────────
export function CancellationWarningsPanel() {
  const [warnings, setWarnings] = useState<CancellationWarningResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await editorialApi.getAllCancellationWarnings();
      if (res.data.success) {
        setWarnings(res.data.data ?? []);
      } else {
        setError(res.data.message || 'Failed to load cancellation warnings.');
      }
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, 'Could not load cancellation warnings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadWarnings(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWarnings]);

  const riskLevelColor = (level: CancellationRiskLevel) => {
    if (level === CancellationRiskLevel.Critical) return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    if (level === CancellationRiskLevel.High) return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
    if (level === CancellationRiskLevel.Medium) return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
    return 'bg-slate-500/10 border-slate-500/20 text-slate-300';
  };

  const riskLevelLabel = (level: CancellationRiskLevel) => {
    if (level === CancellationRiskLevel.Critical) return 'Critical';
    if (level === CancellationRiskLevel.High) return 'High';
    if (level === CancellationRiskLevel.Medium) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={13} className="text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Cancellation Warnings</h3>
        </div>
        <button
          onClick={() => void loadWarnings()}
          disabled={loading}
          aria-label="Refresh cancellation warnings"
          className="p-1 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin text-indigo-400' : 'text-slate-500'} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-semibold">
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <RefreshCw size={16} className="animate-spin text-indigo-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-semibold">Loading warnings…</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle size={22} className="text-rose-500/70 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-semibold">Warnings unavailable</p>
            <p className="text-[10px] text-slate-300 mt-1">Use refresh to try again.</p>
          </div>
        ) : warnings.length === 0 ? (
          <div className="p-6 text-center">
            <ShieldAlert size={22} className="text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-semibold">No active warnings</p>
            <p className="text-[10px] text-slate-300 mt-1">All series are performing well!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {warnings.map((warning) => (
              <div key={warning.id} className="px-4 py-3 bg-slate-900 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-bold text-slate-100 text-xs font-mono">{compactId(warning.seriesId)}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${riskLevelColor(warning.riskLevel)}`}>
                    {riskLevelLabel(warning.riskLevel)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-1">{warning.reason}</p>
                <p className="text-[10px] text-slate-300">Created {new Date(warning.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
          aria-label="Select issue for weekly rankings"
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

function EditorialPageContent() {
  const searchParams = useSearchParams();
  const activeReviewId = searchParams.get('reviewId');
  const storedRoles = useAuthStore((state) => state.user?.roles);
  const roles = storedRoles ?? EMPTY_ROLES;
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
            <h1 className="text-xl font-bold text-slate-900 mb-1">Editorial Operations</h1>
            <p className="text-xs text-slate-700 font-medium">Review submitted manuscripts and collaborate with creators.</p>
          </div>
          <button
            onClick={() => void fetchReviews()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700/50 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
              Manuscripts Review Queue
              <span className="ml-2 text-slate-700 normal-case font-semibold">({reviews.length})</span>
            </h3>
            {loading ? (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-3" />
                <p className="text-xs text-slate-500">Loading reviews…</p>
              </div>
            ) : !error && reviews.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-10 text-center">
                <FileText size={28} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No reviews in queue</p>
                <p className="text-xs text-slate-300 mt-1">Waiting for Mangaka to submit chapters for review.</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                {reviews.map((review) => (
                  <ReviewCard 
                    key={review.id} 
                    review={review} 
                    canManage={canManage} 
                    onRefresh={fetchReviews} 
                    defaultExpanded={review.id === activeReviewId}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Right: Warnings & Rankings */}
          <div className="space-y-6">
            <CancellationWarningsPanel />
            <RankingsPanel />
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}

export default function EditorialPage() {
  return (
    <Suspense fallback={
      <DashboardLayoutWrapper>
        <div className="p-8 text-center text-slate-700 text-xs">
          Loading editorial workspace...
        </div>
      </DashboardLayoutWrapper>
    }>
      <EditorialPageContent />
    </Suspense>
  );
}


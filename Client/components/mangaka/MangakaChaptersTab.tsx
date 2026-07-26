'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { 
  Layers, Plus, RefreshCw, Send, AlertCircle, CheckCircle2, 
  XCircle, Clock, BarChart3, ChevronRight
} from 'lucide-react';
import { mangaApi } from '@/services/manga-api';
import { ChapterResponse, ChapterStatus, SeriesResponse } from '@/types/manga';

interface MangakaChaptersTabProps {
  series: SeriesResponse[];
  triggerModal: (title: string, content: string) => void;
}

const CHAPTER_STATUS_STYLE: Record<string, string> = {
  Draft:              'bg-slate-500/10 text-slate-400 border-slate-500/20',
  InProduction:       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  SubmittedForReview: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  RevisionRequired:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Approved:           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Scheduled:          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Published:          'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Rejected:           'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function MangakaChaptersTab({ series, triggerModal }: MangakaChaptersTabProps) {
  const [chapters, setChapters]             = useState<ChapterResponse[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [success, setSuccess]               = useState<string | null>(null);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);

  // Create chapter form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [chapterNumber, setChapterNumber]   = useState('');
  const [chapterTitle, setChapterTitle]     = useState('');
  const [chapterDeadline, setChapterDeadline] = useState('');
  const [createError, setCreateError]       = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const loadChapters = useCallback(async (seriesId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mangaApi.getChapters(seriesId);
      if (res.data?.success) {
        setChapters(res.data.data || []);
      } else {
        setError(res.data?.message || 'Unable to load chapters.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: string } } };
      setError(e.response?.data?.message || e.response?.data?.error || 'Could not reach manga service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (series.length > 0) {
      const firstId = series[0].id;
      setSelectedSeriesId(firstId);
      void loadChapters(firstId);
    }
  }, [series, loadChapters]);

  const handleCreateChapter = async () => {
    if (!selectedSeriesId || !chapterNumber) return;
    setActionLoading('create');
    setCreateError(null);
    try {
      const res = await mangaApi.createChapter(selectedSeriesId, {
        chapterNumber: parseInt(chapterNumber, 10),
        title: chapterTitle.trim() || undefined,
        deadline: chapterDeadline || undefined,
      });
      if (res.data?.success) {
        setChapterNumber(''); setChapterTitle(''); setChapterDeadline('');
        setShowCreateForm(false);
        flash(`Chapter ${chapterNumber} created successfully.`);
        void loadChapters(selectedSeriesId);
      } else {
        setCreateError(res.data?.message || 'Failed to create chapter.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setCreateError(e.response?.data?.message || 'Chapter creation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async (chapterId: string, chNum: number) => {
    setActionLoading(chapterId);
    setError(null);
    try {
      const res = await mangaApi.submitChapterForReview(chapterId);
      if (res.data?.success) {
        flash(`Chapter ${chNum} submitted for editorial review.`);
        void loadChapters(selectedSeriesId);
      } else {
        triggerModal('Submission Failed', res.data?.message || 'The chapter could not be submitted.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      triggerModal('Submission Failed', e.response?.data?.message || 'The review submission failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusLabel = (status: ChapterStatus | string): string => {
    return String(status);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Chapter Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create chapters, track editorial reviews, and submit for publishing approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Series selector */}
          {series.length > 0 && (
            <select
              value={selectedSeriesId}
              onChange={(e) => {
                setSelectedSeriesId(e.target.value);
                void loadChapters(e.target.value);
              }}
              className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {series.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => void loadChapters(selectedSeriesId)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(v => !v)}
            disabled={!selectedSeriesId}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus size={13} />
            {showCreateForm ? 'Cancel' : 'New Chapter'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {(error || createError) && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          {error || createError}
          <button onClick={() => { setError(null); setCreateError(null); }} className="ml-auto"><XCircle size={13} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
          <CheckCircle2 size={13} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Create Chapter Form */}
      {showCreateForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Plus size={14} className="text-indigo-400" />
            Create New Chapter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chapter Number *</label>
              <input
                type="number"
                min="1"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(e.target.value)}
                placeholder="1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chapter Title</label>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. The First Encounter"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deadline</label>
              <input
                type="date"
                value={chapterDeadline}
                onChange={(e) => setChapterDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => void handleCreateChapter()}
              disabled={!chapterNumber || !selectedSeriesId || actionLoading === 'create'}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40 shadow-sm"
            >
              {actionLoading === 'create' ? <RefreshCw size={12} className="animate-spin" /> : <Layers size={12} />}
              Create Chapter
            </button>
          </div>
        </div>
      )}

      {/* Chapters List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={12} className="text-indigo-400" />
            Chapters — {series.find(s => s.id === selectedSeriesId)?.title ?? 'Select a series'}
          </h2>
          <span className="text-[10px] font-bold text-slate-600">{chapters.length} chapter(s)</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={18} className="animate-spin text-indigo-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading chapters…</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="p-8 text-center">
            <Layers size={24} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No chapters yet.</p>
            <p className="text-xs text-slate-700 mt-1">Click &quot;New Chapter&quot; to add the first chapter to this series.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {chapters.map((item) => {
              const statusStr = getStatusLabel(item.status);
              const statusStyle = CHAPTER_STATUS_STYLE[statusStr] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';
              // BE ChapterStatus: Draft | InProduction | SubmittedForReview | RevisionRequired | Approved | Scheduled | Published | Rejected
              const canSubmit = statusStr === 'Draft' || statusStr === 'InProduction' || statusStr === 'RevisionRequired';

              return (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-850/20 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Chapter number badge */}
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm shrink-0">
                      {item.chapterNumber}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">
                        Chapter {item.chapterNumber}{item.title ? `: ${item.title}` : ''}
                      </h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle}`}>
                          {statusStr}
                        </span>
                        {item.progressPercentage != null && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold">
                            <BarChart3 size={9} />
                            {item.progressPercentage}% complete
                          </span>
                        )}
                        {item.deadline && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold">
                            <Clock size={9} />
                            {new Date(item.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {canSubmit && (
                      <button
                        onClick={() => void handleSubmitReview(item.id, item.chapterNumber)}
                        disabled={actionLoading === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === item.id ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />}
                        Submit for Review
                      </button>
                    )}
                    <button
                      onClick={() => {
                        // Store chapter id for Page Editor navigation
                        localStorage.setItem('manga-current-chapter-id', item.id);
                        triggerModal(
                          `Open Page Editor — Ch.${item.chapterNumber}`,
                          `Chapter ID: ${item.id}\n\nSwitch to the "Page Editor" tab to upload pages and create annotations for this chapter.`
                        );
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors"
                    >
                      <ChevronRight size={10} />
                      Open Editor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

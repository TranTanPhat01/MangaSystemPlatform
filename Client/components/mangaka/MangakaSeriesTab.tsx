'use client';

import React, { useState } from 'react';
import { 
  BookOpen, Plus, Send, RefreshCw, AlertCircle, CheckCircle2, 
  XCircle, ChevronDown, Tag, Clock, TrendingUp, Sparkles
} from 'lucide-react';
import { mangaApi } from '@/services/manga-api';
import { SeriesResponse } from '@/types/manga';

const SERIES_STATUS_STYLE: Record<string, string> = {
  Draft:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Submitted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Approved:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Ongoing:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Hiatus:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Completed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  RevisionRequested: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Rejected:  'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

interface Props {
  seriesError: string | null;
  seriesLoading: boolean;
  series: SeriesResponse[];
  fetchSeries: () => void;
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaSeriesTab({
  seriesError,
  seriesLoading,
  series,
  fetchSeries,
  triggerModal,
}: Props) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Studio creation
  const [studioName, setStudioName] = useState('');
  const [studioDesc, setStudioDesc] = useState('');
  const [studios, setStudios] = useState<{ id: string; name: string }[]>([]);
  const [studiosLoaded, setStudiosLoaded] = useState(false);

  // Series creation
  const [selectedStudioId, setSelectedStudioId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');

  // Notifications
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const loadStudios = async () => {
    if (studiosLoaded) return;
    try {
      const r = await mangaApi.getMyStudios();
      if (r.data.success) {
        setStudios((r.data.data ?? []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
        setStudiosLoaded(true);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenForm = async () => {
    setShowCreateForm(v => !v);
    if (!studiosLoaded) await loadStudios();
  };

  const handleCreateStudio = async () => {
    if (!studioName.trim()) return;
    setActionLoading('studio');
    setFormError(null);
    try {
      const r = await mangaApi.createStudio({ name: studioName.trim(), description: studioDesc.trim() || undefined });
      if (r.data.success && r.data.data) {
        const newStudio = r.data.data;
        setStudios(prev => [...prev, { id: newStudio.id, name: newStudio.name }]);
        setSelectedStudioId(newStudio.id);
        setStudioName(''); setStudioDesc('');
        flash(`Studio "${newStudio.name}" created.`);
      } else {
        setFormError(r.data.message || 'Failed to create studio.');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message || 'Studio creation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSeries = async () => {
    if (!selectedStudioId || !title.trim()) return;
    setActionLoading('series');
    setFormError(null);
    try {
      const r = await mangaApi.createSeries({
        studioId: selectedStudioId,
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genre.trim() || undefined,
      });
      if (r.data.success) {
        setTitle(''); setDescription(''); setGenre('');
        setShowCreateForm(false);
        flash('Series created successfully! You can now create chapters and submit for review.');
        fetchSeries();
      } else {
        setFormError(r.data.message || 'Failed to create series.');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message || 'Series creation failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitProposal = async (seriesId: string, seriesTitle: string) => {
    setActionLoading(seriesId);
    setFormError(null);
    try {
      const r = await mangaApi.submitProposal(seriesId);
      if (r.data.success) {
        flash(`Series "${seriesTitle}" submitted for editorial board review.`);
        fetchSeries();
      } else {
        setFormError(r.data.message || 'Could not submit proposal.');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message || 'Proposal submission failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">My Series</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create and manage your manga series. Submit proposals to the Editorial Board for approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSeries}
            disabled={seriesLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={seriesLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => void handleOpenForm()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} />
            {showCreateForm ? 'Cancel' : 'New Series'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {(seriesError || formError) && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          {seriesError || formError}
          <button onClick={() => setFormError(null)} className="ml-auto"><XCircle size={13} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
          <CheckCircle2 size={13} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Create Series Form */}
      {showCreateForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            Create New Series
          </h3>

          {/* Studio selection or creation */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Studio</label>
            {studios.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedStudioId}
                  onChange={(e) => setSelectedStudioId(e.target.value)}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">— Select Studio —</option>
                  {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            ) : null}

            {/* Inline studio creation */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg space-y-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Or create a new studio:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Studio name"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={studioDesc}
                  onChange={(e) => setStudioDesc(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={() => void handleCreateStudio()}
                  disabled={!studioName.trim() || actionLoading === 'studio'}
                  className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'studio' ? <RefreshCw size={10} className="animate-spin" /> : <Plus size={10} />}
                  Create Studio
                </button>
              </div>
            </div>
          </div>

          {/* Series fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Blade of the Eternal Storm"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Genre</label>
              <div className="relative">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">— Select Genre —</option>
                  {['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief synopsis and concept overview for editorial board review…"
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => void handleCreateSeries()}
              disabled={!selectedStudioId || !title.trim() || actionLoading === 'series'}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {actionLoading === 'series' ? <RefreshCw size={12} className="animate-spin" /> : <BookOpen size={12} />}
              Create Series
            </button>
          </div>
        </div>
      )}

      {/* Series List */}
      {seriesLoading ? (
        <div className="p-8 text-center">
          <RefreshCw size={18} className="animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading series…</p>
        </div>
      ) : series.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <BookOpen size={28} className="text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">No series yet.</p>
          <p className="text-xs text-slate-700 mt-1">Click &quot;New Series&quot; to create your first manga series.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {series.map((item) => {
            const statusStr = typeof item.status === 'number'
              ? ['','Draft','Submitted','Approved','Ongoing','Hiatus','Cancelled','Completed','RevisionRequested','Rejected'][item.status] ?? String(item.status)
              : String(item.status);
            const statusStyle = SERIES_STATUS_STYLE[statusStr] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            const isDraft = statusStr === 'Draft' || item.status === 1;

            return (
              <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-200 text-sm truncate">{item.title}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">{item.description || 'No description'}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle}`}>
                    {statusStr}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] text-slate-600 font-semibold">
                  {item.genre && (
                    <span className="flex items-center gap-1"><Tag size={9} />{item.genre}</span>
                  )}
                  {item.updatedAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={9} />Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                {isDraft && (
                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => void handleSubmitProposal(item.id, item.title)}
                      disabled={actionLoading === item.id}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === item.id ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />}
                      Submit Proposal to Editorial Board
                    </button>
                  </div>
                )}

                {statusStr === 'RevisionRequested' && (
                  <div className="pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-semibold">
                      <TrendingUp size={10} />
                      Revision requested — update your series then resubmit.
                    </div>
                  </div>
                )}

                {statusStr === 'Approved' && (
                  <div className="pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle2 size={10} />
                      Approved! You can now create chapters.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

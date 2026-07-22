'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Layers, 
  CheckCircle2, 
  X, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { adminApi, StudioResponse } from '@/services/admin-api';
import { mangaApi } from '@/services/manga-api';
import { SeriesResponse, UpdateSeriesRequest, UpdateSeriesStatus } from '@/types/manga';
import ChapterManagement from './ChapterManagement';

type ProposalDecisionHistoryEntry = {
  seriesId: string;
  decision: 'Approved' | 'Rejected';
  decisionNote?: string;
  decidedAt: string;
};

const seriesStatusByName: Readonly<Record<string, UpdateSeriesStatus>> = {
  Draft: 1,
  Submitted: 2,
  Approved: 3,
  Ongoing: 4,
  Hiatus: 5,
  Cancelled: 6,
  Completed: 7,
  RevisionRequested: 8,
  Rejected: 9,
};

const isUpdateSeriesStatus = (value: number): value is UpdateSeriesStatus =>
  value >= 1 && value <= 9 && Number.isInteger(value);

const toUpdateSeriesStatus = (status: unknown): UpdateSeriesStatus => {
  if (typeof status === 'number' && isUpdateSeriesStatus(status)) {
    return status;
  }

  return typeof status === 'string' ? seriesStatusByName[status] ?? 1 : 1;
};

const getRequestErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const requestError = error as {
    message?: unknown;
    response?: { data?: { message?: unknown; error?: unknown } };
  };
  const apiMessage = requestError.response?.data?.message ?? requestError.response?.data?.error;

  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage;
  }

  return typeof requestError.message === 'string' && requestError.message.trim()
    ? requestError.message
    : fallback;
};

export function SeriesManagement() {
  // Data list states
  const [seriesList, setSeriesList] = useState<SeriesResponse[]>([]);
  const [studios, setStudios] = useState<StudioResponse[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection / Flow states
  const [selectedSeries, setSelectedSeries] = useState<SeriesResponse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);

  // Form states for creating Series
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [selectedStudioId, setSelectedStudioId] = useState('');
  
  // Form states for creating Studio
  const [isCreatingStudio, setIsCreatingStudio] = useState(false);
  const [newStudioName, setNewStudioName] = useState('');
  const [newStudioDesc, setNewStudioDesc] = useState('');

  // Edit Form states
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editStatus, setEditStatus] = useState<UpdateSeriesStatus>(1);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [decisionHistory, setDecisionHistory] = useState<ProposalDecisionHistoryEntry[]>([]);

  const fetchSeries = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await mangaApi.getSeries();
      if (res.data.success) {
        setSeriesList(res.data.data);
        setSelectedSeries((current) => current ? res.data.data.find((series) => series.id === current.id) ?? current : current);
      } else {
        setErrorMsg(res.data.message || 'Failed to fetch series list.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Could not load series list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudios = async () => {
    try {
      const res = await adminApi.listStudios();
      if (res.data.success) {
        setStudios(res.data.data);
        if (res.data.data.length > 0 && !selectedStudioId) {
          setSelectedStudioId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load studios', err);
    }
  };

  useEffect(() => {
    fetchSeries();
    fetchStudios();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };
  
  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Studio creation sub-flow
  const handleCreateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudioName.trim()) return;
    setActionLoading('create-studio');
    try {
      const res = await adminApi.createStudio({
        name: newStudioName.trim(),
        description: newStudioDesc.trim() || undefined
      });
      if (res.data.success) {
        const created = res.data.data;
        setStudios(prev => [...prev, created]);
        setSelectedStudioId(created.id);
        setIsCreatingStudio(false);
        setNewStudioName('');
        setNewStudioDesc('');
        triggerSuccess(`Studio "${created.name}" created successfully!`);
      } else {
        triggerError(res.data.message || 'Failed to create studio.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to create studio.');
    } finally {
      setActionLoading(null);
    }
  };

  // Series creation submit
  const handleCreateSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedStudioId) return;
    setActionLoading('create-series');
    try {
      const res = await adminApi.createSeries({
        studioId: selectedStudioId,
        title: title.trim(),
        description: description.trim() || undefined,
        genre: genre.trim() || undefined
      });
      if (res.data.success) {
        triggerSuccess(`Series "${title}" created successfully!`);
        setIsCreateModalOpen(false);
        setTitle('');
        setDescription('');
        setGenre('');
        fetchSeries();
      } else {
        triggerError(res.data.message || 'Failed to create series.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to create series.');
    } finally {
      setActionLoading(null);
    }
  };

  // Series update details submit
  const handleEditSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries) return;

    const nextTitle = editTitle.trim();
    const nextDescription = editDesc.trim();
    const nextGenre = editGenre.trim();
    const payload: UpdateSeriesRequest = {};

    if (!nextTitle) {
      triggerError('Series title is required.');
      return;
    }

    if (nextTitle !== selectedSeries.title) {
      payload.title = nextTitle;
    }
    if (nextDescription !== (selectedSeries.description ?? '')) {
      payload.description = nextDescription;
    }
    if (nextGenre !== (selectedSeries.genre ?? '')) {
      payload.genre = nextGenre;
    }
    if (editStatus !== toUpdateSeriesStatus(selectedSeries.status)) {
      payload.status = editStatus;
    }

    if (Object.keys(payload).length === 0) {
      setIsEditModalOpen(false);
      triggerSuccess('No series changes to save.');
      return;
    }

    setActionLoading('edit-series');
    try {
      const res = await mangaApi.updateSeries(selectedSeries.id, payload);
      if (res.data.success) {
        triggerSuccess('Series details updated successfully.');
        setIsEditModalOpen(false);
        await fetchSeries();
      } else {
        triggerError(res.data.message || 'Failed to update series.');
      }
    } catch (err: unknown) {
      triggerError(getRequestErrorMessage(err, 'Failed to update series.'));
    } finally {
      setActionLoading(null);
    }
  };

  // Submit series proposal
  const handleSubmitProposal = async (seriesId: string) => {
    setActionLoading(seriesId);
    try {
      const res = await mangaApi.submitProposal(seriesId);
      if (res.data.success) {
        triggerSuccess('Series proposal submitted for Editorial review!');
        fetchSeries();
      } else {
        triggerError(res.data.message || 'Failed to submit proposal.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to submit proposal.');
    } finally {
      setActionLoading(null);
    }
  };

  // Approve proposal
  const handleApproveProposal = async (seriesId: string) => {
    if (!confirm('Are you sure you want to APPROVE this series proposal?')) return;
    setActionLoading(seriesId);
    try {
      const note = decisionNote.trim() || undefined;
      const res = await mangaApi.approveProposal(seriesId, note ? { decisionNote: note } : {});
      if (res.data.success) {
        setDecisionHistory((previous) => [{ seriesId, decision: 'Approved', decisionNote: note, decidedAt: new Date().toISOString() }, ...previous]);
        setDecisionNote('');
        triggerSuccess('Series proposal approved successfully!');
        await fetchSeries();
      } else {
        triggerError(res.data.message || 'Failed to approve proposal.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to approve proposal.');
    } finally {
      setActionLoading(null);
    }
  };

  // Reject proposal
  const handleRejectProposal = async (seriesId: string) => {
    if (!confirm('Are you sure you want to REJECT this series proposal?')) return;
    setActionLoading(seriesId);
    try {
      const note = decisionNote.trim() || undefined;
      const res = await mangaApi.rejectProposal(seriesId, note ? { decisionNote: note } : {});
      if (res.data.success) {
        setDecisionHistory((previous) => [{ seriesId, decision: 'Rejected', decisionNote: note, decidedAt: new Date().toISOString() }, ...previous]);
        setDecisionNote('');
        triggerSuccess('Series proposal rejected.');
        await fetchSeries();
      } else {
        triggerError(res.data.message || 'Failed to reject proposal.');
      }
    } catch (err: any) {
      triggerError(err.response?.data?.message || err.message || 'Failed to reject proposal.');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Edit Modal
  const openEditModal = (series: SeriesResponse) => {
    setSelectedSeries(series);
    setEditTitle(series.title);
    setEditDesc(series.description || '');
    setEditGenre(series.genre || '');
    setEditStatus(toUpdateSeriesStatus(series.status));
    setIsEditModalOpen(true);
  };

  const selectedDecisionHistory = selectedSeries
    ? decisionHistory.filter((entry) => entry.seriesId === selectedSeries.id)
    : [];

  // Filter lists
  const filteredList = seriesList.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                          (s.genre && s.genre.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === '' || s.status === Number(statusFilter);
    return matchesSearch && matchesStatus;
  });

  const totalFiltered = filteredList.length;
  const paginatedList = filteredList.slice((page - 1) * pageSize, page * pageSize);
  const totalPageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Series List Column (Left) */}
      <div className="xl:col-span-2 space-y-6">
        {/* Banners */}
        {errorMsg && (
          <div className="flex items-start justify-between p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-450" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-455 hover:text-rose-300">Close</button>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-450" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-455 hover:text-emerald-300">Close</button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search by title or genre..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="1">Draft</option><option value="2">Submitted</option><option value="3">Approved</option><option value="4">Ongoing</option><option value="5">Hiatus</option><option value="6">Cancelled</option><option value="7">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-750 hover:bg-indigo-850 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              <Plus size={14} />
              Create Series
            </button>
            <button
              onClick={fetchSeries}
              disabled={loading}
              className="p-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-250 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Series Table List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/40 text-slate-450 border-b border-slate-850 font-bold">
                  <th className="p-4 uppercase tracking-wider text-[10px]">Series Metadata</th>
                  <th className="p-4 uppercase tracking-wider text-[10px]">Genre</th>
                  <th className="p-4 uppercase tracking-wider text-[10px]">Chapters</th>
                  <th className="p-4 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="p-4 uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {loading && seriesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                      <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading manga series...
                    </td>
                  </tr>
                ) : paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">
                      No manga series matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((s) => {
                    const isSelected = selectedSeries?.id === s.id;
                    const isDraft = s.status === 1;
                    const isSubmitted = s.status === 2;
                    
                    return (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedSeries(s)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-slate-850/10'
                        }`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-200 group-hover:text-white">{s.title}</div>
                          {s.description && (
                            <div className="text-[10px] text-slate-500 mt-1 font-semibold truncate max-w-xs">{s.description}</div>
                          )}
                        </td>
                        <td className="p-4 text-slate-300 font-semibold">{s.genre || 'N/A'}</td>
                        <td className="p-4 text-slate-400 font-mono font-bold">—</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            s.status === 4 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : isSubmitted 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                : isDraft
                                  ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(s)}
                              title="Edit Series Detail"
                              className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-250 transition-colors"
                            >
                              <Edit2 size={12} />
                            </button>
                            
                            {/* Proposal actions */}
                            {isDraft && (
                              <button
                                onClick={() => handleSubmitProposal(s.id)}
                                disabled={actionLoading === s.id}
                                className="px-2 py-1 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-600/20 rounded text-[10px] font-bold transition-all"
                              >
                                Submit Proposal
                              </button>
                            )}
                            
                            {isSubmitted && (
                              <>
                                <button
                                  onClick={() => handleApproveProposal(s.id)}
                                  disabled={actionLoading === s.id}
                                  title="Approve Proposal"
                                  className="p-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-450 border border-emerald-600/20 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                                >
                                  <ThumbsUp size={11} /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectProposal(s.id)}
                                  disabled={actionLoading === s.id}
                                  title="Reject Proposal"
                                  className="p-1 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/20 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                                >
                                  <ThumbsDown size={11} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPageCount > 1 && (
            <div className="p-4 bg-slate-950/25 border-t border-slate-850 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold font-mono">
                Total {totalFiltered} entries · Page {page} of {totalPageCount}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPageCount, p + 1))}
                  disabled={page === totalPageCount}
                  className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {(selectedSeries?.status === 2 || selectedDecisionHistory.length > 0) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            {selectedSeries?.status === 2 && <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Proposal decision</h3>
              <p className="text-[11px] text-slate-500 mt-1">Record the reason before approving or rejecting the selected proposal.</p>
            </div>}
            {selectedSeries?.status === 2 && <textarea
                aria-label="Proposal decision note"
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder="Decision note (optional)"
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />}
            {selectedDecisionHistory.length > 0 && (
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Decision history</h4>
                {selectedDecisionHistory.map((entry) => (
                  <div key={`${entry.decidedAt}-${entry.decision}`} className="flex items-start justify-between gap-3 text-[11px]">
                    <div>
                      <span className={entry.decision === 'Approved' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{entry.decision}</span>
                      {entry.decisionNote && <p className="text-slate-400 mt-0.5">{entry.decisionNote}</p>}
                    </div>
                    <time className="text-slate-600 shrink-0">{new Date(entry.decidedAt).toLocaleString()}</time>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chapters Column (Right) */}
      <div className="xl:col-span-1">
        {selectedSeries ? (
          <ChapterManagement 
            seriesId={selectedSeries.id} 
            seriesTitle={selectedSeries.title} 
            onChapterPublished={() => {
              fetchSeries();
            }}
          />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 h-96 flex flex-col justify-center items-center">
            <BookOpen size={32} className="text-slate-700 mb-3" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select a Series</h4>
            <p className="text-[11px] text-slate-550 mt-1 max-w-xs font-semibold leading-relaxed">
              Click any series row in the table to display its chapters, upload manuscript pages, and execute publishing actions.
            </p>
          </div>
        )}
      </div>

      {/* CREATE SERIES MODAL (with Studio Selection/Creation Flow) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 text-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-4">
              <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <Layers className="text-indigo-400" size={16} />
                Create Manga Series
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            {isCreatingStudio ? (
              // Create Studio Sub-Form
              <form onSubmit={handleCreateStudio} className="space-y-4">
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] text-indigo-400 font-semibold leading-relaxed">
                  A creator studio is required to publish manga. Create a new studio workspace first.
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Studio Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kyoto Production House"
                    value={newStudioName}
                    onChange={(e) => setNewStudioName(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief Kyoto studio info..."
                    value={newStudioDesc}
                    onChange={(e) => setNewStudioDesc(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsCreatingStudio(false)}
                    className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400 transition-colors"
                  >
                    Back to Selection
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create-studio'}
                    className="px-3 py-1.5 bg-indigo-750 hover:bg-indigo-850 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Save Studio Workspace
                  </button>
                </div>
              </form>
            ) : (
              // Main Series Form
              <form onSubmit={handleCreateSeriesSubmit} className="space-y-4">
                {/* Studio selector */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Owner Studio *</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingStudio(true)}
                      className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                    >
                      + Create New Studio
                    </button>
                  </div>
                  {studios.length === 0 ? (
                    <div className="p-3 border border-slate-800 rounded-lg bg-slate-950/40 text-center">
                      <p className="text-[10px] text-slate-500 font-semibold">No studios available.</p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingStudio(true)}
                        className="mt-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Create studio workspace
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedStudioId}
                      onChange={(e) => setSelectedStudioId(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      {studios.map(studio => (
                        <option key={studio.id} value={studio.id}>{studio.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Series Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silent Samurai"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. Action, Romance, Historical"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Manga series plot synopsis..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create-series' || !selectedStudioId}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-850 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Save Series
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT SERIES MODAL */}
      {isEditModalOpen && selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-4">
              <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <Edit2 className="text-indigo-400" size={16} />
                Edit Series: {selectedSeries.title}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSeriesSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Series Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Genre</label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(toUpdateSeriesStatus(Number(e.target.value)))}
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value={1}>Draft</option>
                  <option value={2}>Submitted</option>
                  <option value={3}>Approved</option>
                  <option value={4}>Ongoing</option>
                  <option value={5}>Hiatus</option>
                  <option value={6}>Cancelled</option>
                  <option value={7}>Completed</option>
                  <option value={8}>RevisionRequested</option>
                  <option value={9}>Rejected</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'edit-series'}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-850 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default SeriesManagement;

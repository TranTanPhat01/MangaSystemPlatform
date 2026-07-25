'use client';

import { useEffect, useState } from 'react';
import {
  CheckSquare, Plus, RefreshCw, AlertCircle, ChevronDown,
  User, Clock, Tag, CheckCircle2, RotateCcw, Send, XCircle
} from 'lucide-react';
import { authApi, AssistantDirectoryItem } from '@/services/auth-api';
import { mangaApi } from '@/services/manga-api';
import {
  ChapterResponse,
  CreateTaskRequest,
  PageResponse,
  AnnotationResponse,
  SeriesResponse,
  TaskPriority,
  TaskResponse,
  TaskStatus,
} from '@/types/manga';
import { isValidNonEmptyGuid } from '@/lib/guid';

interface MangakaTasksTabProps {
  triggerModal: (title: string, content: string) => void;
}

const TASK_STATUS_STYLE: Record<number, string> = {
  [TaskStatus.Todo]:             'bg-slate-500/10 text-slate-400 border-slate-500/20',
  [TaskStatus.InProgress]:       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  [TaskStatus.Submitted]:        'bg-amber-500/10 text-amber-400 border-amber-500/20',
  [TaskStatus.Approved]:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  [TaskStatus.RevisionRequired]: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const TASK_STATUS_LABEL: Record<number, string> = {
  [TaskStatus.Todo]:             'Todo',
  [TaskStatus.InProgress]:       'In Progress',
  [TaskStatus.Submitted]:        'Submitted',
  [TaskStatus.Approved]:         'Approved',
  [TaskStatus.RevisionRequired]: 'Revision Required',
};

export default function MangakaTasksTab({ triggerModal }: MangakaTasksTabProps) {
  // Hierarchical data
  const [series, setSeries]           = useState<SeriesResponse[]>([]);
  const [chapters, setChapters]       = useState<ChapterResponse[]>([]);
  const [pages, setPages]             = useState<PageResponse[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationResponse[]>([]);
  const [assistants, setAssistants]   = useState<AssistantDirectoryItem[]>([]);
  const [tasks, setTasks]             = useState<TaskResponse[]>([]);

  // Selections
  const [seriesId,         setSeriesId]     = useState('');
  const [chapterId,        setChapterId]    = useState('');
  const [pageId,           setPageId]       = useState('');
  const [annotationId,     setAnnotationId] = useState('');
  const [assignedToUserId, setAssigned]     = useState('');

  // Form
  const [title,  setTitle]  = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [deadline, setDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);

  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await mangaApi.getMyTasks();
      if (r.data.success) setTasks(r.data.data ?? []);
      else throw new Error(r.data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([mangaApi.getSeries(), authApi.getAssistants()])
      .then(async ([s, a]) => {
        if (s.data.success) setSeries(s.data.data ?? []);
        if (a.data.success) setAssistants(a.data.data ?? []);
        await refresh();
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    if (!isValidNonEmptyGuid(pageId) || !isValidNonEmptyGuid(annotationId) ||
        !isValidNonEmptyGuid(assignedToUserId) || !title.trim()) return;

    setActionLoading('create');
    setError(null);
    try {
      const r = await mangaApi.createTask({
        pageId, annotationId, assignedToUserId,
        title: title.trim(),
        priority,
        deadline: deadline || undefined,
      } as CreateTaskRequest);
      if (!r.data.success) throw new Error(r.data.message);
      setTitle(''); setPriority(TaskPriority.Medium); setDeadline(''); setAnnotationId(''); setShowCreateForm(false);
      flash('Task created and assigned successfully.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setActionLoading(null);
    }
  };

  const approve = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      const r = await mangaApi.approveTask(id);
      if (!r.data.success) throw new Error(r.data.message);
      flash('Task approved successfully.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setActionLoading(null);
    }
  };

  const revision = async (id: string) => {
    if (!reason.trim()) return;
    setActionLoading(id);
    setError(null);
    try {
      const r = await mangaApi.requestTaskRevision(id, { reason: reason.trim() });
      if (!r.data.success) throw new Error(r.data.message);
      setReason(''); setRevisionTargetId(null);
      flash('Revision requested.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revision failed');
    } finally {
      setActionLoading(null);
    }
  };

  const isFormValid = isValidNonEmptyGuid(pageId) && isValidNonEmptyGuid(annotationId) &&
                      isValidNonEmptyGuid(assignedToUserId) && title.trim().length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Task Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Assign tasks to assistants from page annotations. Review and approve submitted work.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus size={13} />
            {showCreateForm ? 'Cancel' : 'Assign New Task'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><XCircle size={13} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
          <CheckCircle2 size={13} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Plus size={14} className="text-indigo-400" />
            Assign New Task to Assistant
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Series */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Series</label>
              <div className="relative">
                <select
                  aria-label="Series"
                  value={seriesId}
                  onChange={async (e) => {
                    const id = e.target.value;
                    setSeriesId(id); setChapterId(''); setPageId(''); setAnnotationId('');
                    setChapters([]); setPages([]); setAnnotations([]);
                    if (id) {
                      const r = await mangaApi.getChapters(id);
                      if (r.data.success) setChapters(r.data.data ?? []);
                    }
                  }}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">— Select Series —</option>
                  {series.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chapter</label>
              <div className="relative">
                <select
                  aria-label="Chapter"
                  value={chapterId}
                  onChange={async (e) => {
                    const id = e.target.value;
                    setChapterId(id); setPageId(''); setAnnotationId('');
                    setPages([]); setAnnotations([]);
                    if (id) {
                      const r = await mangaApi.getPages(id);
                      if (r.data.success) setPages(r.data.data ?? []);
                    }
                  }}
                  disabled={!seriesId}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-40"
                >
                  <option value="">— Select Chapter —</option>
                  {chapters.map(x => <option key={x.id} value={x.id}>Ch.{x.chapterNumber}: {x.title || 'Untitled'}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Page */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Page</label>
              <div className="relative">
                <select
                  aria-label="Page"
                  value={pageId}
                  onChange={async (e) => {
                    const id = e.target.value;
                    setPageId(id); setAnnotationId(''); setAnnotations([]);
                    if (id) {
                      const r = await mangaApi.getPageAnnotations(id);
                      if (r.data.success) setAnnotations(r.data.data ?? []);
                    }
                  }}
                  disabled={!chapterId}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-40"
                >
                  <option value="">— Select Page —</option>
                  {pages.map(x => <option key={x.id} value={x.id}>Page {x.pageNumber}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Annotation */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Annotation Region</label>
              <div className="relative">
                <select
                  aria-label="Annotation"
                  value={annotationId}
                  onChange={(e) => setAnnotationId(e.target.value)}
                  disabled={!pageId}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-40"
                >
                  <option value="">— Select Annotation —</option>
                  {annotations.map(x => (
                    <option key={x.id} value={x.id}>[{x.type}] {x.description || x.notes || 'Region'}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Assign to */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assign To (Assistant)</label>
              <div className="relative">
                <select
                  aria-label="Assistant"
                  value={assignedToUserId}
                  onChange={(e) => setAssigned(e.target.value)}
                  className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">— Select Assistant —</option>
                  {assistants.map(x => <option key={x.id} value={x.id}>{x.fullName}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Task Title */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Title</label>
              <input
                aria-label="Task title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Translate panel text, Ink background…"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
              <select
                aria-label="Task priority"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) as TaskPriority)}
                className="w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value={TaskPriority.Low}>Low</option>
                <option value={TaskPriority.Medium}>Medium</option>
                <option value={TaskPriority.High}>High</option>
                <option value={TaskPriority.Urgent}>Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deadline</label>
              <input
                aria-label="Task deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => void create()}
              disabled={!isFormValid || actionLoading === 'create'}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {actionLoading === 'create' ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              Create & Assign Task
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare size={12} className="text-indigo-400" />
            All Tasks — Review & Manage
          </h2>
          <span className="text-[10px] font-bold text-slate-600">{tasks.length} task(s)</span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={18} className="animate-spin text-indigo-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading tasks…</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckSquare size={24} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No tasks yet.</p>
            <p className="text-xs text-slate-700 mt-1">Use the Page Editor to create annotations, then assign tasks to assistants.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {tasks.map(task => {
              const statusStyle = TASK_STATUS_STYLE[task.status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20';
              const statusLabel = TASK_STATUS_LABEL[task.status] ?? String(task.status);
              const isSubmitted = task.status === TaskStatus.Submitted;

              return (
                <div key={task.id} className="p-4 hover:bg-slate-850/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-200 truncate">{task.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-slate-600 font-semibold">
                        {task.assignedToUserId && (
                          <span className="flex items-center gap-1">
                            <User size={10} className="text-slate-700" />
                            Assistant assigned
                          </span>
                        )}
                        {task.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} className="text-slate-700" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Tag size={10} className="text-slate-700" />
                          Priority: {task.priority ?? 'Normal'}
                        </span>
                      </div>

                      {/* Latest submission */}
                      {task.latestSubmission && (
                        <div className="mt-2 p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Latest Submission</p>
                          <p className="text-xs text-slate-400 font-medium">
                            {task.latestSubmission.note || 'No note provided'}
                          </p>
                          {task.submissionHistory && task.submissionHistory.length > 1 && (
                            <p className="text-[9px] text-slate-600 mt-0.5">{task.submissionHistory.length} submission(s) total</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {isSubmitted && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => void approve(task.id)}
                          disabled={actionLoading === task.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === task.id ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                          Approve
                        </button>
                        <button
                          onClick={() => setRevisionTargetId(revisionTargetId === task.id ? null : task.id)}
                          disabled={actionLoading === task.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={10} />
                          Revise
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Revision reason input (inline) */}
                  {isSubmitted && revisionTargetId === task.id && (
                    <div className="mt-3 p-3 bg-slate-950/60 rounded-lg border border-amber-500/20 space-y-2">
                      <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider">Revision Reason</label>
                      <input
                        aria-label="Revision reason"
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain what needs to be fixed…"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setRevisionTargetId(null); setReason(''); }}
                          className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void revision(task.id)}
                          disabled={!reason.trim() || actionLoading === task.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === task.id ? <RefreshCw size={10} className="animate-spin" /> : <RotateCcw size={10} />}
                          Send Revision Request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

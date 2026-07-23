'use client';

import { FormEvent, useState, useEffect } from 'react';
import { ChevronRight, Eye, Plus, RefreshCw, Vote, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';
import { editorialApi } from '@/services/editorial-api';
import { mangaApi } from '@/services/manga-api';
import { CreateIssueRequest, IssueResponse, IssueStatus } from '@/types/editorial';
import { SeriesResponse } from '@/types/manga';
import ReaderVoteInputDialog from './ReaderVoteInputDialog';

interface IssueManagementProps {
  issues: IssueResponse[];
  canManage: boolean;
  onCreate: (data: CreateIssueRequest) => Promise<boolean>;
  onStatusChange: (issueId: string, status: IssueStatus) => Promise<boolean>;
  onRefresh: () => Promise<void>;
}

const STATUS_LABELS: Record<IssueStatus, string> = {
  [IssueStatus.Draft]: 'Draft',
  [IssueStatus.Scheduled]: 'Scheduled',
  [IssueStatus.Released]: 'Released',
  [IssueStatus.Archived]: 'Archived',
};
const STATUS_OPTIONS: IssueStatus[] = [IssueStatus.Draft, IssueStatus.Scheduled, IssueStatus.Released, IssueStatus.Archived];

function errorText(error: unknown) {
  const response = (error as { response?: { data?: { message?: unknown }; status?: number } }).response;
  if (response?.status === 403) return 'Bạn không có quyền xem issue này.';
  if (typeof response?.data?.message === 'string') return response.data.message;
  return 'Không thể tải chi tiết issue.';
}

export default function IssueManagement({ issues, canManage, onCreate, onStatusChange, onRefresh }: IssueManagementProps) {
  const [form, setForm] = useState({ issueNumber: '', title: '', releaseDate: '' });
  const [selected, setSelected] = useState<IssueResponse | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Vote Input Dialog state
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [targetIssueId, setTargetIssueId] = useState('');
  const [seriesList, setSeriesList] = useState<SeriesResponse[]>([]);
  const [calculatingIssueId, setCalculatingIssueId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const res = await mangaApi.getSeries();
        if (res.data?.success) {
          setSeriesList(res.data.data || []);
        }
      } catch (e) {
        console.error('Failed to load series for vote dialog:', e);
      }
    };
    void loadSeries();
  }, []);

  const flash = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.issueNumber.trim() || !form.title.trim() || !form.releaseDate) return;
    setSubmitting(true);
    if (await onCreate({ issueNumber: form.issueNumber.trim(), title: form.title.trim(), releaseDate: new Date(`${form.releaseDate}T00:00:00`).toISOString() })) {
      setForm({ issueNumber: '', title: '', releaseDate: '' });
      flash('Created new issue successfully.');
    }
    setSubmitting(false);
  };

  const showDetail = async (issueId: string) => {
    setDetailError(null);
    try {
      const response = await editorialApi.getIssue(issueId);
      if (!response.data.success) throw new Error(response.data.message || 'Issue detail failed.');
      setSelected(response.data.data);
    } catch (error: unknown) { setDetailError(errorText(error)); }
  };

  const openVoteDialog = (issueId: string) => {
    setTargetIssueId(issueId);
    setVoteDialogOpen(true);
  };

  const handleSaveReaderVote = async (seriesId: string, voteCount: number): Promise<boolean> => {
    if (!targetIssueId) return false;
    try {
      const res = await editorialApi.inputReaderVote(targetIssueId, { seriesId, voteCount });
      if (res.data?.success) {
        flash(`Saved ${voteCount} reader votes for series.`);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to save vote:', e);
      return false;
    }
  };

  const handleCalculateRanking = async (issueId: string) => {
    setCalculatingIssueId(issueId);
    try {
      const res = await editorialApi.calculateRanking(issueId);
      if (res.data?.success) {
        flash('Calculated rankings successfully!');
        await onRefresh();
      } else {
        setDetailError(res.data?.message || 'Failed to calculate rankings.');
      }
    } catch (e) {
      setDetailError('Error triggering ranking calculation.');
    } finally {
      setCalculatingIssueId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-800">Issue management</h2>
          <p className="text-xs text-slate-500 mt-1">Create publication issues, input reader votes, and calculate rankings.</p>
        </div>
        <button onClick={() => void onRefresh()} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh issues" aria-label="Refresh issues">
          <RefreshCw size={15} />
        </button>
      </div>

      {toastMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
          {toastMsg}
        </div>
      )}

      {canManage && (
        <form onSubmit={(event) => void submit(event)} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_auto] gap-3 p-4 bg-white rounded-xl border border-slate-200">
          <input aria-label="Issue number" value={form.issueNumber} onChange={event => setForm(previous => ({ ...previous, issueNumber: event.target.value }))} placeholder="Issue number (e.g. VOL-2026)" className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold" required />
          <input aria-label="Issue title" value={form.title} onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} placeholder="Title (e.g. Summer Issue #1)" className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold" required />
          <input aria-label="Release date" type="date" value={form.releaseDate} onChange={event => setForm(previous => ({ ...previous, releaseDate: event.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold" required />
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-bold text-white transition-colors disabled:opacity-50">
            <Plus size={15} />{submitting ? 'Creating...' : 'Create issue'}
          </button>
        </form>
      )}

      {!canManage && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 font-semibold">Read-only access. Creating and changing issues requires the EditorialBoard or Admin role.</p>}
      {detailError && <p role="alert" className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3 font-semibold">{detailError}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {issues.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 font-semibold">No issues have been created yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map(issue => (
              <div key={issue.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{issue.issueNumber} · {issue.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Release {new Date(issue.releaseDate).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canManage ? (
                    <select aria-label={`Status for ${issue.issueNumber}`} value={issue.status} onChange={event => void onStatusChange(issue.id, Number(event.target.value) as IssueStatus)} className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50">
                      {STATUS_OPTIONS.map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{STATUS_LABELS[issue.status]}</span>
                  )}

                  {canManage && (
                    <>
                      <button
                        onClick={() => openVoteDialog(issue.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Vote size={13} />
                        Input Votes
                      </button>
                      <button
                        onClick={() => void handleCalculateRanking(issue.id)}
                        disabled={calculatingIssueId === issue.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {calculatingIssueId === issue.id ? <RefreshCw size={13} className="animate-spin" /> : <BarChart2 size={13} />}
                        Calc Ranking
                      </button>
                    </>
                  )}

                  <button onClick={() => void showDetail(issue.id)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 px-2 py-1" title="View issue details">
                    <Eye size={14} />View<ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-200">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Issue detail</p>
              <h3 className="text-base font-black text-slate-800 mt-1">{selected.issueNumber} · {selected.title}</h3>
            </div>
            <button onClick={() => setSelected(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Close</button>
          </div>
          <dl className="grid grid-cols-3 gap-3 mt-4 text-xs font-semibold">
            <div><dt className="text-slate-500">Status</dt><dd className="font-bold text-slate-800 mt-1">{STATUS_LABELS[selected.status]}</dd></div>
            <div><dt className="text-slate-500">Release date</dt><dd className="font-bold text-slate-800 mt-1">{new Date(selected.releaseDate).toLocaleDateString()}</dd></div>
            <div><dt className="text-slate-500">Created</dt><dd className="font-bold text-slate-800 mt-1">{new Date(selected.createdAt).toLocaleDateString()}</dd></div>
          </dl>
        </div>
      )}

      {/* Reader Vote Input Dialog */}
      <ReaderVoteInputDialog
        isOpen={voteDialogOpen}
        onClose={() => setVoteDialogOpen(false)}
        series={seriesList}
        issueId={targetIssueId}
        onSubmit={handleSaveReaderVote}
      />
    </div>
  );
}
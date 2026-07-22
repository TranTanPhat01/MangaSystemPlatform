'use client';

import { FormEvent, useState } from 'react';
import { ChevronRight, Eye, Plus, RefreshCw } from 'lucide-react';
import { editorialApi } from '@/services/editorial-api';
import { CreateIssueRequest, IssueResponse, IssueStatus } from '@/types/editorial';

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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.issueNumber.trim() || !form.title.trim() || !form.releaseDate) return;
    setSubmitting(true);
    if (await onCreate({ issueNumber: form.issueNumber.trim(), title: form.title.trim(), releaseDate: new Date(`${form.releaseDate}T00:00:00`).toISOString() })) {
      setForm({ issueNumber: '', title: '', releaseDate: '' });
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

  return <div className="space-y-5">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-lg font-black text-slate-800">Issue management</h2><p className="text-xs text-slate-500 mt-1">Create publication issues and control their release lifecycle.</p></div>
      <button onClick={() => void onRefresh()} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Refresh issues" aria-label="Refresh issues"><RefreshCw size={15} /></button>
    </div>
    {canManage && <form onSubmit={(event) => void submit(event)} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_auto] gap-3 p-4 bg-white rounded-xl border border-slate-200">
      <input aria-label="Issue number" value={form.issueNumber} onChange={event => setForm(previous => ({ ...previous, issueNumber: event.target.value }))} placeholder="Issue number" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
      <input aria-label="Issue title" value={form.title} onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} placeholder="Title" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
      <input aria-label="Release date" type="date" value={form.releaseDate} onChange={event => setForm(previous => ({ ...previous, releaseDate: event.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
      <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-plum-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Plus size={15} />{submitting ? 'Creating...' : 'Create issue'}</button>
    </form>}
    {!canManage && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">Read-only access. Creating and changing issues requires the EditorialBoard or Admin role.</p>}
    {detailError && <p role="alert" className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{detailError}</p>}
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {issues.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No issues have been created yet.</p> : <div className="divide-y divide-slate-100">{issues.map(issue => <div key={issue.id} className="flex items-center gap-4 p-4">
        <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{issue.issueNumber} · {issue.title}</p><p className="text-xs text-slate-500 mt-1">Release {new Date(issue.releaseDate).toLocaleDateString()}</p></div>
        {canManage ? <select aria-label={`Status for ${issue.issueNumber}`} value={issue.status} onChange={event => void onStatusChange(issue.id, Number(event.target.value) as IssueStatus)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700">{STATUS_OPTIONS.map(status => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select> : <span className="text-xs font-semibold text-slate-600">{STATUS_LABELS[issue.status]}</span>}
        <button onClick={() => void showDetail(issue.id)} className="inline-flex items-center gap-1 text-xs font-bold text-plum-800 hover:text-plum-600" title="View issue details"><Eye size={14} />View<ChevronRight size={13} /></button>
      </div>)}</div>}
    </div>
    {selected && <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><div className="flex justify-between gap-3"><div><p className="text-xs uppercase tracking-wider font-bold text-slate-500">Issue detail</p><h3 className="text-base font-black text-slate-800 mt-1">{selected.issueNumber} · {selected.title}</h3></div><button onClick={() => setSelected(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Close</button></div><dl className="grid grid-cols-2 gap-3 mt-4 text-xs"><div><dt className="text-slate-500">Status</dt><dd className="font-bold text-slate-800 mt-1">{STATUS_LABELS[selected.status]}</dd></div><div><dt className="text-slate-500">Release date</dt><dd className="font-bold text-slate-800 mt-1">{new Date(selected.releaseDate).toLocaleDateString()}</dd></div><div><dt className="text-slate-500">Created</dt><dd className="font-bold text-slate-800 mt-1">{new Date(selected.createdAt).toLocaleDateString()}</dd></div></dl></div>}
  </div>;
}
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Search, ShieldCheck, Clock3 } from 'lucide-react';
import { adminApi, AdminAuditLogItem } from '@/services/admin-api';

const PAGE_SIZE = 8;

export function LogViewerTab() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | 'info' | 'warning' | 'error'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs({ page: 1, pageSize: PAGE_SIZE });
      if (res.data.success) {
        setLogs(res.data.data.items || []);
      } else {
        setError(res.data.message || 'Unable to load audit logs.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Could not reach the audit log endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const visibleLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const action = (log.action || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const matchesSearch = !query || action.includes(query) || details.includes(query);

      if (!matchesSearch) return false;

      if (level === 'all') return true;
      if (level === 'error') {
        return action.includes('error') || action.includes('fail') || action.includes('exception') || details.includes('error');
      }
      if (level === 'warning') {
        return action.includes('warn') || action.includes('warning') || details.includes('warn') || details.includes('warning');
      }
      return action.includes('info') || action.includes('login') || action.includes('create') || action.includes('update');
    });
  }, [logs, search, level]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Audit Trail</p>
          <h3 className="text-sm font-bold text-slate-200">Gateway security and administrative activity</h3>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-400">
            <Search size={13} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action or details"
              className="w-44 bg-transparent outline-none"
            />
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as 'all' | 'info' | 'warning' | 'error')}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] font-semibold text-slate-300"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-850 px-3 py-2 text-[11px] font-bold text-slate-300"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-[12px] text-rose-300">
          <AlertTriangle size={14} className="mt-0.5" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.6fr] border-b border-slate-800 bg-slate-950/70 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          <span>Action</span>
          <span>Level</span>
          <span>Timestamp</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[12px] text-slate-500">Loading audit logs…</div>
        ) : visibleLogs.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[12px] text-slate-500">No audit events matched the current filters.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {visibleLogs.map((log) => {
              const action = (log.action || '').toLowerCase();
              const levelBadge = action.includes('error') || action.includes('fail') || action.includes('exception')
                ? 'Error'
                : action.includes('warn') || action.includes('warning')
                  ? 'Warning'
                  : 'Info';

              return (
                <div key={log.id} className="grid grid-cols-[1.4fr_0.8fr_0.6fr] gap-3 px-4 py-3 text-[12px] text-slate-300">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-100">{log.action}</div>
                    {log.details ? <div className="text-[11px] text-slate-500">{log.details}</div> : null}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {levelBadge === 'Error' ? (
                      <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-rose-300">Error</span>
                    ) : levelBadge === 'Warning' ? (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-amber-300">Warning</span>
                    ) : (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">Info</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock3 size={12} />
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Audit logs are retrieved from the identity admin endpoint and filtered locally in the browser.</span>
        </div>
        <span>{visibleLogs.length} visible</span>
      </div>
    </div>
  );
}

export default LogViewerTab;

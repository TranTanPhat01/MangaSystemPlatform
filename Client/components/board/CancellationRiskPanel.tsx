'use client';

import React from 'react';
import { AlertTriangle, Pause, XCircle, Loader2, AlertCircle, TrendingDown } from 'lucide-react';
import { CancellationWarningResponse, RankingItemResponse } from '@/types/editorial';
import { SeriesResponse } from '@/types/manga';

interface Props {
  series: SeriesResponse[];
  selectedSeriesId: string;
  warnings: CancellationWarningResponse[];
  rankingHistory: RankingItemResponse[];
  isLoading: boolean;
  onSeriesChange: (id: string) => void;
  onStatusChange: (action: 'hiatus' | 'cancel') => Promise<boolean>;
}

const riskLabel: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };

const getRiskBadgeClass = (level: number | string): string => {
  const lvl = Number(level);
  if (lvl === 1) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (lvl === 2) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (lvl === 3) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (lvl === 4) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

export default function CancellationRiskPanel({
  series,
  selectedSeriesId,
  warnings,
  rankingHistory,
  isLoading,
  onSeriesChange,
  onStatusChange,
}: Props) {
  const selectedSeries = series.find((item) => item.id === selectedSeriesId);
  const activeWarnings = warnings.filter((item) => !item.isResolved);

  const handleStatusChange = async (action: 'hiatus' | 'cancel') => {
    if (!selectedSeriesId) return;
    if (action === 'cancel' && !window.confirm('Are you sure you want to cancel this series?')) return;
    await onStatusChange(action);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-5 border-b flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-slate-800">
            <AlertTriangle size={18} className="text-amber-600" />
            Cancellation Risk Review
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor warnings, ranking history, and publication status of series.
          </p>
        </div>
        <select
          aria-label="Series for cancellation review"
          value={selectedSeriesId}
          onChange={(e) => onSeriesChange(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-400"
        >
          <option value="">Select Series</option>
          {series.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      {!selectedSeriesId ? (
        <div className="p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-600 font-semibold">Select a series to view data</p>
        </div>
      ) : isLoading ? (
        <div className="p-8 flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-slate-400" size={20} />
          <p className="text-sm text-slate-500">Loading data...</p>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* Series info & actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Series</p>
              <h3 className="font-bold text-lg text-slate-800">{selectedSeries?.title || selectedSeriesId}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void handleStatusChange('hiatus')}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors"
              >
                <Pause size={14} />
                Set Hiatus
              </button>
              <button
                onClick={() => void handleStatusChange('cancel')}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-800 transition-colors"
              >
                <XCircle size={14} />
                Cancel Series
              </button>
            </div>
          </div>

          {/* Warnings */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              Active Cancellation Warnings ({activeWarnings.length})
            </h3>
            {activeWarnings.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <p className="text-sm text-emerald-700 font-semibold">No active warnings</p>
                <p className="text-xs text-emerald-600 mt-1">This series is performing well.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeWarnings.map((warning) => (
                  <div
                    key={warning.id}
                    className={`p-4 rounded-lg border flex items-start gap-3 ${getRiskBadgeClass(warning.riskLevel)}`}
                  >
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {riskLabel[warning.riskLevel as keyof typeof riskLabel] || 'Unknown'} Risk
                      </p>
                      <p className="text-xs mt-1 opacity-90">{warning.reason || 'Ranking concern'}</p>
                      {warning.createdAt && (
                        <p className="text-xs mt-2 opacity-75">
                          Created: {new Date(warning.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking history */}
          {rankingHistory.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <TrendingDown size={16} className="text-indigo-600" />
                Ranking Trend ({rankingHistory.length} periods)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Period</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Rank</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700">Votes</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-700">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankingHistory.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-600">Period {rankingHistory.length - idx}</td>
                        <td className="px-3 py-2 text-center font-semibold">#{item.rankPosition || '—'}</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {item.voteCount || 0}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-indigo-700">
                          {item.score || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

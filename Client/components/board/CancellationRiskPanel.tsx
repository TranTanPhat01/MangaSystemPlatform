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

const RankingLineChart = ({ data }: { data: RankingItemResponse[] }) => {
  if (!data || data.length === 0) return null;

  // Take up to 7 points, reverse to keep chronological order (oldest to newest)
  const chartPoints = [...data].slice(0, 7).reverse();
  const ranks = chartPoints.map(p => p.rankPosition || 1);
  const minRank = Math.min(...ranks);
  const maxRank = Math.max(...ranks);

  const range = maxRank - minRank;
  const padding = range === 0 ? 1 : range * 0.15;
  const yMin = Math.max(1, minRank - padding);
  const yMax = maxRank + padding;

  const width = 500;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = chartPoints.map((item, idx) => {
    const x = paddingX + (idx / (chartPoints.length - 1 || 1)) * chartWidth;
    const rank = item.rankPosition || 1;
    const y = paddingY + ((rank - yMin) / (yMax - yMin)) * chartHeight;
    return { x, y, rank, label: `P${idx + 1}` };
  });

  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }

  return (
    <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 my-4 select-none">
      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3 font-mono">Ranking History Trend Line</p>
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="3,3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#1e293b" strokeDasharray="3,3" />

          {/* Indigo trend line */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_6px_rgba(99,102,241,0.55)]"
            />
          )}

          {/* Dots and Rank tooltips */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#6366f1"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <text
                x={p.x}
                y={p.y - 9}
                textAnchor="middle"
                className="text-[10px] font-extrabold fill-slate-350 font-mono"
              >
                #{p.rank}
              </text>
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                className="text-[9px] font-bold fill-slate-300 font-mono"
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* Labels */}
          <text x={4} y={paddingY + 3} className="text-[9px] font-extrabold fill-emerald-500 font-mono">BEST</text>
          <text x={4} y={height - paddingY + 3} className="text-[9px] font-extrabold fill-rose-500 font-mono">WORST</text>
        </svg>
      </div>
    </div>
  );
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
  const [confirmAction, setConfirmAction] = React.useState<'hiatus' | 'cancel' | null>(null);
  const [confirmReason, setConfirmReason] = React.useState('');
  const [confirmError, setConfirmError] = React.useState<string | null>(null);

  const selectedSeries = series.find((item) => item.id === selectedSeriesId);
  const activeWarnings = warnings.filter((item) => !item.isResolved);
  const isCancelled = selectedSeries?.status === 6 || String(selectedSeries?.status) === 'Cancelled';
  const isHiatus = selectedSeries?.status === 5 || String(selectedSeries?.status) === 'Hiatus';

  const handleStatusChange = (action: 'hiatus' | 'cancel') => {
    setConfirmAction(action);
    setConfirmReason('');
    setConfirmError(null);
  };

  const handleConfirmSubmit = async () => {
    if (!confirmReason.trim()) {
      setConfirmError('Lý do thực hiện hành động không được để trống.');
      return;
    }
    if (confirmAction) {
      await onStatusChange(confirmAction);
      setConfirmAction(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-5 border-b flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-slate-800">
            <AlertTriangle size={18} className="text-amber-600" />
            Cancellation Risk Review
          </h2>
          <p className="text-xs text-slate-700 mt-1">
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
          <p className="text-sm text-slate-700">Loading data...</p>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* Series info & actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-xs uppercase text-slate-700 font-semibold mb-1">Series</p>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800">{selectedSeries?.title || selectedSeriesId}</h3>
                {isCancelled && (
                  <span className="bg-rose-105 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold border border-rose-200">
                    Cancelled
                  </span>
                )}
                {isHiatus && (
                  <span className="bg-amber-105 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold border border-amber-200">
                    Hiatus
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={isCancelled || isHiatus}
                onClick={() => void handleStatusChange('hiatus')}
                className={`inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors ${
                  (isCancelled || isHiatus) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Pause size={14} />
                Set Hiatus
              </button>
              <button
                disabled={isCancelled}
                onClick={() => void handleStatusChange('cancel')}
                className={`inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-800 transition-colors ${
                  isCancelled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
                <p className="text-xs text-emerald-700 mt-1">This series is performing well.</p>
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
              <RankingLineChart data={rankingHistory} />
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

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-200">
            <h3 className="text-sm font-bold text-slate-250">
              Xác nhận thay đổi trạng thái Series
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn chuyển series sang trạng thái{' '}
              <span className="text-amber-500 font-extrabold">
                {confirmAction === 'hiatus' ? 'Tạm ngưng (Hiatus)' : 'Hủy bỏ (Cancel)'}
              </span>
              ? Hành động này sẽ tạm dừng hoặc hủy các tác vụ liên quan.
            </p>
            
            <div className="space-y-1.5 text-left">
              <label htmlFor="confirm-reason" className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Lý do thực hiện hành động:
              </label>
              <textarea
                id="confirm-reason"
                rows={3}
                value={confirmReason}
                onChange={(e) => {
                  setConfirmReason(e.target.value);
                  setConfirmError(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                placeholder="Nhập lý do chi tiết..."
              />
              {confirmError && (
                <p className="text-[10px] text-rose-500 font-medium">{confirmError}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3.5 py-2 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800/40 rounded-lg text-xs font-bold transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-700/10"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

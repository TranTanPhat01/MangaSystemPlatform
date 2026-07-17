import React from 'react';
import { clsx } from 'clsx';
import { Trophy, ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { RankingResponse } from '@/types/editorial';
import { RANKINGS as MOCK_RANKINGS } from '@/data/mock/board.mock';

interface RankingTableProps {
  rankings: RankingResponse[];
  onRecalculate: () => Promise<void>;
  isLoading: boolean;
}

function trendIcon(curr: number, prev: number | undefined) {
  if (!prev) return <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10px] font-bold"><Minus size={11} />—</span>;
  if (curr < prev) return <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] font-bold"><ArrowUp size={11} />+{prev - curr}</span>;
  if (curr > prev) return <span className="inline-flex items-center gap-0.5 text-rose-500 text-[10px] font-bold"><ArrowDown size={11} />-{curr - prev}</span>;
  return <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10px] font-bold"><Minus size={11} />—</span>;
}

export default function RankingTable({ rankings, onRecalculate, isLoading }: RankingTableProps) {
  const useMock = rankings.length === 0;

  // Format data dynamically
  const displayData = useMock
    ? MOCK_RANKINGS.map((r, i) => ({
        id: `mock-${i}`,
        seriesId: `mock-s-${i}`,
        seriesTitle: r.title,
        rank: r.rank,
        previousRank: r.prevRank,
        readerVotes: r.votes,
        trend: (r.rank < r.prevRank ? 'Up' : r.rank > r.prevRank ? 'Down' : 'Same') as any,
        isMock: true,
        risk: r.riskLevel,
      }))
    : rankings.map((r) => ({
        id: r.id,
        seriesId: r.seriesId,
        seriesTitle: r.seriesTitle || 'Unknown',
        rank: r.rank,
        previousRank: r.previousRank,
        readerVotes: r.readerVotes,
        trend: r.trend,
        isMock: false,
        risk: r.rank >= 18 ? 'Critical' : r.rank >= 12 ? 'High' : r.rank >= 7 ? 'Medium' : 'Low',
      }));

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Trophy size={15} className="text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Bảng xếp hạng Reader Voting</h2>
              {useMock && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  ⚠ Mock Data
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Kỳ phát hành mới nhất</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRecalculate}
            disabled={isLoading}
            className="text-[10px] font-bold text-slate-655 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            <span>Tính BXH</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60 text-[9px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-100">
              <th className="px-5 py-3">Hạng</th>
              <th className="px-5 py-3">Series</th>
              <th className="px-5 py-3">Tổng phiếu</th>
              <th className="px-5 py-3">Xu hướng</th>
              <th className="px-5 py-3">Rủi ro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayData.map((row) => (
              <tr
                key={row.id}
                className={clsx(
                  'hover:bg-slate-50/50 transition-colors',
                  (row.risk === 'High' || row.risk === 'Critical') && 'bg-rose-50/30'
                )}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black',
                        row.rank === 1 ? 'bg-amber-100 text-amber-700' :
                        row.rank === 2 ? 'bg-slate-100 text-slate-600' :
                        row.rank === 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-slate-50 text-slate-500'
                      )}
                    >
                      {row.rank}
                    </span>
                    {trendIcon(row.rank, row.previousRank)}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-xs font-bold text-slate-800">{row.seriesTitle}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold text-slate-700">{row.readerVotes.toLocaleString()}</span>
                </td>
                <td className="px-5 py-3.5">
                  {row.trend === 'Up' ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <TrendingUp size={12} />Tăng
                    </span>
                  ) : row.trend === 'Down' ? (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                      <TrendingDown size={12} />Giảm
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                      <Minus size={12} />Ổn định
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={clsx(
                      'text-[9px] font-bold px-2 py-1 rounded-lg border',
                      row.risk === 'Critical' && 'bg-red-100 text-red-700 border-red-200',
                      row.risk === 'High' && 'bg-orange-100 text-orange-700 border-orange-200',
                      row.risk === 'Medium' && 'bg-amber-100 text-amber-700 border-amber-200',
                      row.risk === 'Low' && 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    )}
                  >
                    {row.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

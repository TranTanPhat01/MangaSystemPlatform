import React from 'react';
import { TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface RankingRiskCardProps {
  series: string;
  currentRank: number;
  previousRank: number;
  riskLevel: 'Low' | 'Medium' | 'High' | string;
  onViewRanking: () => void;
}

export default function RankingRiskCard({
  series,
  currentRank,
  previousRank,
  riskLevel,
  onViewRanking,
}: RankingRiskCardProps) {
  const getRiskBadgeStyles = () => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return 'bg-red-50 text-red-750 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const rankDiff = currentRank - previousRank; // Positive number means rank dropped (numerically higher is worse rank)

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Award size={16} className="text-plum-700" />
            <span>Publishing Ranking Alert</span>
          </h3>
          <span className={clsx(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-sm",
            getRiskBadgeStyles()
          )}>
            {riskLevel} Risk
          </span>
        </div>

        {/* Series info */}
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Manga Series</span>
          <h4 className="text-base font-bold text-slate-800 mt-0.5">{series}</h4>
        </div>

        {/* Ranks Display Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg mb-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-6 w-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-red-550 shadow-sm">
              <TrendingDown size={14} />
            </div>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Previous</span>
            <p className="text-xl font-bold text-slate-500 font-mono mt-0.5">#{previousRank}</p>
          </div>

          <div className="text-center border-l border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-450 uppercase">Current</span>
            <p className="text-xl font-extrabold text-burgundy-900 font-mono mt-0.5">#{currentRank}</p>
          </div>
        </div>

        {/* Warning Indicator */}
        {rankDiff > 0 && (
          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50/50 border border-amber-100/50 p-2.5 rounded-lg mb-4 font-medium">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Dropped <span className="font-bold">{rankDiff} places</span> in editorial group rankings since last evaluation.
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={onViewRanking}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-plum-900 bg-plum-50 border border-plum-200/80 hover:bg-plum-100 active:bg-plum-200 transition-all duration-150 shadow-sm"
      >
        <span>View Ranking History</span>
      </button>
    </div>
  );
}

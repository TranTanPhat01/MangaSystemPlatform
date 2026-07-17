import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import RankingRiskCard from './RankingRiskCard';
import { RANKING_BOARD } from '@/data/mock/mangaka.mock';

interface MangakaRankingsTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaRankingsTab({ triggerModal }: MangakaRankingsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manga Group Popularity Rankings</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Calculated from editorial metrics, reader polls, and distribution data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <RankingRiskCard
            series="Crimson Days"
            currentRank={18}
            previousRank={13}
            riskLevel="Medium"
            onViewRanking={() => triggerModal("Ranking History: Crimson Days", "Crimson Days started serialization at Rank #8, reached a peak of #4, but has dropped over the last 3 weeks due to slower narrative pacing. Editorial board suggestions: Increase action beats in upcoming chapters.")}
          />
        </div>

        <div className="md:col-span-2 bg-white border border-slate-150 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-50">Ranking Board Summary</h3>
          <div className="space-y-3 font-semibold text-xs">
            {RANKING_BOARD.map((rnk, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                <span className="text-slate-800 font-bold">{rnk.title}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-655 font-mono">{rnk.rank}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-0.5 ${rnk.class}`}>
                    {rnk.trend === 'up' && <TrendingUp size={10} />}
                    {rnk.trend === 'down' && <TrendingDown size={10} />}
                    {rnk.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

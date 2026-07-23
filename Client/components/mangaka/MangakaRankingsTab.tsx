'use client';

import React from 'react';
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMangakaRankings } from '@/hooks/useMangakaRankings';

interface MangakaRankingsTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaRankingsTab({ triggerModal }: MangakaRankingsTabProps) {
  const {
    issues,
    selectedIssueId,
    rankings,
    loading,
    loadingRanking,
    error,
    handleIssueChange,
  } = useMangakaRankings();

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-350">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manga Group Popularity Rankings</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Track your series ranking across all publications.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" size={24} />
          <p className="ml-3 text-slate-500">Loading ranking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manga Group Popularity Rankings</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Track your series ranking across all publications.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-rose-600 flex-shrink-0" size={16} />
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {issues.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-xl p-8 text-center shadow-sm">
          <p className="text-slate-600 font-semibold">No ranking data available.</p>
          <p className="text-sm text-slate-500 mt-1">Rankings will appear once issues are published.</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-sm">
            <label className="text-xs font-bold text-slate-700 block mb-2">Select Issue:</label>
            <select
              value={selectedIssueId}
              onChange={(e) => void handleIssueChange(e.target.value)}
              className="w-full text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded px-3 py-2 focus:outline-none focus:border-indigo-400"
            >
              {issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.issueNumber} - {issue.title}
                </option>
              ))}
            </select>
          </div>

          {loadingRanking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-slate-400" size={20} />
              <p className="ml-2 text-slate-500 text-sm">Loading rankings...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="bg-white border border-slate-150 rounded-xl p-6 text-center shadow-sm">
              <p className="text-slate-600 font-semibold">No rankings calculated yet.</p>
              <p className="text-sm text-slate-500 mt-1">Wait for rankings to be calculated by the editorial board.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-150">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-slate-700">Rank</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-700">Series</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-700">Votes</th>
                      <th className="text-center px-4 py-3 font-bold text-slate-700">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankings.map((ranking) => (
                      <tr
                        key={ranking.seriesId}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => triggerModal(
                          ranking.seriesTitle,
                          `Rank: #${ranking.rank}\nTotal Votes: ${ranking.votes}\nTrend: ${ranking.trend}`
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                            {ranking.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {ranking.seriesTitle}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 font-semibold">
                          {ranking.votes.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ranking.trend === 'up' && (
                            <TrendingUp size={16} className="inline text-emerald-600" />
                          )}
                          {ranking.trend === 'down' && (
                            <TrendingDown size={16} className="inline text-rose-600" />
                          )}
                          {ranking.trend === 'stable' && (
                            <Minus size={16} className="inline text-slate-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

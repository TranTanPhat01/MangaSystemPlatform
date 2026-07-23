'use client';

import React from 'react';
import { RefreshCw, Trophy, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2, Plus } from 'lucide-react';
import { IssueResponse, RankingItemResponse } from '@/types/editorial';
import { SeriesResponse } from '@/types/manga';
import ReaderVoteInputDialog from './ReaderVoteInputDialog';

interface Props {
  issues: IssueResponse[];
  series: SeriesResponse[];
  selectedIssueId: string;
  rankings: RankingItemResponse[];
  isLoading: boolean;
  onIssueChange: (id: string) => void;
  onReaderVote: (seriesId: string, voteCount: number) => Promise<boolean>;
  onRecalculate: () => Promise<void>;
  onRetry: () => Promise<void>;
}

export default function RankingTable({
  issues,
  series,
  selectedIssueId,
  rankings,
  isLoading,
  onIssueChange,
  onReaderVote,
  onRecalculate,
  onRetry,
}: Props) {
  const [voteSeriesId, setVoteSeriesId] = React.useState('');
  const [voteCount, setVoteCount] = React.useState('');
  const [voteSubmitting, setVoteSubmitting] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const getSeriesTitle = (seriesId: string) => {
    return series.find(s => s.id === seriesId)?.title || seriesId;
  };

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voteSeriesId || !voteCount) return;
    
    setVoteSubmitting(true);
    const success = await onReaderVote(voteSeriesId, Number(voteCount));
    if (success) {
      setVoteSeriesId('');
      setVoteCount('');
    }
    setVoteSubmitting(false);
  };

  const getRiskColor = (riskLevel: string | number): string => {
    const level = String(riskLevel).toLowerCase();
    if (level === 'low' || level === '1') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (level === 'medium' || level === '2') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (level === 'high' || level === '3') return 'bg-orange-50 text-orange-700 border-orange-200';
    if (level === 'critical' || level === '4') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-emerald-600" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-rose-600" />;
    return <Minus size={14} className="text-slate-400" />;
  };

  return (
    <>
      <ReaderVoteInputDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        series={series}
        onSubmit={onReaderVote}
        issueId={selectedIssueId}
      />
      <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-5 border-b flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h2 className="font-bold flex gap-2 items-center text-slate-800">
            <Trophy size={18} className="text-amber-600" />
            Reader Voting Rankings
          </h2>
          <p className="text-xs text-slate-500 mt-1">Select an issue to view real ranking data.</p>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Publication issue"
            value={selectedIssueId}
            onChange={(e) => onIssueChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-400"
          >
            <option value="">Select Issue</option>
            {issues.map((issue) => (
              <option key={issue.id} value={issue.id}>
                {issue.issueNumber} — {issue.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsDialogOpen(true)}
            disabled={!selectedIssueId || isLoading}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            Input Vote
          </button>
          <button
            onClick={() => void onRecalculate()}
            disabled={!selectedIssueId || isLoading}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {isLoading ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Calculate Ranking
          </button>
        </div>
      </div>

      {selectedIssueId && (
        <form onSubmit={handleVoteSubmit} className="p-4 flex gap-2 border-b bg-slate-50">
          <select
            aria-label="Reader vote series"
            value={voteSeriesId}
            onChange={(e) => setVoteSeriesId(e.target.value)}
            required
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-400"
          >
            <option value="">Select Series</option>
            {series.map((item) => (
              <option value={item.id} key={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <input
            aria-label="Reader vote count"
            type="number"
            min="0"
            required
            value={voteCount}
            onChange={(e) => setVoteCount(e.target.value)}
            placeholder="Vote count"
            className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            disabled={isLoading || voteSubmitting}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {voteSubmitting ? 'Saving...' : 'Save Vote'}
          </button>
        </form>
      )}

      {!selectedIssueId ? (
        <div className="p-8 text-center">
          <Trophy size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-600 font-semibold">Select an issue to load rankings</p>
        </div>
      ) : isLoading ? (
        <div className="p-8 flex items-center justify-center gap-3">
          <Loader2 className="animate-spin text-slate-400" size={20} />
          <p className="text-sm text-slate-500">Loading rankings...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-600 font-semibold">No ranking data available</p>
          <p className="text-xs text-slate-500 mt-1">This issue hasn&apos;t been calculated yet.</p>
          <button
            onClick={() => void onRetry()}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700">Rank</th>
                <th className="px-4 py-3 font-bold text-slate-700">Series Title</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">Votes</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-center">Trend</th>
                <th className="px-4 py-3 font-bold text-slate-700">Risk Level</th>
                <th className="px-4 py-3 font-bold text-slate-700 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.map((item, index) => (
                <tr key={item.seriesId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {getSeriesTitle(item.seriesId)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 font-semibold">
                    {item.voteCount || 0}
                  </td>
                  <td className="px-4 py-3 text-center flex justify-center">
                    {getTrendIcon(item.trend || 'stable')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${getRiskColor(item.riskLevel)}`}>
                      {item.riskLevel || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-700">
                    {item.score || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    </>
  );
}

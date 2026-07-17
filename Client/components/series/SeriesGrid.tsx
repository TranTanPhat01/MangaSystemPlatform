import React from 'react';
import { BookOpen, Calendar, Star, Send } from 'lucide-react';
import { SeriesResponse } from '@/types/manga';
import SeriesStatusBadge from './SeriesStatusBadge';

interface SeriesGridProps {
  seriesList: SeriesResponse[];
  onSubmitProposal: (id: string) => Promise<void>;
  submittingId: string | null;
}

export default function SeriesGrid({
  seriesList,
  onSubmitProposal,
  submittingId,
}: SeriesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {seriesList.map((series) => (
        <div 
          key={series.id}
          className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-250 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <SeriesStatusBadge status={series.status} />
              <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                <Star size={12} className="text-amber-500" fill="currentColor" />
                <span>4.8</span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-200 mb-1">{series.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{series.genre || 'Manga Series'}</p>
            {series.description && (
              <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                {series.description}
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800/60 py-3 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <BookOpen size={14} className="text-slate-500" />
                <span>{series.chapterCount} Chapters</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar size={14} className="text-slate-500" />
                <span className="capitalize">{series.frequency || 'Weekly'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-slate-500">
              Updated: {new Date(series.updatedAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-3">
              {series.status === 'Draft' && (
                <button
                  onClick={() => onSubmitProposal(series.id)}
                  disabled={submittingId === series.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 font-semibold border border-indigo-500/20 transition-all"
                  title="Submit Proposal to Editorial Board"
                >
                  {submittingId === series.id ? (
                    <div className="h-3 w-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  <span>Submit Proposal</span>
                </button>
              )}
              <button 
                onClick={() => alert(`Redirecting to manage details for ${series.title}`)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
              >
                Manage Details &rarr;
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

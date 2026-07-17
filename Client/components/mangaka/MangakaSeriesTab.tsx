import React from 'react';
import { Plus, AlertTriangle, BookOpen } from 'lucide-react';
import { SeriesResponse } from '@/types/manga';

interface MangakaSeriesTabProps {
  seriesError: string | null;
  seriesLoading: boolean;
  series: SeriesResponse[];
  fetchSeries: () => void;
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaSeriesTab({
  seriesError,
  seriesLoading,
  series,
  fetchSeries,
  triggerModal,
}: MangakaSeriesTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Serialization Series</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Manage active manga titles, demographic metadata, and settings.</p>
        </div>
        <button 
          onClick={() => triggerModal("New Series Creation", "Initialize a brand-new manga series. Add outlines, story themes, character dossiers, and configure creative pipelines.")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-900 active:bg-burgundy-950 transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>New Series</span>
        </button>
      </div>

      {/* Error State */}
      {seriesError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">Failed to load series</p>
            <p className="text-xs text-red-600 mt-0.5">{seriesError}</p>
          </div>
          <button onClick={fetchSeries} className="text-xs font-bold text-red-600 hover:text-red-800 underline shrink-0">Retry</button>
        </div>
      )}

      {/* Loading State */}
      {seriesLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
              <div className="h-6 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Real API Data */}
      {!seriesLoading && !seriesError && series.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {series.map((item) => (
            <div key={item.id} className="bg-white border border-slate-150 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/50">
                    {item.genre || 'Manga'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Chapters: <span className="font-bold text-slate-700">{item.chapterCount}</span></p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  item.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  item.status === 'Hiatus' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  item.status === 'Completed' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                  'bg-slate-100 text-slate-655 border-slate-200'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Frequency</span>
                  <p className="text-sm font-bold text-burgundy-900 mt-0.5">{item.frequency || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Last Updated</span>
                  <p className="text-xs font-bold text-slate-750 mt-1">{new Date(item.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerModal(`Open Workspace: ${item.title}`, `Opening creative board for "${item.title}".`)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Workspace
                </button>
                <button
                  onClick={() => triggerModal(`Edit: ${item.title}`, `Configuring metadata for "${item.title}".`)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-900 rounded-lg transition-colors"
                >
                  Edit Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!seriesLoading && !seriesError && series.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-150 rounded-xl shadow-sm">
          <BookOpen size={36} className="text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-600">No series yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create your first manga series to get started.</p>
          <button
            onClick={() => triggerModal("New Series Creation", "Initialize a brand-new manga series.")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-900 transition-colors"
          >
            <Plus size={13} /> New Series
          </button>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { CHAPTERS } from '@/data/mock/mangaka.mock';

interface MangakaChaptersTabProps {
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaChaptersTab({ triggerModal }: MangakaChaptersTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 font-sans">Chapter Release Management</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Track editorial reviews, storyboarding, script status, and release phases.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-150 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Filter Series:</span>
          <select className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none">
            <option>Blue Moon</option>
            <option>Crimson Days</option>
            <option>Twilight Hunt</option>
          </select>
        </div>

        <div className="divide-y divide-slate-100">
          {CHAPTERS.map((item, i) => (
            <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/40">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded bg-burgundy-50 border border-burgundy-100 flex items-center justify-center font-mono font-bold text-burgundy-900 text-xs shrink-0">
                  {item.ch.replace('Chapter ', '')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{item.ch}: {item.title}</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Release Date: {item.date} • Pages: {item.pages}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.badge}`}>
                  {item.status}
                </span>
                <button 
                  onClick={() => triggerModal(`View Chapter Details: ${item.ch}`, `Opening chapter dashboard for "${item.ch}: ${item.title}". View page sequence files, editor suggestions, and task timeline.`)}
                  className="text-xs font-bold text-burgundy-855 hover:text-burgundy-950 px-2 py-1 rounded bg-burgundy-50/50 hover:bg-burgundy-100/50 transition-colors"
                >
                  Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

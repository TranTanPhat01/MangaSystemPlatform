import React from 'react';
import { clsx } from 'clsx';
import { RotateCcw, Wrench, Download } from 'lucide-react';
import { REVISIONS } from '@/data/mock/assistant.mock';

export default function AssistantRevisionPanel() {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <RotateCcw size={15} className="text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Revision Requests</h2>
            <p className="text-[10px] text-slate-400 font-medium">Feedback từ Mangaka cần xử lý ngay</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full animate-pulse">
          {REVISIONS.length} pending
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {REVISIONS.map(rev => (
          <div key={rev.id} className="px-6 py-5 hover:bg-rose-50/20 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-800">{rev.taskTitle}</p>
                  <span
                    className={clsx(
                      'text-[9px] font-bold px-2 py-0.5 rounded-full border',
                      rev.severity === 'High'
                        ? 'text-rose-700 bg-rose-50 border-rose-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    )}
                  >
                    {rev.severity} Priority
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-400">
                  {rev.series} · {rev.chapter} · by {rev.mangaka}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">New Deadline</p>
                <p className="text-[10px] font-black text-rose-600 mt-0.5">{rev.newDeadline}</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 mb-4">
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-wider mb-1">Editor Feedback</p>
              <p className="text-[10px] font-medium text-slate-700 leading-relaxed">{rev.feedback}</p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-[0_2px_8px_rgba(225,29,72,0.25)] transition-colors">
                <Wrench size={11} />Open Revision
              </button>
              <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                <Download size={11} />Reference
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

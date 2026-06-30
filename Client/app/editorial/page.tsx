'use client';

import React from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { FileText, Award, ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';

const mockReviews = [
  { id: 1, series: 'Shadow Syndicate', chapter: 'Ch 43 Draft', author: 'Eiichiro Oda', status: 'Pending Review', submittedAt: 'May 23, 2026' },
  { id: 2, series: 'Whisper of the Wind', chapter: 'Ch 19 Final', author: 'Oda Sensei', status: 'Approved', submittedAt: 'May 21, 2026' },
];

export default function EditorialPage() {
  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Editorial Operations</h1>
            <p className="text-xs text-slate-500 font-medium">Review submitted manuscripts, process rankings, and collaborate with creators.</p>
          </div>
        </div>

        {/* Editorial Sub-sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review Queue */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Manuscripts Review Queue</h3>
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden divide-y divide-slate-800/60">
              {mockReviews.map((review) => (
                <div key={review.id} className="p-5 hover:bg-slate-900/20 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{review.series} - {review.chapter}</h4>
                      <p className="text-xs text-slate-500">Submitted by {review.author} on {review.submittedAt}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      review.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-4 justify-end">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/50 transition-colors">
                      <MessageSquare size={12} />
                      Comment
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors">
                      <ThumbsUp size={12} />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rankings Panel */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Popularity Rankings</h3>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800/60">
                <div className="h-7 w-7 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">1</div>
                <div>
                  <h4 className="font-bold text-slate-200 text-xs">Shadow Syndicate</h4>
                  <p className="text-[10px] text-slate-500">4,285 votes this week</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800/60">
                <div className="h-7 w-7 rounded bg-slate-500/10 border border-slate-500/20 text-slate-400 flex items-center justify-center font-bold text-xs font-mono">2</div>
                <div>
                  <h4 className="font-bold text-slate-350 text-xs">Whisper of the Wind</h4>
                  <p className="text-[10px] text-slate-500">3,120 votes this week</p>
                </div>
              </div>

              <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[11px] text-slate-450 leading-relaxed">
                <span className="font-bold text-indigo-400 block mb-1">Rankings Calculated</span>
                Weekly stats are synced dynamically based on consumer review logs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}

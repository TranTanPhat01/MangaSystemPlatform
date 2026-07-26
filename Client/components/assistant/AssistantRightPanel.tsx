'use client';

import React from 'react';
import { Shield, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

export default function AssistantRightPanel() {
  return (
    <aside className="w-72 bg-white rounded-xl border border-slate-150 p-5 shrink-0 hidden lg:block space-y-5">
      {/* Profile info card */}
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
        <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-sm font-bold text-indigo-700 mx-auto uppercase">
          KJ
        </div>
        <h4 className="font-extrabold text-slate-800 text-sm mt-3.5">Kenji Sasaki</h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
          Assistant Artist
        </p>
        <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800">
          Studio Member
        </span>
      </div>

      {/* Quick Guidelines */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <BookOpen size={13} className="text-indigo-600" />
          <span>Studio Guidelines</span>
        </h4>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-2">
            <Shield size={12} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed font-semibold text-slate-600">
              <span className="font-bold text-slate-800">Format Standards:</span> Use PSD templates with structured layers for lines, screen tones, and coloring.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed font-semibold text-slate-600">
              <span className="font-bold text-slate-800">Review Timings:</span> Revisions must be uploaded within 24 hours of requests.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles size={12} className="text-plum-500 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed font-semibold text-slate-600">
              <span className="font-bold text-slate-800">Resolution:</span> Export draft pages at 350 DPI or final prints at 600 DPI.
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}

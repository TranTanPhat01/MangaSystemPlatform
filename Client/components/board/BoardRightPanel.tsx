'use client';

import React from 'react';
import { Gavel, ClipboardList, ShieldAlert, CheckSquare } from 'lucide-react';

export default function BoardRightPanel() {
  return (
    <aside className="w-72 bg-white rounded-xl border border-slate-150 p-5 shrink-0 hidden lg:block space-y-5">
      {/* Session Header */}
      <div className="bg-indigo-900 text-white rounded-lg p-4 text-center shadow-sm">
        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2 text-indigo-200">
          <Gavel size={18} />
        </div>
        <h4 className="font-extrabold text-xs tracking-wide uppercase">Editorial Board</h4>
        <p className="text-[10px] text-indigo-200 mt-0.5">Session 2026/Q2</p>
      </div>

      {/* Decisions checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <ClipboardList size={13} className="text-indigo-600" />
          <span>Decision Checklist</span>
        </h4>
        
        <ul className="space-y-2.5 text-[10px] leading-relaxed font-semibold text-slate-600">
          <li className="flex items-start gap-2">
            <CheckSquare size={12} className="text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Quorum:</span> Voting requires a minimum quorum before decisions are finalized.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckSquare size={12} className="text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Publication:</span> Set appropriate Weekly/Monthly slots upon proposal approvals.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <ShieldAlert size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Risks:</span> Series with critical warnings will be reviewed for publication hiatus.
            </div>
          </li>
        </ul>
      </div>
    </aside>
  );
}

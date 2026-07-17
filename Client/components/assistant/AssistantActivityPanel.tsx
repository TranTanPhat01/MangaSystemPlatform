import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, Clock } from 'lucide-react';
import { ACTIVITY } from '@/data/mock/assistant.mock';
import { ActivityItem } from '@/types/assistant';

function activityDot(type: ActivityItem['type']) {
  switch (type) {
    case 'approved':  return 'bg-emerald-500';
    case 'assigned':  return 'bg-indigo-500';
    case 'revision':  return 'bg-rose-500';
    case 'upload':    return 'bg-amber-500';
  }
}

export default function AssistantActivityPanel() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <TrendingUp size={15} className="text-slate-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
          <p className="text-[9px] font-medium text-slate-400">Hoạt động 7 ngày gần nhất</p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {ACTIVITY.map(a => (
          <div key={a.id} className="flex items-start gap-3">
            <div className={clsx('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', activityDot(a.type))} />
            <div className="flex-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
              <p className="text-xs font-bold text-slate-800">{a.message}</p>
              {a.series && (
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">{a.series}</p>
              )}
              <p className="text-[9px] font-medium text-slate-300 mt-1 flex items-center gap-1">
                <Clock size={10} />{a.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

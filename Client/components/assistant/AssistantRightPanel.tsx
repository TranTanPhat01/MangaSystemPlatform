import React from 'react';
import { clsx } from 'clsx';
import { CalendarClock, Flame, BarChart3, TrendingUp, Bell, Zap, ImagePlus } from 'lucide-react';
import { DEADLINES, ACTIVITY } from '@/data/mock/assistant.mock';
import { ActivityItem } from '@/types/assistant';

function activityDot(type: ActivityItem['type']) {
  switch (type) {
    case 'approved':  return 'bg-emerald-500';
    case 'assigned':  return 'bg-indigo-500';
    case 'revision':  return 'bg-rose-500';
    case 'upload':    return 'bg-amber-500';
  }
}

export default function AssistantRightPanel() {
  return (
    <aside className="w-72 shrink-0 flex flex-col gap-5">
      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <CalendarClock size={14} className="text-rose-600" />
          </div>
          <p className="text-xs font-bold text-slate-700">Upcoming Deadlines</p>
        </div>
        <div className="space-y-2.5">
          {DEADLINES.map((d, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-center justify-between p-2.5 rounded-xl border',
                d.urgent
                  ? 'bg-rose-50 border-rose-100'
                  : 'bg-slate-50 border-slate-100'
              )}
            >
              <div>
                <p className="text-[11px] font-bold text-slate-800">{d.task}</p>
                <p className="text-[9px] font-medium text-slate-400">{d.series}</p>
              </div>
              <div className="text-right">
                <span
                  className={clsx(
                    'text-[9px] font-black',
                    d.urgent ? 'text-rose-600' : 'text-slate-500'
                  )}
                >
                  {d.due}
                </span>
                {d.urgent && (
                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    <Flame size={9} className="text-rose-500" />
                    <span className="text-[8px] font-bold text-rose-500">Urgent</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Productivity chart placeholder */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <BarChart3 size={14} className="text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-700">Weekly Productivity</p>
        </div>
        {/* Chart bars */}
        <div className="flex items-end gap-1.5 h-20 mb-2">
          {[60, 85, 45, 90, 70, 55, 80].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400 transition-all duration-500"
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between px-0.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[8px] font-bold text-slate-400 flex-1 text-center">{d}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-[10px] font-medium text-slate-400">This week</span>
          <span className="text-[11px] font-black text-indigo-700 flex items-center gap-1">
            <TrendingUp size={11} />
            +12% vs last week
          </span>
        </div>
      </div>

      {/* Notification summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <Bell size={14} className="text-amber-600" />
          </div>
          <p className="text-xs font-bold text-slate-700">Notifications</p>
          <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">5 new</span>
        </div>
        <div className="space-y-2.5">
          {ACTIVITY.slice(0, 3).map(a => (
            <div key={a.id} className="flex items-start gap-2.5">
              <span className={clsx('h-2 w-2 rounded-full mt-1.5 shrink-0', activityDot(a.type))} />
              <div>
                <p className="text-[10px] font-bold text-slate-700">{a.message}</p>
                <p className="text-[9px] font-medium text-slate-400">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-3 w-full py-2 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
          View all notifications
        </button>
      </div>

      {/* Quick Upload */}
      <div className="bg-gradient-to-br from-[#0E0A1C] to-violet-950 rounded-2xl p-5 text-white shadow-[0_4px_24px_rgba(79,70,229,0.2)]">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-violet-300" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Quick Upload</p>
        </div>
        <p className="text-xs font-black leading-snug mb-1">Drop your finished artwork</p>
        <p className="text-[9px] font-medium text-white/50 leading-relaxed mb-4">
          Upload PSD / PNG submissions directly for the selected task. Max 100MB per file.
        </p>
        <div className="border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-violet-400/50 transition-colors cursor-pointer group">
          <ImagePlus size={22} className="text-white/30 group-hover:text-violet-300 transition-colors" />
          <p className="text-[10px] font-bold text-white/50 group-hover:text-white/80 transition-colors">
            Click or drag file here
          </p>
        </div>
        <button className="mt-3 w-full py-2 rounded-xl bg-indigo-600 border border-indigo-500 text-white text-[10px] font-bold hover:bg-indigo-500 transition-colors">
          Select Task & Upload
        </button>
      </div>
    </aside>
  );
}

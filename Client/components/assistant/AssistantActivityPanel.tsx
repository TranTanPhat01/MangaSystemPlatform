'use client';

import React from 'react';
import { Play, Upload, CheckCircle2, RotateCcw, MessageSquare } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'start' | 'upload' | 'approve' | 'revision' | 'comment';
  message: string;
  time: string;
  color: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'upload',
    message: 'Uploaded line art submission for Chapter 4 - Page 12',
    time: '2 hours ago',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    icon: Upload,
  },
  {
    id: '2',
    type: 'revision',
    message: 'Mangaka requested revisions on Chapter 4 - Page 9',
    time: '5 hours ago',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    icon: RotateCcw,
  },
  {
    id: '3',
    type: 'approve',
    message: 'Mangaka approved Screentones on Chapter 3 - Page 4',
    time: 'Yesterday',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    icon: CheckCircle2,
  },
  {
    id: '4',
    type: 'comment',
    message: 'New layout annotation added on Chapter 4 - Page 10',
    time: '2 days ago',
    color: 'text-plum-600 bg-plum-50 border-plum-100',
    icon: MessageSquare,
  },
];

export default function AssistantActivityPanel() {
  return (
    <section className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <h3 className="text-sm font-bold text-slate-800">Recent Activity Timeline</h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Log</span>
      </div>

      <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-5">
        {mockActivities.map((act) => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="relative group">
              {/* Timeline marker icon */}
              <span className={`absolute -left-[27px] top-0.5 rounded-full p-1 border flex items-center justify-center ${act.color}`}>
                <Icon size={11} className="stroke-[2.5]" />
              </span>

              {/* Event card content */}
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors leading-tight">
                  {act.message}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  {act.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

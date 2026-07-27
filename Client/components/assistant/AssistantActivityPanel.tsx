'use client';

import React from 'react';
import { Bell, CheckCircle2, Loader2, MessageSquare, RotateCcw, Upload } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

function iconForNotification(type: string) {
  if (type.includes('1') || type.toLowerCase().includes('assign')) return Upload;
  if (type.includes('2') || type.toLowerCase().includes('submit')) return MessageSquare;
  if (type.includes('3') || type.toLowerCase().includes('approv')) return CheckCircle2;
  if (type.includes('revision')) return RotateCcw;
  return Bell;
}

export default function AssistantActivityPanel() {
  const { notifications, loading, error } = useNotifications();

  return (
    <section className="bg-white rounded-xl border border-slate-150 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <h3 className="text-sm font-bold text-slate-800">Recent Activity Timeline</h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Log</span>
      </div>
      {loading && <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Loading activity…</div>}
      {!loading && error && <p className="py-6 text-center text-xs font-semibold text-rose-600">{error}</p>}
      {!loading && !error && notifications.length === 0 && <p className="py-6 text-center text-xs font-semibold text-slate-500">No activity recorded for this account.</p>}
      {!loading && !error && notifications.length > 0 && (
        <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-5">
          {notifications.slice(0, 6).map((activity) => {
            const Icon = iconForNotification(activity.type);
            return (
              <div key={activity.id} className="relative">
                <span className="absolute -left-[27px] top-0.5 rounded-full p-1 border border-indigo-100 bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Icon size={11} />
                </span>
                <p className="text-xs font-bold text-slate-800 leading-tight">{activity.title}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">{activity.message}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

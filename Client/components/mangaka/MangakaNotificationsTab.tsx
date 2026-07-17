import React from 'react';
import { NOTIFICATIONS } from '@/data/mock/mangaka.mock';

export default function MangakaNotificationsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Studio Notifications</h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">Alerts, chat notifications, and workflow status messages.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-xl shadow-sm divide-y divide-slate-100">
        {NOTIFICATIONS.map((notif, i) => (
          <div key={i} className={`p-4 flex items-start gap-3 hover:bg-slate-50/50 ${notif.unread ? 'bg-burgundy-50/10' : ''}`}>
            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${notif.unread ? 'bg-burgundy-700 animate-pulse' : 'bg-slate-200'}`} />
            <div className="flex-1">
              <div className="flex justify-between items-start gap-3 text-xs font-bold text-slate-800">
                <h4>{notif.title}</h4>
                <span className="text-[10px] text-slate-400 font-semibold shrink-0">{notif.time}</span>
              </div>
              <span className="text-[10px] font-bold text-burgundy-800/80 mt-1 inline-block uppercase tracking-wider">
                {notif.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

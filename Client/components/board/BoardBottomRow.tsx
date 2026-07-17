import React from 'react';
import { clsx } from 'clsx';
import { Calendar, History, Clock, ShieldAlert } from 'lucide-react';
import { PublicationScheduleResponse } from '@/types/editorial';
import { SCHEDULE as MOCK_SCHEDULE, DECISIONS } from '@/data/mock/board.mock';
import { DecisionItem } from '@/types/board';

interface BoardBottomRowProps {
  schedules: PublicationScheduleResponse[];
}

function decisionDot(type: DecisionItem['type']) {
  const map: Record<DecisionItem['type'], string> = {
    approve: 'bg-emerald-500',
    cancel: 'bg-red-500',
    revision: 'bg-amber-500',
    change: 'bg-indigo-500',
  };
  return map[type];
}

export default function BoardBottomRow({ schedules }: BoardBottomRowProps) {
  const useMock = schedules.length === 0;

  const displaySchedules = useMock
    ? MOCK_SCHEDULE.map((s, i) => ({
        id: `mock-${i}`,
        title: s.title,
        chapter: s.chapter,
        type: s.type,
        date: s.date,
        isMock: true,
      }))
    : schedules.map((s) => ({
        id: s.id,
        title: s.seriesTitle || 'Unknown Series',
        chapter: s.notes || 'Chapter Production',
        type: s.publicationType,
        date: new Date(s.scheduledDate).toLocaleDateString(),
        isMock: false,
      }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Publication Schedule */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Calendar size={15} className="text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Lịch xuất bản sắp tới</h3>
                {useMock && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                    <ShieldAlert size={8} />
                    Mock Data
                  </span>
                )}
              </div>
              <p className="text-[9px] font-medium text-slate-400">Kỳ phát hành sắp tới</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {displaySchedules.map((item) => (
            <div key={item.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0',
                  item.type === 'Weekly' ? 'bg-indigo-600' : item.type === 'Monthly' ? 'bg-plum-700' : 'bg-amber-600'
                )}>
                  {item.title.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.title}</p>
                  <p className="text-[9px] font-medium text-slate-400">{item.chapter}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={clsx(
                  'text-[9px] font-bold px-2 py-0.5 rounded-full border',
                  item.type === 'Weekly' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
                  item.type === 'Monthly' ? 'text-plum-700 bg-plum-50 border-plum-200' :
                  'text-amber-700 bg-amber-50 border-amber-200'
                )}>{item.type}</span>
                <p className="text-[9px] font-bold text-slate-400 mt-1">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Decisions Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <History size={15} className="text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">Quyết định gần đây</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                <ShieldAlert size={8} />
                Mock Data
              </span>
            </div>
            <p className="text-[9px] font-medium text-slate-400">Hoạt động hội đồng 7 ngày qua</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {DECISIONS.map((d, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={clsx('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', decisionDot(d.type))} />
              <div className="flex-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <p className="text-xs font-bold text-slate-800">{d.action}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  <span className="font-bold text-slate-700">{d.series}</span> · {d.by}
                </p>
                <p className="text-[9px] font-medium text-slate-300 mt-1 flex items-center gap-1">
                  <Clock size={10} />{d.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

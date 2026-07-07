import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface DeadlineItem {
  id: string;
  title: string;
  subtitle: string;
  dueText: string;
  isUrgent?: boolean;
  type?: 'chapter' | 'page' | 'background' | 'outline' | string;
}

interface DeadlineListProps {
  deadlines: DeadlineItem[];
}

export default function DeadlineList({ deadlines }: DeadlineListProps) {
  const getDeadlineStyle = (item: DeadlineItem) => {
    const due = item.dueText.toLowerCase();
    if (due.includes('today') || item.isUrgent) {
      return {
        border: 'border-l-burgundy-700 bg-burgundy-50/20',
        dot: 'bg-burgundy-700',
        text: 'text-burgundy-900',
        badge: 'bg-burgundy-100 text-burgundy-800'
      };
    }
    if (due.includes('tomorrow')) {
      return {
        border: 'border-l-amber-500 bg-amber-50/20',
        dot: 'bg-amber-500',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-850'
      };
    }
    return {
      border: 'border-l-plum-500 bg-plum-50/10',
      dot: 'bg-plum-500',
      text: 'text-plum-905',
      badge: 'bg-plum-50 text-plum-700 border-plum-100'
    };
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4 pb-1 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-burgundy-700" />
            <span>Upcoming Deadlines</span>
          </h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
            {deadlines.length} tasks
          </span>
        </div>

        <div className="space-y-3">
          {deadlines.map((item) => {
            const styles = getDeadlineStyle(item);
            const isToday = item.dueText.toLowerCase().includes('today');

            return (
              <div
                key={item.id}
                className={clsx(
                  "p-3.5 border border-slate-100 border-l-4 rounded-lg flex items-center justify-between transition-all hover:bg-slate-50 duration-150 shadow-sm",
                  styles.border
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx("h-2.5 w-2.5 rounded-full shrink-0 animate-pulse", styles.dot)} />
                  <div>
                    <h4 className="font-bold text-sm text-slate-700 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-550 mt-1 font-medium">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isToday && (
                    <AlertCircle size={14} className="text-burgundy-700 shrink-0" />
                  )}
                  <span className={clsx("text-xs font-bold px-2 py-0.5 rounded border border-transparent", styles.badge)}>
                    {item.dueText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-slate-50 text-center">
        <button className="text-xs font-bold text-burgundy-800 hover:text-burgundy-950 transition-colors uppercase tracking-wider">
          View Full Editorial Schedule →
        </button>
      </div>
    </div>
  );
}

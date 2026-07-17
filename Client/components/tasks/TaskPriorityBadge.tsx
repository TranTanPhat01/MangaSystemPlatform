import React from 'react';
import { TaskPriority } from '@/types/manga';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

export default function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const getStyle = () => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Low':
        return 'bg-slate-800 text-slate-400 border border-slate-700/60';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700/60';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getStyle()}`}>
      {priority}
    </span>
  );
}

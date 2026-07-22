import React from 'react';
import { TaskStatus } from '@/types/manga';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const getStyle = () => {
    switch (status) {
      case TaskStatus.Todo:
        return 'bg-slate-800 text-slate-400 border border-slate-700/60';
      case TaskStatus.InProgress:
        return 'bg-indigo-650/10 text-indigo-400 border border-indigo-500/20';
      case TaskStatus.Submitted:
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      case TaskStatus.Approved:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case TaskStatus.RevisionRequired:
        return 'bg-rose-500/10 text-rose-455 border border-rose-500/20';
      case TaskStatus.Cancelled:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getLabel = () => {
    if (status === TaskStatus.Todo) return 'To do';
    if (status === TaskStatus.InProgress) return 'In Progress';
    if (status === TaskStatus.RevisionRequired) return 'Revision Required';
    return TaskStatus[status];
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getStyle()}`}>
      {getLabel()}
    </span>
  );
}

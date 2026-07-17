import React from 'react';
import { TaskStatus } from '@/types/manga';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const getStyle = () => {
    switch (status) {
      case 'Pending':
        return 'bg-slate-800 text-slate-400 border border-slate-700/60';
      case 'InProgress':
        return 'bg-indigo-650/10 text-indigo-400 border border-indigo-500/20';
      case 'Submitted':
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'RevisionRequired':
        return 'bg-rose-500/10 text-rose-455 border border-rose-500/20';
      case 'Cancelled':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getLabel = () => {
    if (status === 'InProgress') return 'In Progress';
    if (status === 'RevisionRequired') return 'Revision Required';
    return status;
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getStyle()}`}>
      {getLabel()}
    </span>
  );
}

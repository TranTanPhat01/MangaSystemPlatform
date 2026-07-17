import React from 'react';
import { SeriesStatus } from '@/types/manga';

interface SeriesStatusBadgeProps {
  status: SeriesStatus;
}

export default function SeriesStatusBadge({ status }: SeriesStatusBadgeProps) {
  const getStyle = () => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Draft':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Hiatus':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Completed':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-455 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${getStyle()}`}>
      {status}
    </span>
  );
}

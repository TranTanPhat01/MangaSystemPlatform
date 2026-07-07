import React from 'react';
import { clsx } from 'clsx';

export type StatusType = 
  | 'Submitted' 
  | 'In Progress' 
  | 'Revision Required' 
  | 'Approved' 
  | 'Overdue'
  | string;

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const getStyleClasses = () => {
    switch (normalizedStatus) {
      case 'submitted':
        return 'bg-plum-50 text-plum-700 border-plum-200/85';
      case 'in progress':
        return 'bg-amber-50 text-amber-700 border-amber-200/85';
      case 'revision required':
        return 'bg-burgundy-50 text-burgundy-700 border-burgundy-200/85';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/85';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200/85';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/85';
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors duration-150 shadow-sm',
        getStyleClasses()
      )}
    >
      <span className={clsx(
        'h-1.5 w-1.5 rounded-full shrink-0',
        normalizedStatus === 'submitted' && 'bg-plum-500',
        normalizedStatus === 'in progress' && 'bg-amber-500',
        normalizedStatus === 'revision required' && 'bg-burgundy-600',
        normalizedStatus === 'approved' && 'bg-emerald-500',
        normalizedStatus === 'overdue' && 'bg-red-500',
        !['submitted', 'in progress', 'revision required', 'approved', 'overdue'].includes(normalizedStatus) && 'bg-slate-400'
      )} />
      {status}
    </span>
  );
}

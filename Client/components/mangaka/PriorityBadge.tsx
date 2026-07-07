import React from 'react';
import { clsx } from 'clsx';

export type PriorityType = 
  | 'Urgent' 
  | 'High' 
  | 'Medium' 
  | 'Low'
  | string;

interface PriorityBadgeProps {
  priority: PriorityType;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const normalizedPriority = priority.toLowerCase();

  const getStyleClasses = () => {
    switch (normalizedPriority) {
      case 'urgent':
        return 'bg-burgundy-900 text-white border-burgundy-950 font-bold';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200/85';
      case 'medium':
        return 'bg-plum-50 text-plum-700 border-plum-200/85';
      case 'low':
        return 'bg-slate-50 text-slate-600 border-slate-250';
      default:
        return 'bg-slate-55 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border shadow-sm transition-colors duration-150',
        getStyleClasses()
      )}
    >
      {priority}
    </span>
  );
}

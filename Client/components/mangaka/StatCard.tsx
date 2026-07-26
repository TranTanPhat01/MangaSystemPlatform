import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlightColor?: 'burgundy' | 'plum' | 'teal' | 'amber' | 'default';
}

const colorMap = {
  burgundy: {
    iconBg: 'bg-burgundy-50 border-burgundy-100/60',
    iconText: 'text-burgundy-700',
    glow: 'shadow-[0_0_20px_rgba(107,29,47,0.08)]',
    accent: 'from-burgundy-600 to-burgundy-800',
    valueFg: 'text-burgundy-900',
  },
  plum: {
    iconBg: 'bg-plum-50 border-plum-100/60',
    iconText: 'text-plum-700',
    glow: 'shadow-[0_0_20px_rgba(88,28,135,0.08)]',
    accent: 'from-plum-600 to-plum-800',
    valueFg: 'text-plum-900',
  },
  teal: {
    iconBg: 'bg-teal-50 border-teal-100/60',
    iconText: 'text-teal-700',
    glow: 'shadow-[0_0_20px_rgba(13,148,136,0.08)]',
    accent: 'from-teal-500 to-teal-700',
    valueFg: 'text-teal-900',
  },
  amber: {
    iconBg: 'bg-amber-50 border-amber-100/60',
    iconText: 'text-amber-700',
    glow: 'shadow-[0_0_20px_rgba(217,119,6,0.08)]',
    accent: 'from-amber-500 to-amber-700',
    valueFg: 'text-amber-900',
  },
  default: {
    iconBg: 'bg-slate-50 border-slate-100',
    iconText: 'text-slate-500',
    glow: '',
    accent: 'from-slate-400 to-slate-600',
    valueFg: 'text-slate-800',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  highlightColor = 'default',
}: StatCardProps) {
  const c = colorMap[highlightColor];

  return (
    <div className={clsx(
      'relative bg-white rounded-2xl p-5 overflow-hidden',
      'border border-slate-100/80',
      'shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
      'hover:-translate-y-0.5 transition-all duration-300 group',
      c.glow
    )}>
      {/* Top gradient accent bar */}
      <div className={clsx('absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r opacity-80', c.accent)} />

      {/* Faint icon watermark in background */}
      <div className="absolute -right-3 -bottom-3 opacity-[0.04] pointer-events-none">
        <Icon size={80} />
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className={clsx(
          'h-10 w-10 rounded-xl border flex items-center justify-center shrink-0',
          'transition-transform duration-300 group-hover:scale-110',
          c.iconBg, c.iconText
        )}>
          <Icon size={19} className="stroke-[2]" />
        </div>
        {trend && (
          <span className={clsx(
            'flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-1 rounded-full border',
            trend.isPositive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-rose-50 text-rose-600 border-rose-100'
          )}>
            {trend.isPositive
              ? <TrendingUp size={10} />
              : <TrendingDown size={10} />}
            {trend.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className={clsx('text-3xl font-black tabular-nums tracking-tight', c.valueFg)}>
          {value}
        </p>
      </div>

      {/* Description */}
      {description && (
        <p className="text-[10px] font-semibold text-slate-700 mt-2 leading-snug">
          {description}
        </p>
      )}
    </div>
  );
}

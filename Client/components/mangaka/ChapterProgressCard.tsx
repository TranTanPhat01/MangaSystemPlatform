import React from 'react';
import { Clock, FileText, CheckCircle, ArrowUpRight, Send } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';

interface ChapterProgressCardProps {
  series: string;
  chapter: string;
  deadlineText: string;
  deadlineUrgency?: 'critical' | 'warning' | 'normal';
  coverUrl?: string;
  status?: string;
  progress: number;
  pagesCompleted: number;
  pagesTotal: number;
  tasksApproved: number;
  tasksTotal: number;
  onOpen: () => void;
  onSubmit: () => void;
}

const RING_RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function ChapterProgressCard({
  series,
  chapter,
  deadlineText,
  deadlineUrgency = 'warning',
  coverUrl,
  status = 'In Progress',
  progress,
  pagesCompleted,
  pagesTotal,
  tasksApproved,
  tasksTotal,
  onOpen,
  onSubmit,
}: ChapterProgressCardProps) {
  const dashOffset = CIRCUMFERENCE * (1 - progress / 100);

  const urgencyClasses = {
    critical: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
    warning:  'bg-amber-50 text-amber-700 border-amber-200',
    normal:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col h-full">

      {/* ── Cover + ring header ── */}
      <div className="relative h-40 bg-gradient-to-br from-[#1a0a10] to-[#2d1420] overflow-hidden flex-shrink-0">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={series}
            fill
            sizes="100%"
            className="object-cover opacity-50"
          />
        )}
        {/* overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Series badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white backdrop-blur-sm">
            {series}
          </span>
        </div>

        {/* Deadline badge */}
        <div className={clsx(
          'absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold backdrop-blur-sm',
          urgencyClasses[deadlineUrgency]
        )}>
          <Clock size={10} />
          {deadlineText}
        </div>

        {/* Chapter name + status at bottom */}
        <div className="absolute bottom-3 left-3 right-24">
          <p className="text-white font-black text-base leading-tight drop-shadow">{chapter}</p>
          <span className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-plum-600/80 text-white text-[9px] font-bold border border-plum-400/30">
            {status}
          </span>
        </div>

        {/* SVG Progress Ring */}
        <div className="absolute bottom-2 right-3 flex items-center justify-center">
          <svg width="88" height="88" viewBox="0 0 96 96" className="-rotate-90">
            {/* Track */}
            <circle
              cx="48" cy="48" r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <circle
              cx="48" cy="48" r={RING_RADIUS}
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#be185d" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-white font-black text-base leading-none">{progress}%</span>
            <span className="text-white/50 text-[8px] font-bold mt-0.5">Done</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col p-5 gap-4">

        {/* Progress bars */}
        <div className="space-y-3">
          {/* Storyboard / pages */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText size={11} className="text-plum-500" />
                <span className="text-[11px] font-bold text-slate-600">Trang truyện</span>
              </div>
              <span className="text-[11px] font-bold text-slate-800">
                {pagesCompleted} <span className="text-slate-400 font-medium">/ {pagesTotal}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-plum-500 to-burgundy-600 transition-all duration-700"
                style={{ width: `${(pagesCompleted / pagesTotal) * 100}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={11} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-600">Tasks</span>
              </div>
              <span className="text-[11px] font-bold text-slate-800">
                {tasksApproved} <span className="text-slate-400 font-medium">/ {tasksTotal}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                style={{ width: `${(tasksApproved / tasksTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 mt-auto pt-1">
          <button
            onClick={onOpen}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 group/btn"
          >
            <span>Mở Chapter</span>
            <ArrowUpRight size={13} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-burgundy-800 to-burgundy-950 hover:from-burgundy-700 hover:to-burgundy-900 shadow-[0_4px_12px_rgba(107,29,47,0.25)] hover:shadow-[0_4px_16px_rgba(107,29,47,0.4)] transition-all duration-200 active:scale-[0.98] group/btn"
          >
            <Send size={11} className="transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
            <span>Nộp Editorial</span>
          </button>
        </div>
      </div>
    </div>
  );
}

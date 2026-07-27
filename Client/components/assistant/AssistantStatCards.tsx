'use client';

import React from 'react';
import { clsx } from 'clsx';
import { CheckSquare, Play, Upload, CheckCircle2, DollarSign } from 'lucide-react';
import { TaskResponse, TaskStatus } from '@/types/manga';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  sub: string;
}

function KpiCard({ label, value, icon: Icon, color, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', color)}>
          <Icon size={19} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{label}</p>
      <p className="text-[9px] font-medium text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

export default function AssistantStatCards({ tasks }: { tasks: TaskResponse[] }) {
  const assigned = tasks.length;
  const inProgress = tasks.filter((task) => task.status === TaskStatus.InProgress).length;
  const submitted = tasks.filter((task) => task.status === TaskStatus.Submitted).length;
  const approved = tasks.filter((task) => task.status === TaskStatus.Approved).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard label="Assigned Tasks" value={assigned} icon={CheckSquare} color="bg-indigo-600" sub="Dữ liệu API /tasks/my" />
      <KpiCard label="In Progress" value={inProgress} icon={Play} color="bg-violet-600" sub="Theo trạng thái hiện tại" />
      <KpiCard label="Submitted" value={submitted} icon={Upload} color="bg-teal-600" sub="Chờ duyệt" />
      <KpiCard label="Approved" value={approved} icon={CheckCircle2} color="bg-emerald-600" sub="Theo dữ liệu API" />
      <KpiCard label="Est. Earnings" value="—" icon={DollarSign} color="bg-amber-500" sub="Chưa có số liệu cụ thể" />
    </div>
  );
}

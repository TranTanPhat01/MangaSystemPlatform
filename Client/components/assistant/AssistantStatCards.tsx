import React from 'react';
import { clsx } from 'clsx';
import { CheckSquare, Play, Upload, CheckCircle2, DollarSign } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  sub?: string;
  pulse?: boolean;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
  pulse,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={clsx(
            'h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            color
          )}
        >
          <Icon size={19} className="text-white" />
        </div>
        {pulse && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
      </div>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{label}</p>
      {sub && <p className="text-[9px] font-medium text-slate-300 mt-1">{sub}</p>}
    </div>
  );
}

export default function AssistantStatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard label="Assigned Tasks"      value={24}         icon={CheckSquare}  color="bg-indigo-600"    sub="Tổng tháng này" />
      <KpiCard label="In Progress"         value={12}         icon={Play}         color="bg-violet-600"    sub="Đang thực hiện" />
      <KpiCard label="Submitted"           value={5}          icon={Upload}        color="bg-teal-600"      sub="Chờ duyệt" />
      <KpiCard label="Approved This Month" value={38}         icon={CheckCircle2}  color="bg-emerald-600"   sub="↑ 6 so với tháng trước" />
      <KpiCard label="Est. Earnings"       value="¥128,000"   icon={DollarSign}    color="bg-amber-500"     sub="Cập nhật 13/06" />
    </div>
  );
}

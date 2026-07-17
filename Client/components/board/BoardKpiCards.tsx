import React from 'react';
import { clsx } from 'clsx';
import { FileText, Vote, BookOpen, AlertTriangle, XCircle } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  sub?: string;
  pulse?: boolean;
}

function KpiCard({ label, value, icon: Icon, color, sub, pulse }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', color)}>
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

export default function BoardKpiCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard label="Đề xuất chờ duyệt" value={7} icon={FileText} color="bg-plum-700" sub="Tăng 2 so với tuần trước" />
      <KpiCard label="Phiếu cần bỏ" value={12} icon={Vote} color="bg-indigo-600" sub="Phiên họp 18/06" />
      <KpiCard label="Series đang xuất bản" value={24} icon={BookOpen} color="bg-emerald-600" sub="↑ 1 series mới" />
      <KpiCard label="Cảnh báo xếp hạng" value={5} icon={AlertTriangle} color="bg-amber-500" sub="3 kỳ thấp liên tiếp" pulse />
      <KpiCard label="Cần xem xét hủy" value={3} icon={XCircle} color="bg-rose-600" sub="Crimson, Silent, Black" pulse />
    </div>
  );
}

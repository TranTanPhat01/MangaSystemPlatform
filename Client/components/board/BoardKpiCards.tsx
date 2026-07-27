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

interface BoardKpiCardsProps {
  proposalCount: number;
  totalVotes: number;
  publishedScheduleCount: number;
  rankingWarningCount: number;
  cancellationWarningCount: number;
}

export default function BoardKpiCards({
  proposalCount,
  totalVotes,
  publishedScheduleCount,
  rankingWarningCount,
  cancellationWarningCount,
}: BoardKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard label="Đề xuất chờ duyệt" value={proposalCount} icon={FileText} color="bg-plum-700" sub="Dữ liệu API series" />
      <KpiCard label="Tổng phiếu" value={totalVotes} icon={Vote} color="bg-indigo-600" sub="Dữ liệu API vote summary" />
      <KpiCard label="Lịch đã xuất bản" value={publishedScheduleCount} icon={BookOpen} color="bg-emerald-600" sub="Dữ liệu API publication" />
      <KpiCard label="Cảnh báo xếp hạng" value={rankingWarningCount} icon={AlertTriangle} color="bg-amber-500" sub="Dữ liệu API ranking" pulse={rankingWarningCount > 0} />
      <KpiCard label="Cần xem xét hủy" value={cancellationWarningCount} icon={XCircle} color="bg-rose-600" sub="Dữ liệu API cancellation" pulse={cancellationWarningCount > 0} />
    </div>
  );
}

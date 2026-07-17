import React from 'react';
import { clsx } from 'clsx';
import { Play, Pause, XCircle, ShieldAlert } from 'lucide-react';
import { CANCELLATION_CARDS } from '@/data/mock/board.mock';
import { RiskLevel } from '@/types/board';

function riskStyle(level: RiskLevel) {
  switch (level) {
    case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
}

export default function CancellationRiskPanel() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Bảng xem xét hủy series</h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                <ShieldAlert size={8} />
                Mock Data
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">Series có ranking thấp liên tiếp cần biểu quyết</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
          {CANCELLATION_CARDS.length} cần xem xét
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {CANCELLATION_CARDS.map(card => (
          <div key={card.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-black text-slate-800">{card.title}</p>
                <p className="text-[10px] font-medium text-slate-400">{card.genre}</p>
              </div>
              <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-full border', riskStyle(card.riskLevel))}>
                {card.riskLevel} Risk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <p className="text-lg font-black text-slate-800">#{card.rank}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">Hạng hiện tại</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-2.5 text-center border border-rose-100">
                <p className="text-lg font-black text-rose-700">{card.lowRankCount}</p>
                <p className="text-[9px] font-medium text-rose-400 mt-0.5">Kỳ hạng thấp</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ý kiến biên tập viên</p>
              <p className="text-[10px] font-medium text-slate-600 leading-relaxed">{card.editorNote}</p>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => alert('Đây là dữ liệu mẫu (Mock data).')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <Play size={11} />Tiếp tục series
              </button>
              <button 
                onClick={() => alert('Đây là dữ liệu mẫu (Mock data).')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Pause size={11} />Thay đổi lịch xuất bản
              </button>
              <button 
                onClick={() => alert('Đây là dữ liệu mẫu (Mock data).')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                <XCircle size={11} />Hủy series
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

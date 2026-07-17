import React from 'react';
import { clsx } from 'clsx';
import { Calendar, AlertOctagon, Vote, Sparkles } from 'lucide-react';
import { CANCELLATION_CARDS, DECISIONS } from '@/data/mock/board.mock';
import { RiskLevel, DecisionItem } from '@/types/board';

function riskStyle(level: RiskLevel) {
  switch (level) {
    case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
}

function decisionDot(type: DecisionItem['type']) {
  const map: Record<DecisionItem['type'], string> = {
    approve: 'bg-emerald-500',
    cancel: 'bg-red-500',
    revision: 'bg-amber-500',
    change: 'bg-indigo-500',
  };
  return map[type];
}

export default function BoardRightPanel() {
  return (
    <aside className="w-72 shrink-0 flex flex-col gap-5">
      {/* Board Meeting */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-plum-100 flex items-center justify-center">
            <Calendar size={14} className="text-plum-700" />
          </div>
          <p className="text-xs font-bold text-slate-700">Phiên họp hội đồng</p>
        </div>
        <div className="bg-plum-50 border border-plum-100 rounded-xl p-3.5 mb-3">
          <p className="text-xs font-black text-plum-900">Phiên họp định kỳ tháng 7</p>
          <p className="text-[10px] text-plum-600 font-semibold mt-1">Thứ Ba, 18/06/2026 · 14:00 JST</p>
        </div>
        <p className="text-[10px] font-medium text-slate-400 mb-2">Nội dung chương trình:</p>
        {['Bỏ phiếu Silent Rain (P4)', 'Quyết định hủy Black Lotus', 'Xem xét bình chọn Q2'].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
            <span className="h-1.5 w-1.5 rounded-full bg-plum-400 shrink-0" />
            <span className="text-[10px] font-medium text-slate-600">{item}</span>
          </div>
        ))}
        <button className="mt-3 w-full py-2 rounded-xl bg-plum-800 text-white text-[10px] font-bold hover:bg-plum-900 transition-colors">
          Xem chi tiết phiên họp
        </button>
      </div>

      {/* Ranking Warning Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
            <AlertOctagon size={14} className="text-rose-600" />
          </div>
          <p className="text-xs font-bold text-slate-700">Cảnh báo xếp hạng</p>
        </div>
        <div className="space-y-2.5">
          {CANCELLATION_CARDS.map(c => (
            <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="text-[11px] font-bold text-slate-800">{c.title}</p>
                <p className="text-[9px] font-medium text-slate-400">Hạng #{c.rank} · {c.lowRankCount} kỳ thấp</p>
              </div>
              <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-lg border', riskStyle(c.riskLevel))}>{c.riskLevel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Voting Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Vote size={14} className="text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-slate-700">Hoạt động bỏ phiếu</p>
        </div>
        <div className="space-y-2.5">
          {DECISIONS.map((d, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={clsx('h-2 w-2 rounded-full mt-1.5 shrink-0', d.type === 'approve' ? 'bg-emerald-500' : d.type === 'cancel' ? 'bg-red-500' : d.type === 'revision' ? 'bg-amber-500' : 'bg-indigo-500')} />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-700">{d.action}</p>
                <p className="text-[9px] text-slate-400 font-medium">{d.series} · {d.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Recommendation */}
      <div className="bg-gradient-to-br from-plum-900 to-burgundy-900 rounded-2xl p-5 text-white shadow-[0_4px_24px_rgba(88,28,135,0.25)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-plum-300" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-plum-300">AI Đề xuất</p>
        </div>
        <p className="text-xs font-black leading-snug mb-1">Nên duyệt Blue Moon</p>
        <p className="text-[9px] font-medium text-white/60 leading-relaxed">3/5 phiếu ủng hộ. Biên tập viên đánh giá cao nhịp cốt truyện. Thể loại Action/Fantasy đang xu hướng.</p>
        <button className="w-full py-2 rounded-xl bg-white/10 border border-white/20 text-white text-[10px] font-bold hover:bg-white/20 transition-colors">
          Xem phân tích đầy đủ
        </button>
      </div>
    </aside>
  );
}

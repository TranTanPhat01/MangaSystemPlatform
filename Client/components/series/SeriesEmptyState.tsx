import React from 'react';
import { BookOpen, Plus } from 'lucide-react';

interface SeriesEmptyStateProps {
  onAddClick: () => void;
}

export default function SeriesEmptyState({ onAddClick }: SeriesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-slate-900/10 border border-slate-850 rounded-xl p-8 text-center max-w-md mx-auto shadow-sm">
      <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
        <BookOpen size={22} />
      </div>
      <h3 className="text-base font-bold text-slate-200">Chưa có series nào</h3>
      <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
        Bạn chưa tạo hoặc tham gia bộ truyện nào trong studio. Hãy khởi tạo series đầu tiên để thiết lập cốt truyện, storyboard và phân công trợ lý.
      </p>
      <button
        onClick={onAddClick}
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 transition-colors"
      >
        <Plus size={14} /> Khởi tạo ngay
      </button>
    </div>
  );
}

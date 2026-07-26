import React from 'react';
import { CheckSquare } from 'lucide-react';

export default function TaskEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-slate-900/10 border border-slate-850 rounded-xl p-8 text-center max-w-md mx-auto shadow-sm">
      <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 mb-4">
        <CheckSquare size={22} />
      </div>
      <h3 className="text-base font-bold text-slate-900">Chưa có nhiệm vụ nào</h3>
      <p className="text-xs text-slate-700 font-semibold mt-1.5 leading-relaxed">
        Bạn hiện chưa có nhiệm vụ (task) vẽ nền, inking hay screentone nào được giao trong studio. Hãy đợi Mangaka phân công tác vụ mới.
      </p>
    </div>
  );
}

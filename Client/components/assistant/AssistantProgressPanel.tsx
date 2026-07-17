import React from 'react';
import { DollarSign, ArrowUp, BookOpen, CheckCircle2 } from 'lucide-react';

export default function AssistantProgressPanel() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <DollarSign size={15} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Monthly Progress & Earnings</h3>
          <p className="text-[9px] font-medium text-slate-400">Tháng 6/2026</p>
        </div>
      </div>

      {/* Earning highlight */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 mb-5">
        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider mb-1">Estimated Earnings</p>
        <p className="text-3xl font-black text-indigo-900">¥128,000</p>
        <div className="flex items-center gap-1 mt-1">
          <ArrowUp size={11} className="text-emerald-600" />
          <span className="text-[10px] font-bold text-emerald-600">+¥14,000 vs last month</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Pages approved', value: '38', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Tasks approved', value: '24', icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon size={13} />
            </div>
            <p className="text-xl font-black text-slate-800">{s.value}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress to goal */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-600">Progress to monthly goal</span>
          <span className="text-[10px] font-black text-indigo-700">38 / 50 tasks</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-[76%] rounded-full bg-gradient-to-r from-indigo-600 to-violet-400 transition-all duration-700" />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] font-medium text-slate-400">76% completed</span>
          <span className="text-[9px] font-bold text-indigo-600">12 tasks to go</span>
        </div>
      </div>
    </div>
  );
}

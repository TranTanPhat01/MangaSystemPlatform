'use client';

import React from 'react';
import { DollarSign, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { useAssistantProgress } from '@/hooks/useAssistantProgress';

export default function AssistantProgressPanel() {
  const { progress, loading } = useAssistantProgress();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-slate-400" size={24} />
        <p className="ml-3 text-slate-500">Loading progress data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <DollarSign size={15} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Monthly Progress & Earnings</h3>
          <p className="text-[9px] font-medium text-slate-400">
            Current Period
          </p>
        </div>
      </div>

      {/* Earning highlight */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-4 mb-5">
        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider mb-1">Earnings</p>
        <p className="text-lg font-black text-indigo-900">Chưa có số liệu cụ thể</p>
        <p className="text-[10px] font-medium text-indigo-700 mt-1">Không hiển thị số liệu ước tính</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center mb-2 text-emerald-600 bg-emerald-50">
            <BookOpen size={13} />
          </div>
          <p className="text-xl font-black text-slate-800">{progress.approvedPages}</p>
          <p className="text-[9px] font-bold text-slate-400 mt-0.5">Pages approved</p>
        </div>
        
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center mb-2 text-indigo-600 bg-indigo-50">
            <CheckCircle2 size={13} />
          </div>
          <p className="text-xl font-black text-slate-800">{progress.approvedTasks}</p>
          <p className="text-[9px] font-bold text-slate-400 mt-0.5">Tasks approved</p>
        </div>
      </div>

      {/* Progress to goal */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-600">Approved task progress</span>
          <span className="text-[10px] font-black text-indigo-700">
            {progress.approvedTasks} / {progress.totalTasks} tasks
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-400 transition-all duration-700"
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] font-medium text-slate-400">
            {progress.completionPercentage}% completed
          </span>
          <span className="text-[9px] font-bold text-indigo-600">Theo dữ liệu API</span>
        </div>
      </div>

      {/* Additional stats */}
      <div className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-semibold text-slate-600">In Progress</p>
          <p className="font-bold text-slate-800 text-lg">{progress.inProgressTasks}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-600">Pending</p>
          <p className="font-bold text-slate-800 text-lg">{progress.pendingTasks}</p>
        </div>
      </div>
    </div>
  );
}

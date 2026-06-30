'use client';

import React from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { CheckSquare, Calendar, AlertCircle, RefreshCw } from 'lucide-react';

const mockTasks = [
  { id: 1, title: 'Clean Background Screentones', series: 'Shadow Syndicate - Ch 43', deadline: 'May 26, 2026', priority: 'High', status: 'In Progress' },
  { id: 2, title: 'Ink Chapter 44 Keyboards', series: 'Shadow Syndicate - Ch 44', deadline: 'June 02, 2026', priority: 'Medium', status: 'Todo' },
  { id: 3, title: 'Submit Color Cover Spread', series: 'Whisper of the Wind - Ch 19', deadline: 'May 24, 2026', priority: 'Critical', status: 'Submitted' },
];

export default function TasksPage() {
  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-450 border-rose-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-450 border-amber-500/20';
      default:
        return 'bg-sky-500/10 text-sky-450 border-sky-500/20';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'bg-violet-650/10 text-violet-400 border border-violet-500/20';
      case 'in progress':
        return 'bg-indigo-650/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700/60';
    }
  };

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Tasks & Workflow</h1>
            <p className="text-xs text-slate-500 font-medium">Track your drawing instructions, storyboard submission deadlines, and approvals.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all duration-200">
            Create Task
          </button>
        </div>

        {/* Tasks List */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workspace Assignments</span>
            <button className="p-1.5 hover:bg-slate-800 rounded text-slate-450 hover:text-slate-350 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60">
            {mockTasks.map((task) => (
              <div 
                key={task.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/20 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-200 text-sm">{task.title}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getPriorityStyle(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-550">
                    <span className="font-semibold text-slate-400">{task.series}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Due {task.deadline}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getStatusStyle(task.status)}`}>
                    {task.status}
                  </span>
                  <button className="text-xs text-slate-400 hover:text-slate-200 font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}

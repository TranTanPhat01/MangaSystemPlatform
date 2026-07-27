import React from 'react';
import { BookOpen, CheckSquare, Layers, AlertCircle, Play, Tag, Clock } from 'lucide-react';
import { TaskItem } from './TaskTable';
import { SeriesResponse } from '@/types/manga';
import StatCard from './StatCard';
import TaskTable from './TaskTable';

interface Props {
  triggerModal: (title: string, content: string) => void;
  handleTaskAction: (taskId: string, action: string) => void;
  filteredTasks: TaskItem[];
  series: SeriesResponse[];
}

export default function MangakaDashboardOverview({
  triggerModal,
  handleTaskAction,
  filteredTasks,
  series,
}: Props) {
  const seriesStatusLabel = (status: SeriesResponse['status']) => {
    const labels = ['', 'Draft', 'Submitted', 'Approved', 'Ongoing', 'Hiatus', 'Cancelled', 'Completed', 'Revision Requested', 'Rejected'];
    return typeof status === 'number' ? labels[status] || String(status) : String(status);
  };
  // Compute counts
  const totalSeries = series.length;
  const activeTasks = filteredTasks.filter(t => ['In Progress', 'Pending'].includes(t.status)).length;
  const submittedTasks = filteredTasks.filter(t => t.status === 'Submitted').length;
  const revisionsCount = filteredTasks.filter(t => t.status === 'Revision Required').length;

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none">
          <BookOpen size={240} className="translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
            Workspace Hub
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-3">Manga Creation Workflow</h1>
          <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed font-medium">
            Monitor series progress, manage chapter manuscripts, coordinate tasks with assistants, and review feedback from editorial boards.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Series"
          value={totalSeries}
          icon={BookOpen}
          description="Total series created under your account"
          highlightColor="burgundy"
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks}
          icon={Layers}
          description="In Progress or Pending tasks"
          highlightColor="plum"
        />
        <StatCard
          title="Awaiting Review"
          value={submittedTasks}
          icon={CheckSquare}
          description="Manuscripts submitted by assistants"
          highlightColor="teal"
        />
        <StatCard
          title="Revisions Needed"
          value={revisionsCount}
          icon={AlertCircle}
          description="Tasks flagged by editors for changes"
          highlightColor="amber"
        />
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Production Task Board - takes 2 columns */}
        <div className="xl:col-span-2 space-y-4">
          <TaskTable tasks={filteredTasks} onAction={handleTaskAction} />
        </div>

        {/* Quick Actions & Series Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerModal('New Series', 'Create series proposals via the "My Series" workspace.')}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-center"
              >
                <BookOpen size={16} className="text-burgundy-700 mb-1" />
                <span className="text-[10px] font-bold text-slate-700">New Series</span>
              </button>
              <button
                onClick={() => triggerModal('Quick Task', 'Assign background/line art tasks using the "Tasks" tab.')}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors text-center"
              >
                <Layers size={16} className="text-plum-700 mb-1" />
                <span className="text-[10px] font-bold text-slate-700">Assign Task</span>
              </button>
            </div>
          </div>

          {/* Series Overview */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="font-bold text-slate-800 text-sm mb-3">My Series Proposals</h3>
            {series.length === 0 ? (
              <p className="text-xs text-slate-700 font-medium">No active series. Create one to begin.</p>
            ) : (
              <div className="space-y-3">
                {series.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-3 bg-slate-50 border border-slate-100/80 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-700 truncate max-w-[150px]">{s.title}</h4>
                      <div className="flex gap-2 text-[9px] text-slate-550 mt-1 font-semibold">
                        {s.genre && <span className="flex items-center gap-0.5"><Tag size={8} />{s.genre}</span>}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {seriesStatusLabel(s.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, Calendar, Play, Send, Eye, Download, ShieldAlert } from 'lucide-react';
import { TaskItemUI } from '@/hooks/useTasks';
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';

interface TaskListTableProps {
  tasks: TaskItemUI[];
  selectedTaskId: string | undefined;
  onSelectTask: (t: TaskItemUI) => void;
  onStart: (id: string) => Promise<void>;
  onSubmitClick: (t: TaskItemUI) => void;
  onDownloadAsset: (fileAssetId: string, fileName: string) => Promise<void>;
  isStarting: boolean;
  isSubmitting: boolean;
}

export default function TaskListTable({
  tasks,
  selectedTaskId,
  onSelectTask,
  onStart,
  onSubmitClick,
  onDownloadAsset,
  isStarting,
  isSubmitting,
}: TaskListTableProps) {
  const handleActionButton = (e: React.MouseEvent, task: TaskItemUI) => {
    e.stopPropagation();
    if (task.status === 'Pending') {
      onStart(task.id);
    } else if (task.status === 'InProgress' || task.status === 'RevisionRequired') {
      onSubmitClick(task);
    } else if (task.status === 'Submitted') {
      alert('Tác vụ đã nộp, vui lòng chờ Mangaka phê duyệt.');
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] uppercase font-bold text-slate-455 tracking-wider">
              <th className="p-4">Task Name / Series</th>
              <th className="p-4">Chapter / Page</th>
              <th className="p-4">Annotation Type</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Deadline</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-350">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={clsx(
                  'hover:bg-slate-900/20 transition-colors cursor-pointer group',
                  selectedTaskId === task.id && 'bg-indigo-950/20'
                )}
              >
                <td className="p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm truncate max-w-[200px] sm:max-w-xs block" title={task.title}>
                        {task.title}
                      </span>
                      {task.isMock && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                          <ShieldAlert size={8} />
                          Mock Data
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block">{task.series}</span>
                  </div>
                </td>
                <td className="p-4 whitespace-nowrap">{task.chapter}</td>
                <td className="p-4">
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/40">
                    {task.annotationType}
                  </span>
                </td>
                <td className="p-4">
                  <TaskPriorityBadge priority={task.priority} />
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span className={clsx('flex items-center gap-1', task.deadlineOverdue ? 'text-rose-500 font-bold' : '')}>
                    {task.deadlineOverdue && <AlertTriangle size={12} />}
                    {task.deadline}
                  </span>
                </td>
                <td className="p-4">
                  <TaskStatusBadge status={task.status} />
                </td>
                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                  {task.pageFileAssetId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadAsset(task.pageFileAssetId!, `${task.title}_Reference.png`);
                      }}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
                      title="Download reference page scan"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  {task.status !== 'Approved' && task.status !== 'Cancelled' && (
                    <button
                      onClick={(e) => handleActionButton(e, task)}
                      disabled={isStarting || isSubmitting}
                      className={clsx(
                        'px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase transition-all shadow-sm',
                        task.status === 'Pending' && 'bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border-indigo-500/20 hover:border-indigo-600',
                        (task.status === 'InProgress' || task.status === 'RevisionRequired') && 'bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/20 hover:border-emerald-600'
                      )}
                    >
                      {task.status === 'Pending' ? 'Start' : 'Submit'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

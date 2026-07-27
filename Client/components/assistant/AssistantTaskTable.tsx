import React from 'react';
import { clsx } from 'clsx';
import { CheckSquare, AlertTriangle, Play, Eye, Wrench, ChevronRight } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TaskAction } from '@/types/assistant';

function priorityStyle(p: TaskPriority) {
  switch (p) {
    case 'Urgent': return 'bg-red-100 text-red-700 border-red-200';
    case 'High':   return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Low':    return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

function statusStyle(status: TaskStatus) {
  switch (status) {
    case 'In Progress':      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Submitted':        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Revision Required': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Approved':         return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Pending':          return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

function actionStyle(action: TaskAction) {
  switch (action) {
    case 'Continue': return 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_2px_8px_rgba(79,70,229,0.25)]';
    case 'View':     return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
    case 'Fix Now':  return 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_2px_8px_rgba(225,29,72,0.25)]';
    case 'Review':   return 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';
  }
}

function actionIcon(action: TaskAction) {
  switch (action) {
    case 'Continue': return <Play size={11} />;
    case 'View':     return <Eye size={11} />;
    case 'Fix Now':  return <Wrench size={11} />;
    case 'Review':   return <ChevronRight size={11} />;
  }
}

interface AssistantTaskTableProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask: (t: Task) => void;
  tasksLoading: boolean;
  tasksError: string | null;
  apiTasksLength: number;
  onRetry: () => void;
  onAction?: (task: Task) => void | Promise<void>;
}

export default function AssistantTaskTable({
  tasks,
  selectedTaskId,
  onSelectTask,
  tasksLoading,
  tasksError,
  apiTasksLength,
  onRetry,
  onAction,
}: AssistantTaskTableProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <CheckSquare size={15} className="text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">My Active Tasks</h2>
              {tasksLoading && <span className="text-[9px] text-indigo-500 font-bold animate-pulse">Loading…</span>}
            </div>
            {tasksError && (
              <p className="text-[9px] text-rose-500 font-medium mt-0.5">
                {tasksError} — <button onClick={onRetry} className="underline">Retry</button>
              </p>
            )}
            {!tasksError && (
              <p className="text-[10px] text-slate-400 font-medium">
                {apiTasksLength > 0 ? `${apiTasksLength} task đang được giao` : 'Chưa có task được giao từ API'} — click để xem chi tiết
              </p>
            )}
          </div>
        </div>
        <button onClick={onRetry} className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
          Xem tất cả
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/60 text-[9px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-100">
              <th className="px-5 py-3">Task / Series</th>
              <th className="px-5 py-3">Chapter/Page</th>
              <th className="px-5 py-3">Loại</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Deadline</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map(task => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={clsx(
                  'hover:bg-slate-50/60 transition-colors cursor-pointer group',
                  selectedTaskId === task.id && 'bg-indigo-50/40'
                )}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0',
                        task.color
                      )}
                    >
                      {task.title.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{task.title}</p>
                      <p className="text-[9px] font-medium text-slate-400">{task.series}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-semibold text-slate-600">{task.chapter}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {task.annotationType}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={clsx(
                      'text-[9px] font-bold px-2 py-1 rounded-lg border',
                      priorityStyle(task.priority)
                    )}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={clsx(
                      'text-[10px] font-bold',
                      task.deadlineOverdue ? 'text-rose-600' : 'text-slate-600'
                    )}
                  >
                    {task.deadlineOverdue && <AlertTriangle size={10} className="inline mr-0.5" />}
                    {task.deadline}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={clsx(
                      'text-[9px] font-bold px-2 py-1 rounded-lg border',
                      statusStyle(task.status)
                    )}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all',
                      actionStyle(task.action)
                    )}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectTask(task);
                      if (onAction) {
                        void onAction(task);
                      }
                    }}
                  >
                    {actionIcon(task.action)}
                    {task.action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

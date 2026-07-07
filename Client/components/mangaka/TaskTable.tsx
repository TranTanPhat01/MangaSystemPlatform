import React from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { Eye, Edit3, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';

export interface TaskItem {
  id: string;
  taskName: string;
  page: string;
  assistant: string;
  status: string;
  priority: string;
  deadline: string;
  actionText: 'Review' | 'Open' | string;
}

interface TaskTableProps {
  tasks: TaskItem[];
  onAction?: (taskId: string, actionType: string) => void;
}

export default function TaskTable({ tasks, onAction }: TaskTableProps) {
  const handleActionClick = (taskId: string, actionText: string) => {
    if (onAction) {
      onAction(taskId, actionText);
    } else {
      alert(`Action "${actionText}" triggered for Task ID: ${taskId}`);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Table Header / Action Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Production Task Board</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor and review background work assigned to studio assistants.
          </p>
        </div>
        <div className="flex gap-2">
          <select className="text-xs font-semibold text-slate-650 bg-white border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-burgundy-500">
            <option>All Pages</option>
            <option>P01 - P10</option>
            <option>P11 - P20</option>
          </select>
          <select className="text-xs font-semibold text-slate-650 bg-white border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-burgundy-500">
            <option>All Statuses</option>
            <option>Submitted</option>
            <option>In Progress</option>
            <option>Revision Required</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <th className="px-6 py-3.5">Task Description</th>
              <th className="px-6 py-3.5">Page</th>
              <th className="px-6 py-3.5">Assistant</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Priority</th>
              <th className="px-6 py-3.5">Deadline</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {tasks.map((task) => {
              const isUrgent = task.priority.toLowerCase() === 'urgent';
              const isSubmitted = task.status.toLowerCase() === 'submitted';
              
              return (
                <tr 
                  key={task.id} 
                  className={clsx(
                    "hover:bg-slate-50/80 transition-colors duration-150 text-sm font-medium",
                    isUrgent && task.status.toLowerCase() === 'revision required' && "bg-rose-50/10"
                  )}
                >
                  <td className="px-6 py-4 text-slate-800">
                    <span className="font-bold">{task.taskName}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono">
                    {task.page}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-plum-50 border border-plum-150 flex items-center justify-center text-[10px] font-bold text-plum-700 uppercase">
                        {task.assistant.slice(0, 2)}
                      </div>
                      <span className="text-slate-700">{task.assistant}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "font-semibold text-xs px-2 py-0.5 rounded",
                      task.deadline.toLowerCase() === 'today' && "bg-burgundy-50 text-burgundy-800",
                      task.deadline.toLowerCase() === 'tomorrow' && "bg-amber-50 text-amber-800",
                      task.deadline.toLowerCase() === 'overdue' && "bg-rose-100 text-rose-800 font-bold",
                      !['today', 'tomorrow', 'overdue'].includes(task.deadline.toLowerCase()) && "text-slate-500"
                    )}>
                      {task.deadline}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleActionClick(task.id, task.actionText)}
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all duration-150",
                        task.actionText.toLowerCase() === 'review'
                          ? "bg-burgundy-800 hover:bg-burgundy-900 text-white active:bg-burgundy-950"
                          : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 active:bg-slate-100"
                      )}
                    >
                      {task.actionText.toLowerCase() === 'review' ? (
                        <>
                          <Eye size={12} />
                          <span>Review</span>
                        </>
                      ) : (
                        <>
                          <Edit3 size={12} />
                          <span>Open</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/20">
        <span>Showing {tasks.length} active assignments</span>
        <button className="text-burgundy-800 hover:text-burgundy-950 transition-colors">
          View All Studio Tasks →
        </button>
      </div>
    </div>
  );
}

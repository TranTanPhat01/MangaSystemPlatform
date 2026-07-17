import React from 'react';
import { Plus } from 'lucide-react';
import TaskTable, { TaskItem } from './TaskTable';

interface MangakaTasksTabProps {
  tasks: TaskItem[];
  handleTaskAction: (taskId: string, actionType: string) => void;
  triggerModal: (title: string, content: string) => void;
}

export default function MangakaTasksTab({
  tasks,
  handleTaskAction,
  triggerModal,
}: MangakaTasksTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Studio Task Allocation Board</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Allocate work (sketching, backgrounds, screentones, effects) to assistants and inspect submissions.</p>
        </div>
        <button 
          onClick={() => triggerModal("Add Task", "Create a new task for Chapter 12 or 13. Select assistant assignee (Hana, Kenji, Mina), specify reference canvas layer, and select priority/deadline.")}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-900 rounded-lg transition-colors"
        >
          <Plus size={14} />
          <span>Create Task</span>
        </button>
      </div>

      <TaskTable tasks={tasks} onAction={handleTaskAction} />
    </div>
  );
}

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskTable, { TaskItem } from './TaskTable';
import { mangaApi } from '@/services/manga-api';

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
  const [submitting, setSubmitting] = useState(false);

  const handleCreateTask = async () => {
    setSubmitting(true);
    try {
      const res = await mangaApi.createTask({
        annotationId: '00000000-0000-0000-0000-000000000000',
        pageId: '00000000-0000-0000-0000-000000000000',
        title: 'New production task',
        description: 'Create a new task from the mangaka workspace.',
        assignedToUserId: '00000000-0000-0000-0000-000000000000',
        priority: 'Medium',
      });
      if (res.data?.success) {
        triggerModal('Task Created', 'The task was created and is now available to the assigned assistant.');
      } else {
        triggerModal('Task Creation Failed', res.data?.message || 'The task could not be created.');
      }
    } catch (err: any) {
      triggerModal('Task Creation Failed', err.response?.data?.message || 'The task could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Studio Task Allocation Board</h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">Allocate work (sketching, backgrounds, screentones, effects) to assistants and inspect submissions.</p>
        </div>
        <button
          onClick={handleCreateTask}
          disabled={submitting}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-burgundy-850 hover:bg-burgundy-900 rounded-lg transition-colors disabled:opacity-60"
        >
          <Plus size={14} />
          <span>{submitting ? 'Creating…' : 'Create Task'}</span>
        </button>
      </div>

      <TaskTable tasks={tasks} onAction={handleTaskAction} />
    </div>
  );
}

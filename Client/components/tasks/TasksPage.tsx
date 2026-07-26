'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import { RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useTasks, TaskItemUI } from '@/hooks/useTasks';
import TaskListTable from './TaskListTable';
import TaskDetailPanel from './TaskDetailPanel';
import TaskSubmitModal from './TaskSubmitModal';
import TaskEmptyState from './TaskEmptyState';

export default function TasksPage() {
  const {
    tasks,
    selectedTask,
    isLoading,
    isStarting,
    isSubmitting,
    error,
    successMessage,
    fetchTasks,
    selectTask,
    startTask,
    submitTask,
    downloadPageAsset,
    clearError,
    clearSuccess,
  } = useTasks();

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [taskToSubmit, setTaskToSubmit] = useState<TaskItemUI | null>(null);

  // Auto clear notifications after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(clearSuccess, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmitClick = (task: TaskItemUI) => {
    setTaskToSubmit(task);
    setSubmitModalOpen(true);
  };

  const handleModalSubmit = async (file: File, note: string) => {
    if (!taskToSubmit) return;
    await submitTask(taskToSubmit.id, file, note);
    setSubmitModalOpen(false);
    setTaskToSubmit(null);
  };

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Banner notifications */}
        <div className="space-y-3">
          {error && (
            <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={clearError} className="text-rose-400 hover:text-rose-200 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={clearSuccess} className="text-emerald-400 hover:text-emerald-200 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Tasks & Workflow</h1>
            <p className="text-xs text-slate-700 font-medium">Track your drawing instructions, storyboard submission deadlines, and approvals.</p>
          </div>
          <button 
            onClick={fetchTasks}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 font-semibold text-xs border border-slate-700/60 rounded-xl transition-all"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            Refresh Board
          </button>
        </div>

        {/* Content State */}
        {isLoading && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-semibold mt-3">Loading task list...</span>
          </div>
        ) : tasks.length === 0 ? (
          <TaskEmptyState />
        ) : (
          <div className="space-y-6">
            <TaskListTable
              tasks={tasks}
              selectedTaskId={selectedTask?.id}
              onSelectTask={selectTask}
              onStart={startTask}
              onSubmitClick={handleSubmitClick}
              onDownloadAsset={downloadPageAsset}
              isStarting={isStarting}
              isSubmitting={isSubmitting}
            />

            {selectedTask && (
              <TaskDetailPanel
                task={selectedTask}
                onStart={startTask}
                onSubmitClick={handleSubmitClick}
                onDownloadAsset={downloadPageAsset}
                isStarting={isStarting}
              />
            )}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {taskToSubmit && (
        <TaskSubmitModal
          isOpen={submitModalOpen}
          onClose={() => { setSubmitModalOpen(false); setTaskToSubmit(null); }}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
          taskTitle={taskToSubmit.title}
        />
      )}
    </DashboardLayoutWrapper>
  );
}

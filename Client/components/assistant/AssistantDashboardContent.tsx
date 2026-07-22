import React from 'react';
import { Star, Download, Upload } from 'lucide-react';
import { useAssistantDashboard } from '@/hooks/useAssistantDashboard';
import AssistantStatCards from './AssistantStatCards';
import AssistantTaskTable from './AssistantTaskTable';
import AssistantTaskDetailPreview from './AssistantTaskDetailPreview';
import AssistantRevisionPanel from './AssistantRevisionPanel';
import AssistantProgressPanel from './AssistantProgressPanel';
import AssistantActivityPanel from './AssistantActivityPanel';
import AssistantRightPanel from './AssistantRightPanel';

export default function AssistantDashboardContent() {
  const {
    selectedTask,
    setSelectedTask,
    displayTasks,
    tasksLoading,
    tasksError,
    useMockFallback,
    apiTasksLength,
    fetchMyTasks,
    startTask,
    submitTask,
    isSubmitting,
    submissionMessage,
  } = useAssistantDashboard();

  return (
    <div className="space-y-7">
      {/* ── Greeting Banner ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-violet-50/30 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-100 mb-3 uppercase tracking-wider">
            <Star size={10} className="text-indigo-500 fill-indigo-400" />
            Assistant Workspace · June 2026
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Workspace của Kenji — tổng quan task và tiến độ tháng.
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1 max-w-xl">
            2 task cần sửa gấp · 12 task đang xử lý · Deadline hôm nay lúc 23:59
          </p>
        </div>
        <div className="relative flex flex-wrap gap-2.5 shrink-0">
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
            <Download size={13} />Download Assets
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-700 text-xs font-bold text-white hover:bg-indigo-800 shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition-all active:scale-[0.98]">
            <Upload size={13} />Upload Submission
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <AssistantStatCards />

      {/* ── Two-column: Main + Right Sidebar ── */}
      <div className="flex gap-6">
        {/* ── Left / Main ── */}
        <div className="flex-1 min-w-0 space-y-7">
          <AssistantTaskTable
            tasks={displayTasks}
            selectedTaskId={selectedTask?.id}
            onSelectTask={setSelectedTask}
            tasksLoading={tasksLoading}
            tasksError={tasksError}
            useMockFallback={useMockFallback}
            apiTasksLength={apiTasksLength}
            onRetry={fetchMyTasks}
            onAction={async (task) => {
              if (task.action === 'Fix Now') {
                await startTask(task.id);
              }
              setSelectedTask(task);
            }}
          />

          {selectedTask && (
            <AssistantTaskDetailPreview
              selectedTask={selectedTask}
              onUploadSubmission={async (file) => {
                await submitTask(selectedTask.id, file, 'Submitted from assistant workspace');
              }}
              isSubmitting={isSubmitting}
              submissionMessage={submissionMessage}
            />
          )}

          <AssistantRevisionPanel />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssistantProgressPanel />
            <AssistantActivityPanel />
          </div>
        </div>

        {/* Right sidebar */}
        <AssistantRightPanel />
      </div>
    </div>
  );
}

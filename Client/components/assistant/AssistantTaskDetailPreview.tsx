'use client';

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { FileImage, Download, Upload, AlertCircle, Loader2, ImageOff } from 'lucide-react';
import { Task, TaskStatus } from '@/types/assistant';
import { fileApi } from '@/services/file-api';

function statusStyle(status: TaskStatus) {
  switch (status) {
    case 'In Progress':       return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Submitted':         return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Revision Required': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Approved':          return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Pending':           return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

interface AssistantTaskDetailPreviewProps {
  selectedTask: Task;
  onUploadSubmission?: (file: File) => Promise<void> | void;
  isSubmitting?: boolean;
  submissionMessage?: string | null;
}

export default function AssistantTaskDetailPreview({
  selectedTask,
  onUploadSubmission,
  isSubmitting,
  submissionMessage,
}: AssistantTaskDetailPreviewProps) {
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Load real page image from fileId when task changes
  useEffect(() => {
    setPageImageUrl(null);
    setImageError(false);

    // Use pageFileId if available on the task (passed from API via pageFileId field)
    // The task.pageId can be used to look up file URL if needed
    const fileId = (selectedTask as Task & { pageFileId?: string }).pageFileId;

    if (fileId) {
      setImageLoading(true);
      fileApi
        .getFileUrl(fileId)
        .then((res) => {
          if (res.data?.success && res.data.data?.url) {
            setPageImageUrl(res.data.data.url);
          } else {
            setImageError(true);
          }
        })
        .catch(() => setImageError(true))
        .finally(() => setImageLoading(false));
    }
  }, [selectedTask.id]);

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadSubmission) return;
    await onUploadSubmission(file);
    event.target.value = '';
  };

  const handleDownload = () => {
    if (pageImageUrl) {
      const link = document.createElement('a');
      link.href = pageImageUrl;
      link.download = `page-${selectedTask.chapter}.png`;
      link.target = '_blank';
      link.click();
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <FileImage size={15} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Task Detail Preview</h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {selectedTask.title} · {selectedTask.series} · {selectedTask.chapter}
            </p>
          </div>
        </div>
        <span className={clsx('text-[9px] font-bold px-2.5 py-1 rounded-full border', statusStyle(selectedTask.status))}>
          {selectedTask.status}
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Page image from API */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Manga Page Preview</p>
          <div
            className="relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-200"
            style={{ aspectRatio: '3/4' }}
          >
            {imageLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Loader2 size={22} className="animate-spin text-indigo-500" />
                <p className="text-[10px] font-semibold text-slate-500">Loading page…</p>
              </div>
            ) : pageImageUrl ? (
              <>
                {/* Real page image */}
                <img
                  src={pageImageUrl}
                  alt={`Page — ${selectedTask.chapter}`}
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={() => { setPageImageUrl(null); setImageError(true); }}
                />
                {/* Chapter label */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded-md">
                  {selectedTask.chapter}
                </div>
              </>
            ) : imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                <ImageOff size={22} className="text-slate-400" />
                <p className="text-[10px] font-semibold text-slate-500">Page image not available</p>
                <p className="text-[9px] text-slate-400">Upload a page image to see it here</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                <FileImage size={22} className="text-slate-400" />
                <p className="text-[10px] font-semibold text-slate-500">No page image</p>
                <p className="text-[9px] text-slate-400">{selectedTask.chapter}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Task instructions + actions */}
        <div className="space-y-5">
          {/* Task instruction */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Task Instruction</p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-700 mb-1">
                Type: <span className="text-indigo-700">{selectedTask.annotationType}</span>
              </p>
              {selectedTask.description ? (
                <p className="text-[10px] text-slate-600 leading-relaxed">{selectedTask.description}</p>
              ) : (
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  No additional description provided. Follow the annotation guidelines in the Page Editor.
                </p>
              )}
            </div>
          </div>

          {/* Deadline & priority info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Deadline</p>
              <p className={clsx(
                'text-xs font-bold',
                selectedTask.deadlineOverdue ? 'text-rose-600' : 'text-slate-700'
              )}>
                {selectedTask.deadline || '—'}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Priority</p>
              <p className={clsx('text-xs font-bold', {
                'text-rose-600': selectedTask.priority === 'Urgent',
                'text-amber-600': selectedTask.priority === 'High',
                'text-slate-700': !['Urgent','High'].includes(selectedTask.priority),
              })}>
                {selectedTask.priority}
              </p>
            </div>
          </div>

          {/* Submission feedback message */}
          {submissionMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
              <AlertCircle size={12} />
              {submissionMessage}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleDownload}
              disabled={!pageImageUrl}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              Download Page
            </button>
            <label className="flex-1 flex cursor-pointer items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-indigo-700 text-white hover:bg-indigo-800 shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition-colors">
              <Upload size={13} />
              {isSubmitting ? 'Uploading…' : 'Upload Submission'}
              <input type="file" className="hidden" accept="image/*,.psd,.zip,.pdf,.ai" onChange={handleFileSelection} />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}

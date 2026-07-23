import React from 'react';
import { clsx } from 'clsx';
import { FileImage, Paperclip, Download, Upload } from 'lucide-react';
import { Task, TaskStatus } from '@/types/assistant';

function statusStyle(status: TaskStatus) {
  switch (status) {
    case 'In Progress':      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Submitted':        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Revision Required': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Approved':         return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Pending':          return 'bg-slate-100 text-slate-500 border-slate-200';
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
  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadSubmission) return;
    await onUploadSubmission(file);
    event.target.value = '';
  };
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
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
        {/* Left: Page thumbnail + highlight zone */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Manga Page Preview</p>
          {/* Thumbnail placeholder */}
          <div className="relative bg-slate-100 rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
            {/* Manga page mock */}
            <div className="absolute inset-0 flex flex-col gap-1 p-2">
              {[3, 1, 2].map((cols, ri) => (
                <div key={ri} className={clsx('flex gap-1', ri === 0 ? 'flex-[3]' : ri === 1 ? 'flex-[1.5]' : 'flex-[2]')}>
                  {Array.from({ length: cols }).map((_, ci) => (
                    <div
                      key={ci}
                      className={clsx(
                        'flex-1 rounded bg-slate-200',
                        ri === 0 && ci === 1 && 'ring-2 ring-indigo-500 ring-offset-1 bg-indigo-100'
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Highlighted region overlay */}
            <div className="absolute top-[18%] left-[34%] w-[30%] h-[25%] border-2 border-indigo-500 rounded bg-indigo-500/10 flex items-center justify-center">
              <span className="text-[8px] font-black text-indigo-700 bg-white/80 px-1.5 py-0.5 rounded">
                Selected Region
              </span>
            </div>

            {/* Corner label */}
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded-md">
              {selectedTask.chapter}
            </div>
          </div>
        </div>

        {/* Right: Instructions + files + actions */}
        <div className="space-y-5">
          {/* Task instruction */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Task Instruction</p>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-700 mb-1">Annotation Type: <span className="text-indigo-700">{selectedTask.annotationType}</span></p>
              {selectedTask.annotationType === 'Background' && (
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Draw a detailed urban nightscape background for the highlighted panel. Use the reference cityscape provided. Perspective point is upper-center. Avoid covering character silhouettes in panels 1 and 3.
                </p>
              )}
              {selectedTask.annotationType === 'Shading' && (
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Apply cel-shading to the main character in the right panel. Light source is from upper-left at 45°. Use gradient fill for hair and flat tones for clothing.
                </p>
              )}
              {selectedTask.annotationType === 'Effect' && (
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Add speed-line motion effects radiating from the focal point (marked circle). Stroke weight 1.5px, 80 lines, angle range ±35°. No blur — sharp lines only.
                </p>
              )}
              {!['Background', 'Shading', 'Effect'].includes(selectedTask.annotationType) && (
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Follow the annotation guide provided in the reference files. Complete the highlighted region according to the Mangaka&apos;s instructions.
                </p>
              )}
            </div>
          </div>

          {/* Reference files */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Reference Files</p>
            <div className="space-y-2">
              {[
                { name: 'reference_cityscape.psd', size: '24.2 MB', type: 'PSD' },
                { name: 'character_guide.png', size: '3.1 MB', type: 'PNG' },
                { name: 'annotation_overlay.ai', size: '8.7 MB', type: 'AI' },
              ].map(f => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                >
                  <Paperclip size={12} className="text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-700 truncate">{f.name}</p>
                    <p className="text-[8px] font-medium text-slate-400">{f.size}</p>
                  </div>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{f.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-1">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              <Download size={13} />Download Assets
            </button>
            <label className="flex-1 flex cursor-pointer items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-indigo-700 text-white hover:bg-indigo-800 shadow-[0_2px_8px_rgba(79,70,229,0.25)] transition-colors">
              <Upload size={13} />
              {isSubmitting ? 'Uploading…' : 'Upload Submission'}
              <input type="file" className="hidden" accept="image/*,.psd,.zip,.pdf,.ai" onChange={handleFileSelection} />
            </label>
          </div>
          {submissionMessage && (
            <p className="text-[10px] font-medium text-emerald-600">{submissionMessage}</p>
          )}
        </div>
      </div>
    </section>
  );
}

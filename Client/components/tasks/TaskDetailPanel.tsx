import React from 'react';
import { clsx } from 'clsx';
import { FileImage, Paperclip, Download, Upload, Play } from 'lucide-react';
import { TaskItemUI } from '@/hooks/useTasks';
import TaskStatusBadge from './TaskStatusBadge';
import { TaskStatus } from '@/types/manga';

interface TaskDetailPanelProps {
  task: TaskItemUI;
  onStart: (id: string) => Promise<void>;
  onSubmitClick: (t: TaskItemUI) => void;
  onDownloadAsset: (fileAssetId: string, fileName: string) => Promise<void>;
  isStarting: boolean;
}

export default function TaskDetailPanel({
  task,
  onStart,
  onSubmitClick,
  onDownloadAsset,
  isStarting,
}: TaskDetailPanelProps) {
  return (
    <section className="bg-slate-900/20 border border-slate-800/80 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden text-slate-200">
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center">
            <FileImage size={15} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-200">Task Detail Preview</h2>
            <p className="text-[10px] text-slate-500 font-medium">
              {task.title} · {task.series} · {task.chapter}
            </p>
          </div>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Page thumbnail mockup */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Manga Page Preview</p>
          <div className="relative bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
            <div className="absolute inset-0 flex flex-col gap-1 p-2">
              {[3, 1, 2].map((cols, ri) => (
                <div key={ri} className={clsx('flex gap-1', ri === 0 ? 'flex-[3]' : ri === 1 ? 'flex-[1.5]' : 'flex-[2]')}>
                  {Array.from({ length: cols }).map((_, ci) => (
                    <div
                      key={ci}
                      className={clsx(
                        'flex-1 rounded bg-slate-900 border border-slate-850',
                        ri === 0 && ci === 1 && 'ring-2 ring-indigo-650 ring-offset-1 ring-offset-slate-900 bg-indigo-950/20'
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Highlighted region overlay */}
            <div className="absolute top-[18%] left-[34%] w-[30%] h-[25%] border-2 border-indigo-550 rounded bg-indigo-500/10 flex items-center justify-center">
              <span className="text-[8px] font-black text-indigo-400 bg-slate-900/90 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                Selected Region
              </span>
            </div>

            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded-md">
              {task.chapter}
            </div>
          </div>
        </div>

        {/* Right: Instructions & Reference Files */}
        <div className="space-y-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Task Instruction</p>
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4">
              <p className="text-[11px] font-bold text-slate-300 mb-1">Annotation Type: <span className="text-indigo-400">{task.annotationType}</span></p>
              {task.annotationType === 'Background' && (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Draw a detailed urban nightscape background for the highlighted panel. Use the reference cityscape provided. Perspective point is upper-center. Avoid covering character silhouettes in panels 1 and 3.
                </p>
              )}
              {task.annotationType === 'Shading' && (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Apply cel-shading to the main character in the right panel. Light source is from upper-left at 45°. Use gradient fill for hair and flat tones for clothing.
                </p>
              )}
              {task.annotationType === 'Effects' && (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Add speed-line motion effects radiating from the focal point (marked circle). Stroke weight 1.5px, 80 lines, angle range ±35°. No blur — sharp lines only.
                </p>
              )}
              {!['Background', 'Shading', 'Effects'].includes(task.annotationType) && (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Follow the annotation guide provided in the reference files. Complete the highlighted region according to the Mangaka&apos;s instructions.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Reference Files</p>
            <div className="space-y-2">
              {[
                { name: 'reference_cityscape.psd', size: '24.2 MB', type: 'PSD' },
                { name: 'character_guide.png', size: '3.1 MB', type: 'PNG' },
              ].map(f => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 p-2.5 bg-slate-950/20 border border-slate-850 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-950/10 transition-colors cursor-pointer group"
                >
                  <Paperclip size={12} className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-350 truncate">{f.name}</p>
                    <p className="text-[8px] font-medium text-slate-500">{f.size}</p>
                  </div>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{f.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            {task.pageFileAssetId && (
              <button
                onClick={() => onDownloadAsset(task.pageFileAssetId!, `${task.title}_Reference.png`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-300 transition-colors"
              >
                <Download size={13} />Download Reference
              </button>
            )}
            {task.status === TaskStatus.Todo && (
              <button
                onClick={() => onStart(task.id)}
                disabled={isStarting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-700 hover:bg-indigo-850 text-white transition-colors"
              >
                <Play size={13} />
                {isStarting ? 'Starting...' : 'Start Task'}
              </button>
            )}
            {(task.status === TaskStatus.InProgress || task.status === TaskStatus.RevisionRequired) && (
              <button
                onClick={() => onSubmitClick(task)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
              >
                <Upload size={13} />Submit Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

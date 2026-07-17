import React, { useState, useRef } from 'react';
import { X, Sparkles, Upload } from 'lucide-react';

interface TaskSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, note: string) => Promise<void>;
  isSubmitting: boolean;
  taskTitle: string;
}

export default function TaskSubmitModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  taskTitle,
}: TaskSubmitModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await onSubmit(file, note);
    setFile(null);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 text-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-850">
          <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 animate-bounce" />
            Submit Task: {taskTitle}
          </h3>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Attach Drawing Output <span className="text-rose-500">*</span>
            </label>
            <div 
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer flex flex-col items-center gap-2 transition-colors ${
                file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 hover:border-indigo-500/50 bg-slate-950/20'
              } ${isSubmitting ? 'opacity-55 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                required
                disabled={isSubmitting}
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload size={18} className={file ? 'text-emerald-450' : 'text-slate-500'} />
              <span className="text-xs font-semibold block text-slate-350">
                {file ? file.name : 'Select sketch, png or psd file'}
              </span>
              {file && (
                <span className="text-[10px] text-slate-500 block font-mono">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Submission Note
            </label>
            <textarea
              disabled={isSubmitting}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Inked outlines are finished. Ready for shading review."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-semibold resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Output'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

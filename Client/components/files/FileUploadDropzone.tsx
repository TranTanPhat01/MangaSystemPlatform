import React, { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { FileCategory } from '@/types/file';

interface FileUploadDropzoneProps {
  onUpload: (file: File, category: FileCategory) => void;
  isUploading: boolean;
  uploadProgress?: number;
}

export default function FileUploadDropzone({ onUpload, isUploading, uploadProgress = 0 }: FileUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const allowedExtensions = ['psd', 'pdf', 'png', 'jpg', 'jpeg', 'webp'];
  const maxFileSizeBytes = 20 * 1024 * 1024; // 20MB limit

  const validateAndUpload = (file: File) => {
    setValidationError(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      setValidationError(`Unsupported file format. Please upload PSD, PDF, PNG, JPG, or WEBP.`);
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setValidationError(`File size exceeds the 20MB limit. (Current: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      return;
    }

    onUpload(file, 'Other');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    const file = e.target.files?.[0];
    if (file) {
      validateAndUpload(file);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Avoid triggering input click multiple times if target clicked is the input itself
    if (e.target === fileInputRef.current) return;
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3 w-full">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-xl p-8 text-center bg-slate-900/10 hover:bg-slate-900/20 transition-all cursor-pointer flex flex-col items-center gap-3 ${
          isUploading ? 'border-indigo-500/30 cursor-not-allowed opacity-60' : 'border-slate-800 hover:border-indigo-500/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400">
          {isUploading ? (
            <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload size={20} />
          )}
        </div>
        <div>
          <span className="font-semibold text-sm text-slate-200 block">
            {isUploading ? 'Uploading file...' : 'Click or drag file here to upload'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Supports PSD, PDF, PNG, JPG, WEBP (Max 20MB)
          </span>
        </div>

        {isUploading && (
          <div className="w-full max-w-xs mt-2">
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-indigo-400 mt-1 block uppercase font-mono tracking-wider">
              {uploadProgress}% Uploaded
            </span>
          </div>
        )}
      </div>

      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={14} className="shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

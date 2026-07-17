import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { FileCategory } from '@/types/file';

interface FileUploadDropzoneProps {
  onUpload: (file: File, category: FileCategory) => void;
  isUploading: boolean;
}

export default function FileUploadDropzone({ onUpload, isUploading }: FileUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file, 'Other');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, 'Other');
    }
  };

  const handleClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  return (
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
      <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-455">
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
          Supports PSD, PDF, PNG, JPG (Max 500MB)
        </span>
      </div>
    </div>
  );
}

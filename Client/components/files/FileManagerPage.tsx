'use client';

import React, { useEffect } from 'react';
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper';
import FileUploadDropzone from './FileUploadDropzone';
import FileListTable from './FileListTable';
import { useFiles } from '@/hooks/useFiles';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { FileCategory } from '@/types/file';

export default function FileManagerPage() {
  const {
    files,
    isLoading,
    isUploading,
    error,
    successMessage,
    uploadFile,
    downloadFile,
    deleteFile,
    clearError,
    clearSuccess,
  } = useFiles();

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

  const handleUpload = (file: File, category: FileCategory) => {
    uploadFile(file, category);
  };

  const handleDownload = async (id: string, name: string) => {
    const isMock = files.find(f => f.id === id)?.isMock;
    if (isMock) {
      // Mock alert
      alert(`Tệp "${name}" là dữ liệu mẫu (Mock data) nên không có nội dung thực tế trên server.`);
      return;
    }
    await downloadFile(id, name);
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

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-100 mb-1">Asset Manager</h1>
            <p className="text-xs text-slate-500 font-medium">Upload drafts, blueprints, screentones, and finalized PDF/PSD manuscripts.</p>
          </div>
        </div>

        {/* Drag and Drop Upload Dropzone */}
        <FileUploadDropzone onUpload={handleUpload} isUploading={isUploading} />

        {/* Uploaded Files Table */}
        <FileListTable
          files={files}
          onDownload={handleDownload}
          onDelete={deleteFile}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayoutWrapper>
  );
}

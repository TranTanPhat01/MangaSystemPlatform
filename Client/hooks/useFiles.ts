import { useCallback, useEffect, useState } from 'react';
import { fileApi } from '@/services/file-api';
import { FileAssetResponse, FileCategory } from '@/types/file';

const errorText = (error: unknown): string => {
  const value = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
  if (value.response?.status === 403) return 'Forbidden: you do not have permission to access files.';
  return value.response?.data?.message || value.message || 'File request failed.';
};

export function useFiles() {
  const [files, setFiles] = useState<FileAssetResponse[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isUploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fileApi.getMyFiles();
      if (!r.data.success) throw new Error(r.data.message);
      setFiles(r.data.data);
    } catch (e) {
      setFiles([]);
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadFile = async (file: File, category: FileCategory) => {
    setUploading(true);
    setUploadProgress(10);
    setError(null);
    try {
      const r = await fileApi.uploadFile(file, category);
      if (!r.data.success) throw new Error(r.data.message);
      setUploadProgress(100);
      await load();
      setSuccess(`Uploaded ${r.data.data.originalFileName}`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getBlob = async (id: string) => {
    const r = await fileApi.downloadFile(id);
    return URL.createObjectURL(r.data);
  };

  const downloadFile = async (id: string, name: string) => {
    try {
      const url = await getBlob(id);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const previewFile = async (id: string) => {
    try {
      const url = await getBlob(id);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const deleteFile = async (id: string) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      const r = await fileApi.deleteFile(id);
      if (!r.data.success) throw new Error(r.data.message);
      await load();
      setSuccess('File deleted.');
    } catch (e) {
      setError(errorText(e));
    }
  };

  return {
    files,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    successMessage,
    uploadFile,
    downloadFile,
    previewFile,
    deleteFile,
    fetchFiles: load,
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
  };
}ccess(null)}}

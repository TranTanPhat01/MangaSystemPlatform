import { useState } from 'react';
import { fileApi } from '@/services/file-api';
import { mockFiles, MockFileItem } from '@/data/mock/files.mock';
import { FileCategory } from '@/types/file';

export function useFiles() {
  const [files, setFiles] = useState<MockFileItem[]>(mockFiles);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccessMessage(null);

  const uploadFile = async (file: File, category: FileCategory = 'Other') => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fileApi.uploadFile(file, category);
      if (res.data && res.data.success) {
        const fileData = res.data.data;
        const newFileItem: MockFileItem = {
          id: fileData.id,
          name: fileData.originalFileName,
          size: formatBytes(fileData.sizeBytes),
          uploader: 'You',
          date: new Date(fileData.createdAt).toLocaleDateString(),
          isMock: false,
        };
        setFiles((prev) => [newFileItem, ...prev]);
        setSuccessMessage(`File "${file.name}" uploaded successfully!`);
      } else {
        setError(res.data?.message || 'Failed to upload file.');
      }
    } catch (err: any) {
      handleApiError(err, 'upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadFile = async (id: string, fileName: string) => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fileApi.downloadFile(id);
      
      // Axios response standard is `res.data` containing the Blob when responseType is blob
      const blob = res.data;
      if (!(blob instanceof Blob)) {
        throw new Error('Response is not a valid binary file stream.');
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      setSuccessMessage(`File "${fileName}" downloaded successfully.`);
    } catch (err: any) {
      handleApiError(err, 'download');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSuccessMessage('File removed from local view.');
  };

  const handleApiError = (err: any, action: 'upload' | 'download') => {
    const status = err.response?.status;
    let msg = `An error occurred while trying to ${action} the file.`;

    if (status === 401) {
      msg = 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại.';
    } else if (status === 403) {
      msg = 'Bạn không có quyền thực hiện hành động này đối với file này.';
    } else if (status === 404) {
      msg = 'File không tồn tại trên hệ thống.';
    } else if (status >= 500) {
      msg = 'Dịch vụ file tạm thời không khả dụng. Vui lòng thử lại sau.';
    } else {
      msg = err.response?.data?.message || err.message || msg;
    }

    setError(msg);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
    deleteFile,
    clearError,
    clearSuccess,
  };
}

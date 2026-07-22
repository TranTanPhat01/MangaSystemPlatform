/**
 * File API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 * Route: /files/**
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import {
  FileAssetResponse,
  FileUploadResponse,
  FileVersionResponse,
  FileUrlResponse,
  FileCategory,
} from '@/types/file';

export const fileApi = {
  /**
   * POST /files/upload
   * Uploads a file using multipart/form-data.
   * Returns FileUploadResponse with the new file's ID and URL.
   */
  uploadFile: (file: File, category: FileCategory = 'Other', metadata?: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => formData.append(key, value));
    }
    return api.post<ApiResponse<FileUploadResponse>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * GET /files/my
   * Returns files belonging to the current user
   */
  getMyFiles: () =>
    api.get<ApiResponse<FileAssetResponse[]>>('/files/my'),

  /**
   * GET /files/{id}
   * Returns file metadata (no binary content)
   */
  getFileMetadata: (id: string) =>
    api.get<ApiResponse<FileAssetResponse>>(`/files/${id}`),

  /**
   * GET /files/{id}/url
   * Returns a pre-signed or direct download URL for the file
   */
  getFileUrl: (id: string) =>
    api.get<ApiResponse<FileUrlResponse>>(`/files/${id}/url`),

  /**
   * GET /files/{id}/download
   * Downloads the file as a Blob (binary stream)
   */
  downloadFile: (id: string) =>
    api.get<Blob>(`/files/${id}/download`, { responseType: 'blob' }),

  /**
   * GET /files/{id}/versions
   * Returns all versions of a file asset
   */
  getFileVersions: (id: string) =>
    api.get<ApiResponse<FileVersionResponse[]>>(`/files/${id}/versions`),

  createVersion: (id: string, file: File) => { const data=new FormData(); data.append('file',file); return api.post<ApiResponse<FileVersionResponse>>(`/files/${id}/versions`,data,{headers:{'Content-Type':'multipart/form-data'}}); },
  deleteFile: (id: string) => api.delete<ApiResponse<object>>(`/files/${id}`),
};

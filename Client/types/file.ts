// ─── File Domain DTOs ─────────────────────────────────────────────────────────

export type FileCategory = 'PageScan' | 'CoverArt' | 'Reference' | 'Submission' | 'Other';

export interface FileAssetResponse {
  id: string;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  extension: string;
  sizeInBytes: number;
  storageProvider: string;
  storagePath: string;
  publicUrl?: string;
  uploadedByUserId: string;
  fileCategory: FileCategory;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FileUploadResponse {
  fileId: string;
  id?: string;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  sizeInBytes: number;
  fileCategory: FileCategory;
  publicUrl?: string;
  createdAt: string;
}

export interface FileVersionResponse {
  id: string;
  fileAssetId: string;
  versionNumber: number;
  storedFileName: string;
  storagePath: string;
  sizeInBytes: number;
  createdAt: string;
  createdByUserId: string;
}

export interface FileUrlResponse {
  publicUrl?: string;
  url: string;
  expiresAt?: string;
}

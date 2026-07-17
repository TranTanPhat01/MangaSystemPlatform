// ─── File Domain DTOs ─────────────────────────────────────────────────────────

export type FileCategory = 'PageScan' | 'CoverArt' | 'Reference' | 'Submission' | 'Other';

export interface FileAssetResponse {
  id: string;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  sizeBytes: number;
  category: FileCategory;
  uploadedById: string;
  uploadedByName?: string;
  url?: string;
  downloadUrl?: string;
  createdAt: string;
  versionCount?: number;
}

export interface FileUploadResponse {
  id: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  category: FileCategory;
  url: string;
  createdAt: string;
}

export interface FileVersionResponse {
  id: string;
  fileAssetId: string;
  versionNumber: number;
  storedFileName: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedById: string;
}

export interface FileUrlResponse {
  url: string;
  expiresAt?: string;
}

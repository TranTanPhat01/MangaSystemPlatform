// ─── Manga Domain DTOs ────────────────────────────────────────────────────────
// All types based on MangaSystemPlatform backend response structure

export type SeriesStatus = 'Draft' | 'Submitted' | 'Approved' | 'Ongoing' | 'Hiatus' | 'Completed' | 'Cancelled' | 'RevisionRequested' | 'Rejected' | 'Active';
export type PublicationFrequency = 'Weekly' | 'Biweekly' | 'Monthly' | 'Irregular';
export type ChapterStatus = 'Draft' | 'InProduction' | 'SubmittedForReview' | 'RevisionRequired' | 'Approved' | 'Scheduled' | 'Published' | 'Rejected' | 'InProgress';
export type TaskStatus = 'Pending' | 'InProgress' | 'Submitted' | 'Approved' | 'RevisionRequired' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type AnnotationType = 'Background' | 'CharacterInk' | 'Screentone' | 'Effects' | 'Lettering' | 'Color' | 'Other';

export interface SeriesResponse {
  id: string;
  title: string;
  description?: string;
  mangakaId: string;
  mangakaName?: string;
  genre?: string;
  status: SeriesStatus;
  frequency?: PublicationFrequency;
  coverImageUrl?: string;
  chapterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeriesRequest {
  title: string;
  description?: string;
  genre?: string;
  frequency?: PublicationFrequency;
}

export interface ChapterResponse {
  id: string;
  seriesId: string;
  seriesTitle?: string;
  chapterNumber: number;
  title?: string;
  status: ChapterStatus;
  progressPercentage?: number;
  deadline?: string;
  pageCount?: number;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PageResponse {
  id: string;
  chapterId: string;
  pageNumber: number;
  fileId?: string;
  fileAssetId?: string;
  fileUrl?: string;
  status: string;
  createdAt: string;
}

export interface AnnotationResponse {
  id: string;
  pageId: string;
  type: AnnotationType;
  coordinatesJson?: string;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface TaskResponse {
  id: string;
  title?: string;
  pageId: string;
  chapterId?: string;
  seriesId?: string;
  seriesTitle?: string;
  chapterTitle?: string;
  pageNumber?: number;
  assignedToId: string;
  assignedToName?: string;
  assignedById?: string;
  annotationType?: AnnotationType;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  fileAssetId?: string;
  submittedFileUrl?: string;
  revisionNote?: string;
  startedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartTaskRequest {
  taskId: string;
}

export interface SubmitTaskRequest {
  fileId: string;
  note?: string;
}


export interface RequestRevisionRequest {
  revisionNote: string;
}

export interface SubmissionResponse {
  id: string;
  chapterId: string;
  submittedById: string;
  status: string;
  reviewId?: string;
  submittedAt: string;
}

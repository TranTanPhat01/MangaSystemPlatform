// ─── Manga Domain DTOs ────────────────────────────────────────────────────────
// All types based on MangaSystemPlatform backend response structure

export type SeriesStatus = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ChapterStatus = 'Draft' | 'InProduction' | 'SubmittedForReview' | 'RevisionRequired' | 'Approved' | 'Scheduled' | 'Published' | 'Rejected' | 'InProgress';
export enum TaskStatus {
  Todo = 1,
  InProgress = 2,
  Submitted = 3,
  RevisionRequired = 4,
  Approved = 5,
  Cancelled = 6,
}
export enum TaskPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Urgent = 4,
}
export type AnnotationType = 'Background' | 'CharacterInk' | 'Screentone' | 'Effects' | 'Lettering' | 'Color' | 'Other';

export interface SeriesResponse {
  id: string;
  studioId: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  status: SeriesStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateSeriesRequest {
  studioId: string;
  title: string;
  description?: string;
  genre?: string;
}

/**
 * Matches the numeric JSON representation of the backend SeriesStatus enum.
 * The Manga Management API does not configure JsonStringEnumConverter.
 */
export type UpdateSeriesStatus = SeriesStatus;

/** Matches Manga.Management.Application.DTOs.UpdateSeriesRequest. */
export interface UpdateSeriesRequest {
  title?: string;
  description?: string;
  genre?: string;
  status?: UpdateSeriesStatus;
}

export interface SeriesDecisionRequest {
  decisionNote?: string;
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
  coordinatesJson: string;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface TaskResponse {
  id: string;
  annotationId: string;
  pageId: string;
  pageNumber: number;
  pageFileId?: string | null;
  title: string;
  description?: string;
  assignedToUserId: string;
  createdByUserId: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  latestSubmission?: TaskSubmissionResponse | null;
  submissionHistory?: TaskSubmissionResponse[];
  revisions: TaskRevisionResponse[];
}

export interface CreateTaskRequest {
  annotationId: string;
  pageId: string;
  title: string;
  description?: string;
  assignedToUserId: string;
  priority: TaskPriority;
  deadline?: string;
}

export interface SubmitTaskRequest {
  fileId: string;
  note?: string;
}

export interface RequestTaskRevisionRequest {
  reason: string;
}

export interface TaskSubmissionResponse {
  id: string;
  taskId: string;
  submittedByUserId: string;
  fileId?: string | null;
  note?: string | null;
  status: 1 | 2 | 3;
  submittedAt: string;
}

export interface TaskRevisionResponse {
  id: string;
  taskId: string;
  requestedByUserId: string;
  reason: string;
  createdAt: string;
}

export interface SubmissionResponse {
  id: string;
  chapterId: string;
  submittedById: string;
  status: string;
  reviewId?: string;
  submittedAt: string;
}

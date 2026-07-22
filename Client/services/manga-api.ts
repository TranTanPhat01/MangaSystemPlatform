/**
 * Manga API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 * Route: /manga/**
 */
import { api } from '@/lib/api';
import { requireNonEmptyGuid } from '@/lib/guid';
import { ApiResponse } from '@/types/api';
import {
  SeriesResponse,
  CreateSeriesRequest,
  UpdateSeriesRequest,
  ChapterResponse,
  PageResponse,
  TaskResponse,
  CreateTaskRequest,
  SubmitTaskRequest,
  TaskSubmissionResponse,
  RequestTaskRevisionRequest,
  AnnotationResponse,
  AnnotationType,
  SubmissionResponse,
} from '@/types/manga';

// ─── Series ──────────────────────────────────────────────────────────────────

export const mangaApi = {
  // Series
  getSeries: () =>
    api.get<ApiResponse<SeriesResponse[]>>('/manga/series'),

  getSeriesById: (id: string) =>
    api.get<ApiResponse<SeriesResponse>>(`/manga/series/${id}`),

  createSeries: (data: CreateSeriesRequest) =>
    api.post<ApiResponse<SeriesResponse>>('/manga/series', data),

  updateSeries: (id: string, data: UpdateSeriesRequest) =>
    api.patch<ApiResponse<SeriesResponse>>(`/manga/series/${id}`, data),

  submitProposal: (seriesId: string) =>
    api.post<ApiResponse<SubmissionResponse>>(`/manga/series/${seriesId}/submit-proposal`),

  // ─── Chapters ──────────────────────────────────────────────────────────────

  createChapter: (
    seriesId: string,
    data: { chapterNumber: number; title?: string; deadline?: string; progressPercentage?: number }
  ) =>
    api.post<ApiResponse<ChapterResponse>>(`/manga/series/${seriesId}/chapters`, data),

  getChapters: (seriesId: string) =>
    api.get<ApiResponse<ChapterResponse[]>>(`/manga/series/${seriesId}/chapters`),

  getChapterById: (chapterId: string) =>
    api.get<ApiResponse<ChapterResponse>>(`/manga/chapters/${chapterId}`),

  submitChapterForReview: (chapterId: string) =>
    api.post<ApiResponse<SubmissionResponse>>(`/manga/chapters/${chapterId}/submit-review`),

  // ─── Pages ─────────────────────────────────────────────────────────────────

  createPage: (chapterId: string, data: { pageNumber: number; fileId?: string }) =>
    api.post<ApiResponse<PageResponse>>(`/manga/chapters/${chapterId}/pages`, data),

  getPages: (chapterId: string) =>
    api.get<ApiResponse<PageResponse[]>>(`/manga/chapters/${chapterId}/pages`),

  getPage: (pageId: string) =>
    api.get<ApiResponse<PageResponse>>(`/manga/pages/${pageId}`),

  // ─── Annotations ───────────────────────────────────────────────────────────

  createAnnotation: (
    pageId: string,
    data: { type: AnnotationType; coordinatesJson?: string; description?: string; notes?: string }
  ) =>
    api.post<ApiResponse<AnnotationResponse>>(`/manga/pages/${pageId}/annotations`, data),

  deleteAnnotation: (annotationId: string) =>
    api.delete<ApiResponse<null>>(`/manga/annotations/${annotationId}`),

  getPageAnnotations: (pageId: string) =>
    api.get<ApiResponse<AnnotationResponse[]>>(`/manga/pages/${pageId}/annotations`),

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  createTask: (data: CreateTaskRequest) => {
    requireNonEmptyGuid(data.annotationId, 'annotationId');
    requireNonEmptyGuid(data.pageId, 'pageId');
    requireNonEmptyGuid(data.assignedToUserId, 'assignedToUserId');
    return api.post<ApiResponse<TaskResponse>>('/manga/tasks', data);
  },

  /**
   * GET /manga/tasks/my
   * Returns tasks assigned to the currently authenticated user (Assistant role)
   */
  getMyTasks: () =>
    api.get<ApiResponse<TaskResponse[]>>('/manga/tasks/my'),

  getTaskById: (taskId: string) =>
    api.get<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}`),

  /**
   * POST /manga/tasks/{id}/start
   * Marks task as InProgress
   */
  startTask: (taskId: string) => {
    requireNonEmptyGuid(taskId, 'taskId');
    return api.post<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}/start`);
  },

  /**
   * POST /manga/tasks/{id}/submit
   * Submits completed task with a file asset
   */
  submitTask: (taskId: string, data: SubmitTaskRequest) => {
    requireNonEmptyGuid(taskId, 'taskId'); requireNonEmptyGuid(data.fileId, 'fileId');
    return api.post<ApiResponse<TaskSubmissionResponse>>(`/manga/tasks/${taskId}/submit`, data);
  },

  /**
   * POST /manga/tasks/{id}/approve
   * Mangaka approves submitted task
   */
  approveTask: (taskId: string) => {
    requireNonEmptyGuid(taskId, 'taskId');
    return api.post<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}/approve`);
  },

  /**
   * POST /manga/tasks/{id}/request-revision
   * Mangaka requests revision on submitted task
   */
  requestTaskRevision: (taskId: string, data: RequestTaskRevisionRequest) => {
    requireNonEmptyGuid(taskId, 'taskId');
    if (!data.reason.trim()) throw new Error('reason is required.');
    return api.post<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}/request-revision`, data);
  },
};

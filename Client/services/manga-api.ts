/**
 * Manga API Service
 * All calls go through API Gateway at NEXT_PUBLIC_API_BASE_URL
 * Route: /manga/**
 */
import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import {
  SeriesResponse,
  CreateSeriesRequest,
  ChapterResponse,
  PageResponse,
  TaskResponse,
  StartTaskRequest,
  SubmitTaskRequest,
  RequestRevisionRequest,
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

  updateSeries: (id: string, data: Partial<CreateSeriesRequest>) =>
    api.put<ApiResponse<SeriesResponse>>(`/manga/series/${id}`, data),

  submitProposal: (seriesId: string) =>
    api.post<ApiResponse<SubmissionResponse>>(`/manga/series/${seriesId}/submit-proposal`),

  // ─── Chapters ──────────────────────────────────────────────────────────────

  createChapter: (seriesId: string, data: { chapterNumber: number; title?: string }) =>
    api.post<ApiResponse<ChapterResponse>>(`/manga/series/${seriesId}/chapters`, data),

  getChapterById: (chapterId: string) =>
    api.get<ApiResponse<ChapterResponse>>(`/manga/chapters/${chapterId}`),

  submitChapterForReview: (chapterId: string) =>
    api.post<ApiResponse<SubmissionResponse>>(`/manga/chapters/${chapterId}/submit`),

  // ─── Pages ─────────────────────────────────────────────────────────────────

  createPage: (chapterId: string, data: { pageNumber: number; fileAssetId?: string }) =>
    api.post<ApiResponse<PageResponse>>(`/manga/chapters/${chapterId}/pages`, data),

  getPage: (pageId: string) =>
    api.get<ApiResponse<PageResponse>>(`/manga/pages/${pageId}`),

  // ─── Annotations ───────────────────────────────────────────────────────────

  createAnnotation: (pageId: string, data: { type: AnnotationType; notes?: string }) =>
    api.post<ApiResponse<AnnotationResponse>>(`/manga/pages/${pageId}/annotations`, data),

  deleteAnnotation: (annotationId: string) =>
    api.delete<ApiResponse<null>>(`/manga/annotations/${annotationId}`),

  // ─── Tasks ─────────────────────────────────────────────────────────────────

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
  startTask: (taskId: string) =>
    api.post<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}/start`),

  /**
   * POST /manga/tasks/{id}/submit
   * Submits completed task with a file asset
   */
  submitTask: (taskId: string, data: SubmitTaskRequest) =>
    api.post<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}/submit`, data),

  /**
   * POST /manga/tasks/{id}/approve
   * Mangaka approves submitted task
   */
  approveTask: (taskId: string) =>
    api.post<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}/approve`),

  /**
   * POST /manga/tasks/{id}/request-revision
   * Mangaka requests revision on submitted task
   */
  requestTaskRevision: (taskId: string, data: RequestRevisionRequest) =>
    api.post<ApiResponse<TaskResponse>>(`/manga/tasks/${taskId}/request-revision`, data),
};

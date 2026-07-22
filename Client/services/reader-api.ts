import { api } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { CreateBookmarkRequest, CreateCommentRequest, ReaderActivitySummaryResponse, ReaderBookmarkResponse, ReaderCommentResponse, ReaderFavoriteResponse, ReadingProgressResponse, RatingSummaryResponse, SaveReadingProgressRequest, UpdateCommentRequest, UpsertRatingRequest } from '@/types/reader';

const paged = (page: number, pageSize: number) => ({ params: { page, pageSize } });

export const readerApi = {
  addFavorite: (seriesId: string) => api.post<ApiResponse<ReaderFavoriteResponse>>(`/manga/reader/favorites/${seriesId}`),
  removeFavorite: (seriesId: string) => api.delete<ApiResponse<boolean>>(`/manga/reader/favorites/${seriesId}`),
  getFavorites: (page = 1, pageSize = 20) => api.get<ApiResponse<ReaderFavoriteResponse[]>>('/manga/reader/favorites', paged(page, pageSize)),
  addBookmark: (request: CreateBookmarkRequest) => api.post<ApiResponse<ReaderBookmarkResponse>>('/manga/reader/bookmarks', request),
  removeBookmark: (id: string) => api.delete<ApiResponse<boolean>>(`/manga/reader/bookmarks/${id}`),
  getBookmarks: (page = 1, pageSize = 20) => api.get<ApiResponse<ReaderBookmarkResponse[]>>('/manga/reader/bookmarks', paged(page, pageSize)),
  saveProgress: (request: SaveReadingProgressRequest) => api.put<ApiResponse<ReadingProgressResponse>>('/manga/reader/progress', request),
  continueReading: () => api.get<ApiResponse<ReadingProgressResponse>>('/manga/reader/continue-reading'),
  getHistory: (page = 1, pageSize = 20) => api.get<ApiResponse<ReadingProgressResponse[]>>('/manga/reader/history', paged(page, pageSize)),
  clearHistory: () => api.delete<ApiResponse<boolean>>('/manga/reader/history'),
  getActivitySummary: () => api.get<ApiResponse<ReaderActivitySummaryResponse>>('/manga/reader/activity-summary'),
  rate: (seriesId: string, request: UpsertRatingRequest) => api.put<ApiResponse<RatingSummaryResponse>>(`/manga/reader/ratings/${seriesId}`, request),
  removeRating: (seriesId: string) => api.delete<ApiResponse<boolean>>(`/manga/reader/ratings/${seriesId}`),
  getRatingSummary: (seriesId: string) => api.get<ApiResponse<RatingSummaryResponse>>(`/manga/series/${seriesId}/ratings/summary`),
  addSeriesComment: (seriesId: string, request: CreateCommentRequest) => api.post<ApiResponse<ReaderCommentResponse>>(`/manga/series/${seriesId}/comments`, request),
  addChapterComment: (chapterId: string, request: CreateCommentRequest) => api.post<ApiResponse<ReaderCommentResponse>>(`/manga/chapters/${chapterId}/comments`, request),
  updateComment: (id: string, request: UpdateCommentRequest) => api.put<ApiResponse<ReaderCommentResponse>>(`/manga/comments/${id}`, request),
  deleteComment: (id: string) => api.delete<ApiResponse<boolean>>(`/manga/comments/${id}`),
  getSeriesComments: (seriesId: string, page = 1, pageSize = 20) => api.get<ApiResponse<ReaderCommentResponse[]>>(`/manga/series/${seriesId}/comments`, paged(page, pageSize)),
  getChapterComments: (chapterId: string, page = 1, pageSize = 20) => api.get<ApiResponse<ReaderCommentResponse[]>>(`/manga/chapters/${chapterId}/comments`, paged(page, pageSize)),
};
export interface CreateBookmarkRequest {
  chapterId: string;
  pageId?: string;
}

export interface SaveReadingProgressRequest {
  seriesId: string;
  chapterId: string;
  pageId?: string;
  allowBackward?: boolean;
}

export interface ReaderFavoriteResponse { id: string; seriesId: string; createdAt: string; }
export interface ReaderBookmarkResponse { id: string; chapterId: string; pageId?: string | null; createdAt: string; }
export interface ReadingProgressResponse { seriesId: string; chapterId: string; pageId?: string | null; lastReadAt: string; }
export interface UpsertRatingRequest { value: 1 | 2 | 3 | 4 | 5; }
export interface RatingSummaryResponse { seriesId: string; average: number; count: number; }
export interface CreateCommentRequest { content: string; }
export interface UpdateCommentRequest { content: string; }
export interface ReaderCommentResponse { id: string; userId: string; seriesId?: string | null; chapterId?: string | null; content: string; createdAt: string; updatedAt?: string | null; }
export interface ReaderActivitySummaryResponse { favoriteCount: number; bookmarkCount: number; historyCount: number; ratingCount: number; commentCount: number; }
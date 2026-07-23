import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readerApi } from '@/services/reader-api';
import { 
  ReaderFavoriteResponse, 
  ReaderBookmarkResponse, 
  ReadingProgressResponse,
  RatingSummaryResponse,
  ReaderCommentResponse,
  ReaderActivitySummaryResponse,
  CreateBookmarkRequest,
  SaveReadingProgressRequest,
  UpsertRatingRequest,
  CreateCommentRequest,
  UpdateCommentRequest
} from '@/types/reader';

export const useReader = () => {
  const queryClient = useQueryClient();

  // Favorites
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await readerApi.getFavorites(1, 100);
      return res.data.data || [];
    },
  });

  const addFavorite = useMutation({
    mutationFn: (seriesId: string) => readerApi.addFavorite(seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: (seriesId: string) => readerApi.removeFavorite(seriesId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  // Bookmarks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await readerApi.getBookmarks(1, 100);
      return res.data.data || [];
    },
  });

  const addBookmark = useMutation({
    mutationFn: (request: CreateBookmarkRequest) => readerApi.addBookmark(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  const removeBookmark = useMutation({
    mutationFn: (id: string) => readerApi.removeBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  // History
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['reading-history'],
    queryFn: async () => {
      const res = await readerApi.getHistory(1, 100);
      return res.data.data || [];
    },
  });

  const saveProgress = useMutation({
    mutationFn: (request: SaveReadingProgressRequest) => readerApi.saveProgress(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-history'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  const continueReading = useQuery({
    queryKey: ['continue-reading'],
    queryFn: async () => {
      const res = await readerApi.continueReading();
      return res.data.data || null;
    },
  });

  const clearHistory = useMutation({
    mutationFn: () => readerApi.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-history'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  // Ratings
  const getRatingSummary = (seriesId: string) => {
    return useQuery({
      queryKey: ['rating-summary', seriesId],
      queryFn: async () => {
        const res = await readerApi.getRatingSummary(seriesId);
        return res.data.data || null;
      },
    });
  };

  const rateSeriesMutation = useMutation({
    mutationFn: (params: { seriesId: string; request: UpsertRatingRequest }) =>
      readerApi.rate(params.seriesId, params.request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rating-summary', variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  const removeRating = useMutation({
    mutationFn: (seriesId: string) => readerApi.removeRating(seriesId),
    onSuccess: (_, seriesId) => {
      queryClient.invalidateQueries({ queryKey: ['rating-summary', seriesId] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  // Comments
  const getSeriesComments = (seriesId: string) => {
    return useQuery({
      queryKey: ['series-comments', seriesId],
      queryFn: async () => {
        const res = await readerApi.getSeriesComments(seriesId, 1, 100);
        return res.data.data || [];
      },
    });
  };

  const getChapterComments = (chapterId: string) => {
    return useQuery({
      queryKey: ['chapter-comments', chapterId],
      queryFn: async () => {
        const res = await readerApi.getChapterComments(chapterId, 1, 100);
        return res.data.data || [];
      },
    });
  };

  const addSeriesComment = useMutation({
    mutationFn: (params: { seriesId: string; request: CreateCommentRequest }) =>
      readerApi.addSeriesComment(params.seriesId, params.request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['series-comments', variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  const addChapterComment = useMutation({
    mutationFn: (params: { chapterId: string; request: CreateCommentRequest }) =>
      readerApi.addChapterComment(params.chapterId, params.request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chapter-comments', variables.chapterId] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  const updateComment = useMutation({
    mutationFn: (params: { id: string; request: UpdateCommentRequest }) =>
      readerApi.updateComment(params.id, params.request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series-comments'] });
      queryClient.invalidateQueries({ queryKey: ['chapter-comments'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => readerApi.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series-comments'] });
      queryClient.invalidateQueries({ queryKey: ['chapter-comments'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
    },
  });

  // Activity Summary
  const { data: activitySummary } = useQuery({
    queryKey: ['activity-summary'],
    queryFn: async () => {
      const res = await readerApi.getActivitySummary();
      return res.data.data || null;
    },
  });

  return {
    // Favorites
    favorites,
    favoritesLoading,
    addFavorite,
    removeFavorite,

    // Bookmarks
    bookmarks,
    bookmarksLoading,
    addBookmark,
    removeBookmark,

    // History
    history,
    historyLoading,
    saveProgress,
    continueReading,
    clearHistory,

    // Ratings
    getRatingSummary,
    rateSeriesMutation,
    removeRating,

    // Comments
    getSeriesComments,
    getChapterComments,
    addSeriesComment,
    addChapterComment,
    updateComment,
    deleteComment,

    // Activity
    activitySummary,
  };
};

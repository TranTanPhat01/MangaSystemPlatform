using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;

namespace Manga.Management.Application.Abstractions;

public interface IReaderRepository
{
    Task<ReaderFavorite?> GetFavoriteAsync(Guid userId, Guid seriesId, CancellationToken cancellationToken = default);
    Task<ReaderBookmark?> GetBookmarkAsync(Guid userId, Guid chapterId, Guid? pageId, CancellationToken cancellationToken = default);
    Task<ReadingProgress?> GetProgressAsync(Guid userId, Guid seriesId, CancellationToken cancellationToken = default);
    Task<ReadingProgress?> GetLatestProgressAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ReadingHistory?> GetHistoryAsync(Guid userId, Guid chapterId, CancellationToken cancellationToken = default);
    Task<SeriesRating?> GetRatingAsync(Guid userId, Guid seriesId, CancellationToken cancellationToken = default);
    Task<ReaderComment?> GetCommentAsync(Guid commentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetFavoriteUserIdsAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReaderFavoriteResponse>> GetFavoritesAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReaderBookmarkResponse>> GetBookmarksAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReadingProgressResponse>> GetHistoryAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReaderCommentResponse>> GetCommentsAsync(Guid? seriesId, Guid? chapterId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<(int Count, double Average)> GetRatingSummaryAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<ReaderActivitySummaryResponse> GetActivitySummaryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReadingHistory>> GetHistoryEntitiesAsync(Guid userId, CancellationToken cancellationToken = default);
}

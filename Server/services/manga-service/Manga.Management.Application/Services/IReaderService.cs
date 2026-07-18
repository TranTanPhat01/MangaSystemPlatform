using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Services;

public interface IReaderService
{
    Task<Result<ReaderFavoriteResponse>> AddFavoriteAsync(Guid seriesId, CancellationToken ct = default);
    Task<Result<bool>> RemoveFavoriteAsync(Guid seriesId, CancellationToken ct = default);
    Task<Result<IReadOnlyList<ReaderFavoriteResponse>>> GetFavoritesAsync(int page, int pageSize, CancellationToken ct = default);
    Task<Result<ReaderBookmarkResponse>> AddBookmarkAsync(CreateBookmarkRequest request, CancellationToken ct = default);
    Task<Result<bool>> RemoveBookmarkAsync(Guid id, CancellationToken ct = default);
    Task<Result<IReadOnlyList<ReaderBookmarkResponse>>> GetBookmarksAsync(int page, int pageSize, CancellationToken ct = default);
    Task<Result<ReadingProgressResponse>> SaveProgressAsync(SaveReadingProgressRequest request, CancellationToken ct = default);
    Task<Result<ReadingProgressResponse>> ContinueReadingAsync(CancellationToken ct = default);
    Task<Result<IReadOnlyList<ReadingProgressResponse>>> GetHistoryAsync(int page, int pageSize, CancellationToken ct = default);
    Task<Result<bool>> ClearHistoryAsync(CancellationToken ct = default);
    Task<Result<RatingSummaryResponse>> RateAsync(Guid seriesId, UpsertRatingRequest request, CancellationToken ct = default);
    Task<Result<bool>> RemoveRatingAsync(Guid seriesId, CancellationToken ct = default);
    Task<Result<RatingSummaryResponse>> GetRatingSummaryAsync(Guid seriesId, CancellationToken ct = default);
    Task<Result<ReaderCommentResponse>> AddCommentAsync(Guid? seriesId, Guid? chapterId, CreateCommentRequest request, CancellationToken ct = default);
    Task<Result<ReaderCommentResponse>> UpdateCommentAsync(Guid id, UpdateCommentRequest request, CancellationToken ct = default);
    Task<Result<bool>> DeleteCommentAsync(Guid id, CancellationToken ct = default);
    Task<Result<IReadOnlyList<ReaderCommentResponse>>> GetCommentsAsync(Guid? seriesId, Guid? chapterId, int page, int pageSize, CancellationToken ct = default);
    Task<Result<ReaderActivitySummaryResponse>> GetActivitySummaryAsync(CancellationToken ct = default);
}

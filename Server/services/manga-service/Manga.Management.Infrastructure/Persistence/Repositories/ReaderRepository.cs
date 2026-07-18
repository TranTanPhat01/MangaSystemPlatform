using Manga.Management.Application.Abstractions;
using Manga.Management.Application.DTOs;
using Manga.Management.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Manga.Management.Infrastructure.Persistence.Repositories;

internal sealed class ReaderRepository(MangaManagementDbContext dbContext) : IReaderRepository
{
    public Task<ReaderFavorite?> GetFavoriteAsync(Guid userId, Guid seriesId, CancellationToken ct = default) => dbContext.ReaderFavorites.FirstOrDefaultAsync(x => x.UserId == userId && x.SeriesId == seriesId, ct);
    public Task<ReaderBookmark?> GetBookmarkAsync(Guid userId, Guid chapterId, Guid? pageId, CancellationToken ct = default) => dbContext.ReaderBookmarks.FirstOrDefaultAsync(x => x.UserId == userId && x.ChapterId == chapterId && x.PageId == pageId, ct);
    public Task<ReadingProgress?> GetProgressAsync(Guid userId, Guid seriesId, CancellationToken ct = default) => dbContext.ReadingProgresses.FirstOrDefaultAsync(x => x.UserId == userId && x.SeriesId == seriesId, ct);
    public Task<ReadingProgress?> GetLatestProgressAsync(Guid userId, CancellationToken ct = default) => dbContext.ReadingProgresses.OrderByDescending(x => x.LastReadAt).FirstOrDefaultAsync(x => x.UserId == userId, ct);
    public Task<ReadingHistory?> GetHistoryAsync(Guid userId, Guid chapterId, CancellationToken ct = default) => dbContext.ReadingHistories.FirstOrDefaultAsync(x => x.UserId == userId && x.ChapterId == chapterId, ct);
    public Task<SeriesRating?> GetRatingAsync(Guid userId, Guid seriesId, CancellationToken ct = default) => dbContext.SeriesRatings.FirstOrDefaultAsync(x => x.UserId == userId && x.SeriesId == seriesId, ct);
    public Task<ReaderComment?> GetCommentAsync(Guid id, CancellationToken ct = default) => dbContext.ReaderComments.FirstOrDefaultAsync(x => x.Id == id, ct);
    public async Task<IReadOnlyList<Guid>> GetFavoriteUserIdsAsync(Guid seriesId, CancellationToken ct = default) =>
        await dbContext.ReaderFavorites.AsNoTracking().Where(x => x.SeriesId == seriesId).Select(x => x.UserId).ToListAsync(ct);
    public async Task<IReadOnlyList<ReaderFavoriteResponse>> GetFavoritesAsync(Guid userId, int page, int size, CancellationToken ct = default) => await dbContext.ReaderFavorites.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).Skip((page - 1) * size).Take(size).Select(x => new ReaderFavoriteResponse { Id = x.Id, SeriesId = x.SeriesId, CreatedAt = x.CreatedAt }).ToListAsync(ct);
    public async Task<IReadOnlyList<ReaderBookmarkResponse>> GetBookmarksAsync(Guid userId, int page, int size, CancellationToken ct = default) => await dbContext.ReaderBookmarks.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).Skip((page - 1) * size).Take(size).Select(x => new ReaderBookmarkResponse { Id = x.Id, ChapterId = x.ChapterId, PageId = x.PageId, CreatedAt = x.CreatedAt }).ToListAsync(ct);
    public async Task<IReadOnlyList<ReadingProgressResponse>> GetHistoryAsync(Guid userId, int page, int size, CancellationToken ct = default) => await dbContext.ReadingHistories.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.LastReadAt).Skip((page - 1) * size).Take(size).Select(x => new ReadingProgressResponse { SeriesId = x.SeriesId, ChapterId = x.ChapterId, PageId = x.PageId, LastReadAt = x.LastReadAt }).ToListAsync(ct);
    public async Task<IReadOnlyList<ReaderCommentResponse>> GetCommentsAsync(Guid? seriesId, Guid? chapterId, int page, int size, CancellationToken ct = default) => await dbContext.ReaderComments.AsNoTracking().Where(x => x.SeriesId == seriesId && x.ChapterId == chapterId).OrderByDescending(x => x.CreatedAt).Skip((page - 1) * size).Take(size).Select(x => new ReaderCommentResponse { Id = x.Id, UserId = x.UserId, SeriesId = x.SeriesId, ChapterId = x.ChapterId, Content = x.Content, CreatedAt = x.CreatedAt, UpdatedAt = x.UpdatedAt }).ToListAsync(ct);
    public async Task<(int Count, double Average)> GetRatingSummaryAsync(Guid seriesId, CancellationToken ct = default) { var data = await dbContext.SeriesRatings.AsNoTracking().Where(x => x.SeriesId == seriesId).GroupBy(_ => 1).Select(g => new { Count = g.Count(), Average = g.Average(x => (double)x.Value) }).FirstOrDefaultAsync(ct); return data is null ? (0, 0) : (data.Count, Math.Round(data.Average, 2)); }
    public async Task<ReaderActivitySummaryResponse> GetActivitySummaryAsync(Guid userId, CancellationToken ct = default) => new() { FavoriteCount = await dbContext.ReaderFavorites.CountAsync(x => x.UserId == userId, ct), BookmarkCount = await dbContext.ReaderBookmarks.CountAsync(x => x.UserId == userId, ct), HistoryCount = await dbContext.ReadingHistories.CountAsync(x => x.UserId == userId, ct), RatingCount = await dbContext.SeriesRatings.CountAsync(x => x.UserId == userId, ct), CommentCount = await dbContext.ReaderComments.CountAsync(x => x.UserId == userId, ct) };
    public async Task<IReadOnlyList<ReadingHistory>> GetHistoryEntitiesAsync(Guid userId, CancellationToken ct = default) => await dbContext.ReadingHistories.Where(x => x.UserId == userId).ToListAsync(ct);
}

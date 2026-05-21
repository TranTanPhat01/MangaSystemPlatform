using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Services;

public interface IChapterService
{
    Task<Result<ChapterResponse>> CreateAsync(Guid seriesId, CreateChapterRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<ChapterResponse>>> GetBySeriesAsync(Guid seriesId, CancellationToken cancellationToken = default);
    Task<Result<ChapterResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<ChapterResponse>> UpdateStatusAsync(Guid id, UpdateChapterStatusRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<ChapterResponse>> SubmitChapterForReviewAsync(Guid chapterId, Guid currentUserId, CancellationToken cancellationToken = default);
}

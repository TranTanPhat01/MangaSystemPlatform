using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Services;

public interface IPageService
{
    Task<Result<PageResponse>> CreateAsync(Guid chapterId, CreatePageRequest request, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<PageResponse>>> GetByChapterAsync(Guid chapterId, CancellationToken cancellationToken = default);
    Task<Result<PageResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<PageResponse>> UpdateStatusAsync(Guid id, UpdatePageStatusRequest request, CancellationToken cancellationToken = default);
}

using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Services;

public interface IAnnotationService
{
    Task<Result<AnnotationResponse>> CreateAsync(Guid pageId, CreateAnnotationRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<AnnotationResponse>>> GetByPageAsync(Guid pageId, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

using Manga.Management.Application.Common;
using Manga.Management.Application.DTOs;

namespace Manga.Management.Application.Services;

public interface IStudioService
{
    Task<Result<StudioResponse>> CreateAsync(CreateStudioRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<StudioResponse>>> GetMineAsync(Guid currentUserId, CancellationToken cancellationToken = default);
    Task<Result<StudioResponse>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<StudioResponse>> AddMemberAsync(Guid studioId, AddStudioMemberRequest request, CancellationToken cancellationToken = default);
}

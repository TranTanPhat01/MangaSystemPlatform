using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;

namespace Manga.Identity.Application.Services;

public interface IUserAdminService
{
    Task<Result<IReadOnlyList<AdminUserResponse>>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, CancellationToken cancellationToken = default);
}

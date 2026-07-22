using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;

namespace Manga.Identity.Application.Services;

public interface IUserAdminService
{
    Task<IReadOnlyList<AssistantDirectoryItemResponse>> GetActiveAssistantsAsync(CancellationToken cancellationToken = default);
    Task<Result<PagedResponse<AdminUserListItemResponse>>> GetUsersAsync(AdminUserListQuery query, CancellationToken cancellationToken = default);
    Task<Result<AdminUserDetailResponse>> GetUserDetailAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result<IReadOnlyList<AdminRoleCatalogResponse>>> GetRoleCatalogAsync(CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> CreateUserAsync(CreateAdminUserRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> UpdateUserAsync(Guid userId, UpdateAdminUserRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<bool>> SoftDeleteUserAsync(Guid userId, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> LockUserAsync(Guid userId, LockUserRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> UnlockUserAsync(Guid userId, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<bool>> ResetPasswordAsync(Guid userId, ResetUserPasswordRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<bool>> RevokeSessionsAsync(Guid userId, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<AdminUserResponse>> UpdateRolesAsync(Guid userId, UpdateUserRolesRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
}

using Manga.Identity.Application.Common;
using Manga.Identity.Application.DTOs;

namespace Manga.Identity.Application.Services;

public interface IAdminRoleService
{
    Task<Result<AdminRoleCatalogResponse>> CreateAsync(CreateRoleRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<AdminRoleCatalogResponse>> UpdateAsync(Guid roleId, UpdateRoleRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<bool>> RetireAsync(Guid roleId, Guid actorUserId, CancellationToken cancellationToken = default);
    Task<Result<AdminRoleCatalogResponse>> ReplacePermissionsAsync(Guid roleId, ReplaceRolePermissionsRequest request, Guid actorUserId, CancellationToken cancellationToken = default);
}

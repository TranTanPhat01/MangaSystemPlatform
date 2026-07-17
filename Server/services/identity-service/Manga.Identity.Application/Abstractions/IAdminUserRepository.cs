using Manga.Identity.Application.DTOs;

namespace Manga.Identity.Application.Abstractions;

public interface IAdminUserRepository
{
    Task<PagedResponse<AdminUserListItemResponse>> SearchAsync(AdminUserListQuery query, CancellationToken cancellationToken = default);
    Task<AdminUserDetailResponse?> GetDetailAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AdminRoleCatalogResponse>> GetRoleCatalogAsync(CancellationToken cancellationToken = default);
    Task<int> CountActiveUsersInRoleAsync(string roleName, CancellationToken cancellationToken = default);
}

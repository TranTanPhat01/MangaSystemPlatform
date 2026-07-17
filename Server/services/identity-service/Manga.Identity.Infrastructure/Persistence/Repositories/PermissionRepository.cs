using Manga.Identity.Application.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace Manga.Identity.Infrastructure.Persistence.Repositories;

internal sealed class PermissionRepository(IdentityDbContext dbContext) : IPermissionRepository
{
    public async Task<IReadOnlyCollection<string>> GetKeysByRoleIdsAsync(IReadOnlyCollection<Guid> roleIds, CancellationToken cancellationToken = default)
    {
        if (roleIds.Count == 0)
        {
            return Array.Empty<string>();
        }

        return await dbContext.RolePermissions
            .Where(mapping => roleIds.Contains(mapping.RoleId))
            .Select(mapping => mapping.Permission!.Key)
            .Distinct()
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<Domain.Entities.Permission>> GetByKeysAsync(IReadOnlyCollection<string> keys, CancellationToken cancellationToken = default) =>
        await dbContext.Permissions.Where(permission => keys.Contains(permission.Key)).ToArrayAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Domain.Entities.Permission>> ListAsync(CancellationToken cancellationToken = default) =>
        await dbContext.Permissions.AsNoTracking().OrderBy(permission => permission.Group).ThenBy(permission => permission.Key).ToArrayAsync(cancellationToken);
}

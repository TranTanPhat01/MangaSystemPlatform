using Microsoft.EntityFrameworkCore;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Infrastructure.Persistence.Repositories;

internal sealed class RoleRepository : IRoleRepository
{
    private readonly IdentityDbContext _dbContext;

    public RoleRepository(IdentityDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Role>> ListAsync(CancellationToken cancellationToken = default) =>
        await _dbContext.Roles.OrderBy(role => role.Name).ToArrayAsync(cancellationToken);

    public Task<Role?> GetByNameAsync(string name, CancellationToken cancellationToken = default) =>
        _dbContext.Roles.FirstOrDefaultAsync(role => role.Name == name, cancellationToken);

    public Task<Role?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _dbContext.Roles
            .Include(role => role.RolePermissions)
            .ThenInclude(mapping => mapping.Permission)
            .FirstOrDefaultAsync(role => role.Id == id, cancellationToken);

    public Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default) =>
        _dbContext.Roles.AnyAsync(role => role.Name == name, cancellationToken);

    public async Task AddAsync(Role role, CancellationToken cancellationToken = default) =>
        await _dbContext.Roles.AddAsync(role, cancellationToken);
}

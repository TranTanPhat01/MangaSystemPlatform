using Microsoft.EntityFrameworkCore;
using Manga.Identity.Application.Abstractions;
using Manga.Identity.Application.DTOs;
using Manga.Identity.Domain.Enums;

namespace Manga.Identity.Infrastructure.Persistence.Repositories;

internal sealed class AdminUserRepository : IAdminUserRepository
{
    private readonly IdentityDbContext _dbContext;

    public AdminUserRepository(IdentityDbContext dbContext) => _dbContext = dbContext;

    public async Task<PagedResponse<AdminUserListItemResponse>> SearchAsync(AdminUserListQuery query, CancellationToken cancellationToken = default)
    {
        IQueryable<Domain.Entities.User> users = _dbContext.Users.AsNoTracking().Where(user => user.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            users = users.Where(user => user.Email.ToLower().Contains(search) || user.FullName.ToLower().Contains(search) || (user.Username != null && user.Username.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            var role = query.Role.Trim();
            users = users.Where(user => user.UserRoles.Any(userRole => userRole.Role!.Name == role));
        }

        if (Enum.TryParse<UserStatus>(query.Status, true, out var status))
        {
            var now = DateTime.UtcNow;
            users = status == UserStatus.Locked
                ? users.Where(user => user.Status == UserStatus.Locked || (user.LockoutUntil != null && user.LockoutUntil > now))
                : status == UserStatus.Active
                    ? users.Where(user => user.Status == UserStatus.Active && (user.LockoutUntil == null || user.LockoutUntil <= now))
                    : users.Where(user => user.Status == status);
        }

        users = (query.SortBy?.ToLowerInvariant(), query.SortDirection?.ToLowerInvariant()) switch
        {
            ("email", "asc") => users.OrderBy(user => user.Email),
            ("email", _) => users.OrderByDescending(user => user.Email),
            ("name", "asc") => users.OrderBy(user => user.FullName),
            ("name", _) => users.OrderByDescending(user => user.FullName),
            (_, "asc") => users.OrderBy(user => user.CreatedAt),
            _ => users.OrderByDescending(user => user.CreatedAt)
        };

        var totalItems = await users.CountAsync(cancellationToken);
        var items = await users
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(user => new AdminUserListItemResponse
            {
                Id = user.Id,
                DisplayName = user.FullName,
                Email = user.Email,
                Username = user.Username,
                Roles = user.UserRoles.Select(userRole => userRole.Role!.Name).OrderBy(name => name).ToArray(),
                Status = user.Status,
                LockoutUntil = user.LockoutUntil,
                EmailVerified = user.EmailVerified,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt
            })
            .ToArrayAsync(cancellationToken);

        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)query.PageSize);
        return new PagedResponse<AdminUserListItemResponse>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            HasNextPage = query.Page < totalPages,
            HasPreviousPage = query.Page > 1
        };
    }

    public async Task<AdminUserDetailResponse?> GetDetailAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var detail = await _dbContext.Users.AsNoTracking()
            .Where(user => user.Id == userId && user.DeletedAt == null)
            .Select(user => new AdminUserDetailResponse
            {
                Id = user.Id,
                DisplayName = user.FullName,
                Email = user.Email,
                Username = user.Username,
                Roles = user.UserRoles.Select(userRole => userRole.Role!.Name).OrderBy(name => name).ToArray(),
                Status = user.Status,
                EmailVerified = user.EmailVerified,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                LockoutUntil = user.LockoutUntil,
                Permissions = user.UserRoles
                    .SelectMany(userRole => userRole.Role!.RolePermissions)
                    .Select(rolePermission => rolePermission.Permission!.Key)
                    .Distinct()
                    .OrderBy(key => key)
                    .ToArray()
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (detail is null) return null;

        detail.RecentSecurityEvents = await _dbContext.AdminAuditEvents.AsNoTracking()
            .Where(auditEvent => auditEvent.TargetUserId == userId)
            .OrderByDescending(auditEvent => auditEvent.CreatedAt)
            .Take(10)
            .Select(auditEvent => new AdminSecurityEventResponse
            {
                ActorUserId = auditEvent.ActorUserId,
                Action = auditEvent.Action,
                CreatedAt = auditEvent.CreatedAt
            })
            .ToArrayAsync(cancellationToken);
        return detail;
    }

    public async Task<IReadOnlyList<AdminRoleCatalogResponse>> GetRoleCatalogAsync(CancellationToken cancellationToken = default) =>
        await _dbContext.Roles.AsNoTracking()
            .Where(role => !role.IsRetired)
            .OrderBy(role => role.Name)
            .Select(role => new AdminRoleCatalogResponse
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                Permissions = role.RolePermissions.Select(mapping => mapping.Permission!.Key).OrderBy(key => key).ToArray()
            })
            .ToArrayAsync(cancellationToken);

    public Task<int> CountActiveUsersInRoleAsync(string roleName, CancellationToken cancellationToken = default) =>
        _dbContext.Users.CountAsync(user => user.DeletedAt == null && user.Status == UserStatus.Active && user.UserRoles.Any(userRole => userRole.Role!.Name == roleName), cancellationToken);
}

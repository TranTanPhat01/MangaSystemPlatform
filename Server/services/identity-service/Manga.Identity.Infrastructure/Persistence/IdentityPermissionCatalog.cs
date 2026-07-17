using Manga.BuildingBlocks.Authorization;
using Manga.Identity.Domain.Entities;

namespace Manga.Identity.Infrastructure.Persistence;

public sealed record PermissionSeed(Guid Id, string Key, string Name, string Group, string? Description);

public static class IdentityPermissionCatalog
{
    private static readonly DateTime SeededAt = new(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc);

    public static readonly IReadOnlyList<PermissionSeed> Permissions = new PermissionSeed[]
    {
        new(IdentityPermissionIds.AdminUserRead, PermissionKeys.AdminUserRead, "Read users", "Admin", "View user accounts."),
        new(IdentityPermissionIds.AdminUserManage, PermissionKeys.AdminUserManage, "Manage users", "Admin", "Change user status and roles."),
        new(IdentityPermissionIds.AdminUserCreate, PermissionKeys.AdminUserCreate, "Create users", "Admin", "Create user accounts."),
        new(IdentityPermissionIds.AdminUserUpdate, PermissionKeys.AdminUserUpdate, "Update users", "Admin", "Update user profiles, status, and roles."),
        new(IdentityPermissionIds.AdminUserDelete, PermissionKeys.AdminUserDelete, "Delete users", "Admin", "Soft delete user accounts."),
        new(IdentityPermissionIds.AdminUserResetPassword, PermissionKeys.AdminUserResetPassword, "Reset user passwords", "Admin", "Reset user passwords."),
        new(IdentityPermissionIds.AdminUserSessionRevoke, PermissionKeys.AdminUserSessionRevoke, "Revoke user sessions", "Admin", "Revoke all active refresh tokens."),
        new(IdentityPermissionIds.AdminRoleRead, PermissionKeys.AdminRoleRead, "Read roles", "Admin", "View configured roles."),
        new(IdentityPermissionIds.AdminRoleManage, PermissionKeys.AdminRoleManage, "Manage roles", "Admin", "Create, update, and retire custom roles."),
        new(IdentityPermissionIds.AdminRolePermissionManage, PermissionKeys.AdminRolePermissionManage, "Manage role permissions", "Admin", "Replace permissions assigned to custom roles."),
        new(IdentityPermissionIds.AdminMonitoringRead, PermissionKeys.AdminMonitoringRead, "Read monitoring", "Admin", "View service health."),
        new(IdentityPermissionIds.AdminOutboxRead, PermissionKeys.AdminOutboxRead, "Read outbox", "Admin", "View outbox messages."),
        new(IdentityPermissionIds.AdminOutboxRetry, PermissionKeys.AdminOutboxRetry, "Retry outbox", "Admin", "Retry failed outbox messages."),
        new(IdentityPermissionIds.AdminAuditRead, PermissionKeys.AdminAuditRead, "Read audit", "Admin", "View audit history."),
        new(IdentityPermissionIds.AdminSystemSettingsRead, PermissionKeys.AdminSystemSettingsRead, "Read system settings", "Admin", "View system settings."),
        new(IdentityPermissionIds.SeriesCreate, PermissionKeys.SeriesCreate, "Create series", "Business", null),
        new(IdentityPermissionIds.SeriesManageOwn, PermissionKeys.SeriesManageOwn, "Manage own series", "Business", null),
        new(IdentityPermissionIds.PageUpload, PermissionKeys.PageUpload, "Upload page", "Business", null),
        new(IdentityPermissionIds.TaskReadAssigned, PermissionKeys.TaskReadAssigned, "Read assigned tasks", "Business", null),
        new(IdentityPermissionIds.TaskSubmit, PermissionKeys.TaskSubmit, "Submit task", "Business", null),
        new(IdentityPermissionIds.EditorialReviewRead, PermissionKeys.EditorialReviewRead, "Read editorial review", "Business", null),
        new(IdentityPermissionIds.EditorialReviewManage, PermissionKeys.EditorialReviewManage, "Manage editorial review", "Business", null),
        new(IdentityPermissionIds.BoardProposalRead, PermissionKeys.BoardProposalRead, "Read board proposals", "Business", null),
        new(IdentityPermissionIds.BoardProposalVote, PermissionKeys.BoardProposalVote, "Vote board proposals", "Business", null),
        new(IdentityPermissionIds.BoardRankingRead, PermissionKeys.BoardRankingRead, "Read rankings", "Business", null),
        new(IdentityPermissionIds.FileReadOwnOrAssigned, PermissionKeys.FileReadOwnOrAssigned, "Read related files", "Business", null),
        new(IdentityPermissionIds.NotificationReadOwn, PermissionKeys.NotificationReadOwn, "Read own notifications", "Business", null)
    };

    public static IReadOnlyList<RolePermission> RolePermissions => BuildRolePermissions();

    public static IReadOnlyCollection<string> GetPermissionKeysForRole(Guid roleId) =>
        BuildRolePermissions()
            .Where(mapping => mapping.RoleId == roleId)
            .Join(Permissions, mapping => mapping.PermissionId, permission => permission.Id, (_, permission) => permission.Key)
            .ToArray();

    public static IReadOnlyList<Permission> BuildPermissions() => Permissions
        .Select(permission => new Permission
        {
            Id = permission.Id, Key = permission.Key, Name = permission.Name, Group = permission.Group,
            Description = permission.Description, IsSystem = true, CreatedAt = SeededAt
        })
        .ToArray();

    private static IReadOnlyList<RolePermission> BuildRolePermissions()
    {
        var mappings = new List<RolePermission>();
        Add(IdentityRoleIds.Admin, Permissions.Select(permission => permission.Id));
        Add(IdentityRoleIds.Mangaka, new[] { IdentityPermissionIds.SeriesCreate, IdentityPermissionIds.SeriesManageOwn, IdentityPermissionIds.PageUpload, IdentityPermissionIds.FileReadOwnOrAssigned, IdentityPermissionIds.NotificationReadOwn });
        Add(IdentityRoleIds.Assistant, new[] { IdentityPermissionIds.TaskReadAssigned, IdentityPermissionIds.TaskSubmit, IdentityPermissionIds.FileReadOwnOrAssigned, IdentityPermissionIds.NotificationReadOwn });
        Add(IdentityRoleIds.TantouEditor, new[] { IdentityPermissionIds.EditorialReviewRead, IdentityPermissionIds.EditorialReviewManage, IdentityPermissionIds.NotificationReadOwn });
        Add(IdentityRoleIds.EditorialBoard, new[] { IdentityPermissionIds.BoardProposalRead, IdentityPermissionIds.BoardProposalVote, IdentityPermissionIds.BoardRankingRead, IdentityPermissionIds.NotificationReadOwn });
        return mappings;

        void Add(Guid roleId, IEnumerable<Guid> permissionIds) => mappings.AddRange(permissionIds.Select(permissionId => new RolePermission { RoleId = roleId, PermissionId = permissionId, CreatedAt = SeededAt }));
    }
}

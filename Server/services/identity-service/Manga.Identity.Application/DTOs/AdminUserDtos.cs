using System.ComponentModel.DataAnnotations;
using Manga.Identity.Domain.Enums;

namespace Manga.Identity.Application.DTOs;

public sealed class AdminUserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string FullName { get; set; } = string.Empty;
    public UserStatus Status { get; set; }
    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class AdminUserListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? Role { get; set; }
    public string? Status { get; set; }
    public string? SortBy { get; set; } = "createdAt";
    public string? SortDirection { get; set; } = "desc";
}

public class AdminUserListItemResponse
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Username { get; set; }
    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    public UserStatus Status { get; set; }
    public bool EmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public sealed class AdminUserDetailResponse : AdminUserListItemResponse
{
    public DateTime? LockoutUntil { get; set; }
    public IReadOnlyCollection<string> Permissions { get; set; } = Array.Empty<string>();
    public IReadOnlyCollection<AdminSecurityEventResponse> RecentSecurityEvents { get; set; } = Array.Empty<AdminSecurityEventResponse>();
}

public sealed class AdminSecurityEventResponse
{
    public Guid ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public sealed class AdminRoleCatalogResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IReadOnlyCollection<string> Permissions { get; set; } = Array.Empty<string>();
}

public sealed class PagedResponse<T>
{
    public IReadOnlyCollection<T> Items { get; set; } = Array.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public sealed class UpdateUserStatusRequest
{
    [Required]
    public UserStatus Status { get; set; }
    public DateTime? LockoutUntil { get; set; }
}

public sealed class UpdateUserRolesRequest
{
    [Required]
    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
}

public sealed class CreateAdminUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
}

public sealed class UpdateAdminUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}

public sealed class LockUserRequest
{
    public DateTime? LockoutUntil { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public sealed class ResetUserPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public sealed class UpdateRoleRequest
{
    public string? Description { get; set; }
}

public sealed class ReplaceRolePermissionsRequest
{
    public IReadOnlyCollection<string> PermissionKeys { get; set; } = Array.Empty<string>();
}

public sealed class AdminAuditLogQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? ActorUserId { get; set; }
    public Guid? TargetUserId { get; set; }
    public string? Action { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

public sealed class AdminAuditLogResponse
{
    public Guid Id { get; set; }
    public Guid ActorUserId { get; set; }
    public Guid TargetUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}

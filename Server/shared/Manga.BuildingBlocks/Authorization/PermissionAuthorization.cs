using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Manga.BuildingBlocks.Authorization;

public static class PermissionClaimTypes
{
    public const string Permission = "permission";
    public const string UserStatus = "user_status";
}

public static class PermissionPolicies
{
    public const string RequireAdminUserRead = nameof(RequireAdminUserRead);
    public const string RequireAdminUserManage = nameof(RequireAdminUserManage);
    public const string RequireAdminUserCreate = nameof(RequireAdminUserCreate);
    public const string RequireAdminUserUpdate = nameof(RequireAdminUserUpdate);
    public const string RequireAdminUserDelete = nameof(RequireAdminUserDelete);
    public const string RequireAdminUserResetPassword = nameof(RequireAdminUserResetPassword);
    public const string RequireAdminUserSessionRevoke = nameof(RequireAdminUserSessionRevoke);
    public const string RequireAdminRoleRead = nameof(RequireAdminRoleRead);
    public const string RequireAdminRoleManage = nameof(RequireAdminRoleManage);
    public const string RequireAdminRolePermissionManage = nameof(RequireAdminRolePermissionManage);
    public const string RequireAdminMonitoringRead = nameof(RequireAdminMonitoringRead);
    public const string RequireAdminOutboxRead = nameof(RequireAdminOutboxRead);
    public const string RequireAdminOutboxRetry = nameof(RequireAdminOutboxRetry);
    public const string RequireAdminAuditRead = nameof(RequireAdminAuditRead);
}

public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true || !context.User.IsActive() || !context.User.HasPermission(requirement.Permission))
        {
            return Task.CompletedTask;
        }

        context.Succeed(requirement);
        return Task.CompletedTask;
    }
}

public static class PermissionClaimsPrincipalExtensions
{
    public static bool HasPermission(this ClaimsPrincipal principal, string permission) =>
        principal.Claims.Any(claim =>
            claim.Type == PermissionClaimTypes.Permission &&
            string.Equals(claim.Value, permission, StringComparison.Ordinal));

    public static bool IsActive(this ClaimsPrincipal principal) =>
        string.Equals(principal.FindFirstValue(PermissionClaimTypes.UserStatus), "Active", StringComparison.Ordinal);
}

public static class PermissionAuthorizationServiceCollectionExtensions
{
    public static IServiceCollection AddPermissionPolicies(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddAuthorization(options =>
        {
            AddPolicy(options, PermissionPolicies.RequireAdminUserRead, PermissionKeys.AdminUserRead);
            AddPolicy(options, PermissionPolicies.RequireAdminUserManage, PermissionKeys.AdminUserManage);
            AddPolicy(options, PermissionPolicies.RequireAdminUserCreate, PermissionKeys.AdminUserCreate);
            AddPolicy(options, PermissionPolicies.RequireAdminUserUpdate, PermissionKeys.AdminUserUpdate);
            AddPolicy(options, PermissionPolicies.RequireAdminUserDelete, PermissionKeys.AdminUserDelete);
            AddPolicy(options, PermissionPolicies.RequireAdminUserResetPassword, PermissionKeys.AdminUserResetPassword);
            AddPolicy(options, PermissionPolicies.RequireAdminUserSessionRevoke, PermissionKeys.AdminUserSessionRevoke);
            AddPolicy(options, PermissionPolicies.RequireAdminRoleRead, PermissionKeys.AdminRoleRead);
            AddPolicy(options, PermissionPolicies.RequireAdminRoleManage, PermissionKeys.AdminRoleManage);
            AddPolicy(options, PermissionPolicies.RequireAdminRolePermissionManage, PermissionKeys.AdminRolePermissionManage);
            AddPolicy(options, PermissionPolicies.RequireAdminMonitoringRead, PermissionKeys.AdminMonitoringRead);
            AddPolicy(options, PermissionPolicies.RequireAdminOutboxRead, PermissionKeys.AdminOutboxRead);
            AddPolicy(options, PermissionPolicies.RequireAdminOutboxRetry, PermissionKeys.AdminOutboxRetry);
            AddPolicy(options, PermissionPolicies.RequireAdminAuditRead, PermissionKeys.AdminAuditRead);
        });

        return services;
    }

    private static void AddPolicy(AuthorizationOptions options, string policyName, string permission) =>
        options.AddPolicy(policyName, policy => policy.RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(permission)));
}
